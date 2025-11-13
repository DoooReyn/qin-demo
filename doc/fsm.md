# 有限状态机（FSM）

提供一个类型安全、规则不可变、带切换钩子与驻留时长统计的通用有限状态机实现，位于：

- assets/qin/foundation/fsm.typings.ts（类型定义）
- assets/qin/foundation/fsm.ts（核心实现）
- assets/qin/foundation/fsm.decorator.ts（类装饰器）
- assets/qin/foundation/index.ts 已统一导出

## 设计要点

- 规则不可变：构造时对 `transitions` 深冻结，运行期无法修改
- 切换钩子：
  - 全局：`onBeforeTransition`、`onAfterTransition`
  - 本地：`stateCallbacks[state].onExit`、`stateCallbacks[state].onEnter`
  - 执行顺序：全局 before → 本地 from.onExit → 状态切换/时间戳更新 → 本地 to.onEnter → 全局 after
- 驻留统计：记录进入状态的时间 `enteredAt`，`getStateDuration()` 返回当前状态已驻留毫秒
- 装饰器：`@StateMachine(config)` 在类实例化时自动注入 `fsm`

## 核心 API

类型参数：`FiniteStateMachine<State, Event, Context = any>`

- `constructor(config: FSMConfig<State, Event, Context>)`
  - `initial`: 初始状态
  - `transitions`: 状态迁移表，形如 `{ state: { event: nextState } }`
  - `onBeforeTransition?(from, to, by, context): boolean|void|Promise` 返回 false 阻止切换
  - `onAfterTransition?(from, to, by, context): void|Promise`
  - `stateCallbacks?`: 每状态本地回调 `{ [state]: { onExit?, onEnter? } }`
- `state`: 当前状态（只读 getter）
- `enteredAt`: 进入当前状态的时间戳（ms）
- `can(event)`: 是否存在从当前状态出发的该事件迁移
- `transition(event, context?)`: 触发事件，返回 Promise<boolean>
- `getStateDuration()`: 当前状态驻留毫秒数
- `getTransitions()`: 迁移表（只读）

## 快速上手

```ts
import { FiniteStateMachine, FSMConfig } from "@/qin/foundation";

type State = "idle" | "loading" | "success" | "error";
type Event = "start" | "ok" | "fail" | "reset";

const config: FSMConfig<State, Event> = {
  initial: "idle",
  transitions: {
    idle:    { start: "loading" },
    loading: { ok: "success", fail: "error" },
    success: { reset: "idle" },
    error:   { reset: "idle" },
  },
  onBeforeTransition(from, to, by, ctx) {
    // 返回 false 可阻止切换
  },
  onAfterTransition(from, to, by, ctx) {
    // 切换成功后的处理
  },
  stateCallbacks: {
    loading: {
      async onEnter(to, from, by) {
        // 进入 loading
      },
      async onExit(from, to, by) {
        // 离开 loading
      },
    },
  },
};

const fsm = new FiniteStateMachine<State, Event>(config);
await fsm.transition("start");
console.log(fsm.state); // "loading"
console.log(fsm.getStateDuration()); // 已驻留毫秒
```

## 使用装饰器

```ts
import { StateMachine, FSMConfig } from "@/qin/foundation";

type State = "idle" | "loading" | "done";
type Event = "start" | "finish" | "reset";

const cfg: FSMConfig<State, Event> = {
  initial: "idle",
  transitions: {
    idle: { start: "loading" },
    loading: { finish: "done" },
    done: { reset: "idle" },
  },
  stateCallbacks: {
    idle: { onExit: () => {/* ... */} },
    loading: { onEnter: () => {/* ... */} },
    done: { onEnter: () => {/* ... */} },
  },
};

@StateMachine<State, Event>(cfg)
class Loader {
  // 装饰器会在构造时注入 fsm
  public fsm!: FiniteStateMachine<State, Event>;

  async start() {
    if (this.fsm.can("start")) {
      await this.fsm.transition("start");
    }
  }
}

const loader = new Loader();
loader.start();
```

## 完整示例：关卡生命周期

```ts
import { FiniteStateMachine, FSMConfig } from "@/qin/foundation";

type State = "boot" | "menu" | "playing" | "paused" | "gameover";
type Event = "toMenu" | "startGame" | "pause" | "resume" | "die" | "restart";

const config: FSMConfig<State, Event, { score?: number }> = {
  initial: "boot",
  transitions: {
    boot:    { toMenu: "menu" },
    menu:    { startGame: "playing" },
    playing: { pause: "paused", die: "gameover" },
    paused:  { resume: "playing", die: "gameover" },
    gameover:{ restart: "menu" },
  },
  onBeforeTransition(from, to, by, ctx) {
    // 例如：阻止在未保存进度时从 paused -> menu（这里只演示返回值）
    if (from === "paused" && to === "menu") return false;
  },
  onAfterTransition(from, to, by, ctx) {
    // 记录埋点等
    console.log(`[fsm] ${String(from)} -> ${String(to)} by ${String(by)}`);
  },
  stateCallbacks: {
    playing: {
      onEnter(to, from, by, ctx) {
        // 开始计时或恢复计时
      },
      onExit(from, to, by) {
        // 暂停计时、保存片段
      },
    },
    gameover: {
      onEnter() {
        // 展示 GameOver UI
      },
    },
  },
};

const fsm = new FiniteStateMachine<State, Event, { score?: number }>(config);

await fsm.transition("toMenu");  // boot -> menu
await fsm.transition("startGame"); // menu -> playing

// 一段时间后
console.log(`playing for ${fsm.getStateDuration()} ms`);
await fsm.transition("pause");    // playing -> paused
await fsm.transition("resume");   // paused -> playing
await fsm.transition("die", { score: 12345 }); // playing -> gameover
```

## 注意事项

- 若 `onBeforeTransition` 返回 `false`，本次切换被取消，后续本地回调与全局 after 均不会执行
- `transitions` 与 `stateCallbacks` 在构造时会被深冻结，请一次性定义完整规则
- `getStateDuration()` 依赖内部时间源（`ability/time`），请确保全局时间正常推进

## 版本与变更

- 初始版本：支持规则不可变、全局/本地回调与驻留时长统计、类装饰器
