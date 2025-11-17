# UI 管理系统 设计方案 v1

> 本文档基于前期规划与讨论，仅覆盖本轮 MVP 范围。

---

## 1. 总体目标与定位

- **目标**：为项目提供一套统一的 UI 管理系统，用于：
  - UI 交互表现与导航
  - 消息与数据更新订阅
  - 资源管理（加载、缓存、清理）
  - 严格的 UI 生命周期管理
- **目标用户**：项目内开发者
- **集成方式**：作为依赖项注册到现有 `ioc` 系统，例如通过 `ioc.ui` 访问。

---

## 2. UI 类型与分层

### 2.1 UI 类型

系统支持 4 大类型：

- **Screen**（一级页面）

  - 顶级界面，如主界面、战斗主场景
  - 同一时刻只允许一个实例存在
  - 默认缓存策略：**即时销毁**（DestroyImmediately）

- **Page**（二级页面）

  - 次级界面，如背包、任务、角色详情等
  - 支持导航与缓存
  - 默认缓存策略：**LRU**，默认最大缓存数量：**3**

- **Popup**（弹窗）

  - 弹窗界面，如确认框、设置、提示等
  - 支持多弹窗堆叠
  - 支持模态 / 非模态、遮罩点击关闭配置

- **Overlay**（全局悬浮层）
  - 示例：Tips、飘字、HUD、引导遮罩等
  - 不参与导航栈
  - 固定缓存策略：**不销毁（Persistent）**
  - 约定子类型：
    - `Toast`：轻提示 / 飘字
    - `Drawer`：抽屉面板
    - `Marquee`：跑马灯
    - `Guide`：引导层

### 2.2 节点层级结构

在 `MainAtom` 的 `root` 下挂载统一的 `UIRoot`：

```text
MainAtom.root
  └─ UIRoot
      ├─ ScreenLayer      // Screen 根节点
      ├─ PageLayer        // Page 根节点
      ├─ PopupLayer       // Popup 根节点 + Mask 节点
      │    └─ MaskNode
      └─ OverlayLayer     // Overlay 根节点
           ├─ ToastOverlayRoot
           ├─ DrawerOverlayRoot
           ├─ MarqueeOverlayRoot
           └─ GuideOverlayRoot
```

层级越上，视觉上越“在上面”，点击事件也更优先被上层拦截。

---

## 3. 导航与栈设计

### 3.1 Screen 导航

- **特性**：
  - 顶层界面，单实例
  - 默认缓存策略：DestroyImmediately
- **导航接口示意**：

```ts
ioc.ui.openScreen(keyOrClass, params?);
```

- **行为**：
  - 若存在当前 Screen：
    - 调用当前 Screen 的 `onViewWillDisappear` → 出场动画 → `onViewDidDisappear`
    - 根据缓存策略决定是否调用 `onViewDisposed` 并销毁
  - 创建/取出新 Screen：
    - 首次：`onViewCreated`
    - 然后：`onViewWillAppear(params)` → 入场动画 → `onViewDidAppear`

### 3.2 Page 导航（PageStack）

- Page 导航基于栈：

```text
PageStack: [Page1, Page2, Page3, ...]
```

- 打开 Page：

```ts
ioc.ui.openPage(keyOrClass, params?);
```

- 流程：

  1. 当前顶部 Page 执行 `onViewWillDisappear` → 出场动画 → `onViewDidDisappear`
  2. 获取/创建新 Page：
     - 首次：`onViewCreated`
  3. 调用 `onViewWillAppear(params)` → 入场动画 → `onViewDidAppear`
  4. Page 入栈

- 后退：

```ts
ioc.ui.back(); // 若无 Popup，则作用于 Page 栈
```

- 行为：
  1. 若存在 Popup 栈，优先处理 Popup（见下文）
  2. 否则弹出顶部 Page：
     - 顶部 Page：`onViewWillDisappear` → 出场动画 → `onViewDidDisappear` → 按缓存策略处理
     - 恢复新的顶部 Page：`onViewWillAppear` → 入场动画 → `onViewDidAppear` → `onViewFocus`

### 3.3 Popup 导航与堆叠

- 弹窗栈：

```text
PopupStack: [A, B, C, ...]
```

- 打开 Popup：

```ts
ioc.ui.openPopup(keyOrClass, params?);
```

- 行为：

  - 若栈中**不存在**同 key：
    - 获取/创建 Popup，`onViewCreated?` → `onViewWillAppear` → 入场动画 → `onViewDidAppear`
    - 入栈
  - 若栈中**已存在**同 key（重复激活）：
    - 进行“去重 + 提升”：
      - 例：`A -> B -> C -> D -> B` 再次打开 B：
        - 移除 B 之后的 [C, D]
        - 将 B 提到栈顶
        - 最终栈：`A -> B`
    - 调用 B 的 `onViewFocus()`（不必重复整套 appear 动画，可选）

- 关闭弹窗：

```ts
ioc.ui.closeTopPopup();
ioc.ui.closePopup(keyOrClass);
```

- 栈顶关闭流程：

  1. `onViewWillDisappear`
  2. 出场动画
  3. `onViewDidDisappear`
  4. 根据缓存策略（默认 LRU）决定是否 `onViewDisposed` + 销毁
  5. 若栈中仍有 Popup 且为焦点：
     - 顶部 Popup 执行 `onViewWillAppear` → 入场动画 → `onViewDidAppear` → `onViewFocus`

- 与 Screen/Page 的关系：
  - 关闭当前 Screen/Page 时，自动关闭其上的所有 Popup（清空相关栈）。

### 3.4 Overlay

- 不参与导航栈。
- 管理方式：

```ts
ioc.ui.showOverlay(keyOrClass, params?);
ioc.ui.hideOverlay(keyOrClass);
```

- 子类型：

  - ToastOverlay：轻提示
  - DrawerOverlay：抽屉层
  - MarqueeOverlay：跑马灯
  - GuideOverlay：引导

- 缓存：
  - 固定为 Persistent，创建一次后常驻，显隐由调用方通过 API 控制。

---

## 4. 生命周期与焦点

### 4.1 生命周期钩子

为避免与 Cocos 组件生命周期混淆，UI 使用带 `View` 前缀的语义化钩子：

```ts
interface IUIView {
  onViewCreated?(): void; // 首次创建完成（节点和组件就绪）
  onViewWillAppear?(params?: any): void; // 即将显示（动画前）
  onViewDidAppear?(): void; // 显示完成（动画后，可交互）
  onViewWillDisappear?(): void; // 即将隐藏/关闭（动画前）
  onViewDidDisappear?(): void; // 隐藏/关闭完成（动画后）
  onViewDisposed?(): void; // 彻底销毁（节点和资源已释放）

  /**
   * 视图在其所属层中重新获得“前台焦点”时触发：
   * - 视图重复激活（如 Popup 栈中 B 再次被打开并提升为栈顶）
   * - 导航/回退导致该视图重新成为当前可交互视图
   */
  onViewFocus?(): void;
}
```

### 4.2 打开/关闭时序

#### 打开流程（Page/Popup）

```text
openX(keyOrClass, params)

1. 从 UICacheManager 获取或实例化节点
2. 若首次：调用 onViewCreated()
3. 调用 onViewWillAppear(params)
4. UIAnimator 执行 enter 动画（Tweener）
5. 动画完成后调用 onViewDidAppear()
6. 更新栈/状态
```

#### 关闭流程

```text
closeX(...)

1. 调用 onViewWillDisappear()
2. UIAnimator 执行 exit 动画
3. 动画完成后调用 onViewDidDisappear()
4. 按缓存策略：
   - DestroyImmediately:
       onViewDisposed() → 销毁节点与资源
   - LRU / Persistent:
       缓存对象，交由 UICacheManager 管理
5. 更新栈/状态
```

### 4.3 焦点获取时序

- **重复激活**（如 Popup B 再次打开并提升到栈顶）：

```text
1. 调整 PopupStack，去除 B 之后的中间弹窗
2. 调用目标视图 onViewFocus()
```

- **回退到当前视图**（如 Page3 → back → Page2）：

```text
1. 顶部 Page3 执行关闭流程
2. 新顶部 Page2：
   - onViewWillAppear()
   - 入场动画
   - onViewDidAppear()
   - onViewFocus()
```

- 在 Tweener 中注册动画库（lib），
- UIConfig 中只需指定 `enterTweenLib` / `exitTweenLib`。

### 5.2 UIAnimator 与 Tweener（概念）

- `UIAnimator` 封装动画逻辑（概念层）：

  - 根据 UIConfig 拿到 lib 名称
  - 调用 `ioc.tweener.play(node, lib, args?)`
  - 提供 Promise/回调，以便 UIManager 在动画结束后再触发生命周期钩子。

- 默认动画（可选）：
  - Screen/Page/Popup 可定义一套通用 default lib，例如：
    - `ui-screen-in`, `ui-screen-out`
    - `ui-page-in`, `ui-page-out`
    - `ui-popup-in`, `ui-popup-out`

### 5.3 当前实现中的动画策略

> 本节描述的是 MVP 中 `UIManager` 已落地的实际动画调用时机，便于和代码对上。

- **配置入口**：

  - `UIConfig.enterTweenLib?: string`：进场动画使用的 Tweener 库名。
  - `UIConfig.exitTweenLib?: string`：退场动画使用的 Tweener 库名。
  - 若未配置或 `ioc.tweener` 不存在，则该视图不开启动画，直接走生命周期。

- **调用方式**：

  - 内部通过私有方法：

    ```ts
    __playEnterTween(config, node); // 使用 enterTweenLib
    __playExitTween(config, node); // 使用 exitTweenLib
    ```

  - 两者都简单地调用 `ioc.tweener.play(node, lib, { duration: 0.3 })`，具体 easing/细节由对应 Tweener 条目（如 `tweener-popup-in/out`）负责。

- **Screen 动画时序**：

  - 关闭旧 Screen：
    - `onViewWillDisappear()`
    - 执行退出动画 `exitTweenLib`
    - `onViewDidDisappear()` → `onViewDisposed()` → 销毁节点
  - 打开新 Screen：
    - `onViewWillAppear(params)`
    - 执行进入动画 `enterTweenLib`
    - `onViewDidAppear()`

- **Page 动画时序**：

  - 打开新 Page 时：

    - 若存在旧栈顶 Page：
      - 旧 Page：`onViewWillDisappear()` → 退出动画 → `onViewDidDisappear()`
    - 新 Page：
      - `onViewWillAppear(params)` → 进入动画 → `onViewDidAppear()` → `onViewFocus()`

  - 关闭 Page 时：

    - 被关闭的栈顶 Page：
      - `onViewWillDisappear()` → 退出动画 → `onViewDidDisappear()` → `onViewDisposed()` → 销毁节点
    - 新栈顶 Page（若有）：
      - `onViewWillAppear()` → `onViewDidAppear()` → `onViewFocus()`

  - **重复激活 Page（栈中已有同 config）**：
    - 只截断栈并将目标 Page 提到栈顶，**不播放动画**，仅调用 `onViewFocus()`。

- **Popup 动画时序**：

  - 打开新 Popup：

    - `onViewWillAppear(params)` → 进入动画 → `onViewDidAppear()` → `onViewFocus()`
    - 入栈并更新遮罩状态。

  - 关闭栈顶 Popup：

    - 栈顶 Popup：`onViewWillDisappear()` → 退出动画 → `onViewDidDisappear()` → `onViewDisposed()` → 销毁节点
    - 若栈中仍有 Popup：栈顶 Popup 执行 `onViewWillAppear()` → `onViewDidAppear()` → `onViewFocus()`。

  - 通过 `closePopup(keyOrClass)` 关闭指定 Popup 时，仅对目标弹窗执行上述关闭时序；若关闭的是栈顶，会额外唤醒新的栈顶弹窗。

  - **重复激活 Popup（栈中已有同 config）**：
    - 截断栈到该 Popup，**不重复播放动画**，仅调用其 `onViewFocus()`。

- **clearPage / clearPopup 的动画策略**：

  - 目前实现中不再区分 `force` 模式，`clearPage` / `clearPopup` 始终按“正常关闭流程”遍历整个栈：

    - 依次对栈内视图执行：`onViewWillDisappear()` →（无进/退动画）→ `onViewDidDisappear()`；
    - 然后根据各自的 `cachePolicy`：
      - `DestroyImmediately`：调用 `onViewDisposed()` 后销毁节点；
      - `LRU` / `Persistent`：将实例交给缓存管理（在缓存淘汰时调用 `onViewDisposed()` 并销毁节点）。
    - 清空 Popup 后，若 Page 栈仍有元素，则对 Page 栈顶调用 `onViewFocus()`；清空 Page 后，若 Screen 仍存在，则对 Screen 调用 `onViewFocus()`。

---

## 6. 缓存与资源管理

### 6.1 UIConfig

逻辑上每个 UI 对应一个配置：

```ts
interface UIConfig {
  key: string;
  type: "Screen" | "Page" | "Popup" | "Overlay";
  overlaySubtype?: "Toast" | "Drawer" | "Marquee" | "Guide";

  prefabPath: string;
  controller: Constructor<IUIView>;

  cachePolicy: "DestroyImmediately" | "LRU" | "Persistent";
  cacheCapacity?: number; // LRU 有效

  enterTweenLib?: string;
  exitTweenLib?: string;

  modal?: boolean; // Popup
  closeOnMaskClick?: boolean; // Popup
}
```

### 6.2 UICacheManager

- **Screen**：`DestroyImmediately`
- **Page**：`LRU(capacity = 3)` 为默认，可针对个别 Page 调整策略
- **Popup**：默认 `LRU`，全局容量可配置
- **Overlay**：固定 `Persistent`

内部结构示意：

```text
UICacheManager
  ├─ screenCache: Map<key, CachedUI>               // 通常立即销毁或很小
  ├─ pageCacheLRU: LRUList<key, CachedUI>          // capacity = 3（默认）
  ├─ popupCacheLRU: LRUList<key, CachedUI>         // capacity = 配置项
  └─ overlayCache: Map<key, CachedUI>              // Persistent
```

- 与 `AssetLoader` 集成：
  - 所有 Prefab/资源通过 `ioc.loader` 统一加载/释放
  - UICacheManager 决定何时调用释放逻辑。

---

## 7. 遮罩与模态

### 7.1 结构

```text
PopupLayer
  ├─ MaskNode
  ├─ Popup_A
  ├─ Popup_B
  └─ ...
```

### 7.2 规则

- 打开 Popup 时：

  - 若 `modal = true`：
    - 显示 MaskNode，拦截事件
    - 若 `closeOnMaskClick = true`：点击 MaskNode 触发关闭当前栈顶 Popup
  - 若 `modal = false`：
    - 可不显示遮罩，或显示但不拦截（视设计实现）

- 关闭 Popup：
  - 若栈内仍有模态 Popup：Mask 绑定到新的栈顶
  - 否则隐藏 MaskNode。

---

## 8. 对外 API 草案

```ts
// Screen
openScreen(keyOrClass: string | Constructor, params?: any): Promise<void>;

// Page
openPage(keyOrClass: string | Constructor, params?: any): Promise<void>;

// Popup
openPopup(keyOrClass: string | Constructor, params?: any): Promise<void>;
closeTopPopup(): Promise<void>;
closePopup(keyOrClass: string | Constructor): Promise<void>;

// Overlay
showOverlay(keyOrClass: string | Constructor, params?: any): Promise<void>;
hideOverlay(keyOrClass: string | Constructor): Promise<void>;

// 通用导航
back(): Promise<void>; // 优先关闭 Popup，再考虑 Page 回退
```

这些方法将以依赖形式挂到 `ioc.ui` 上供业务侧使用。

---

## 9. 与现有依赖的集成

- `UIManager`：

  - 作为依赖注入实现，如 `@Injectable({ name: "UIManager", priority: xxx })`，在 `ioc` 初始化阶段挂载。

- 依赖关系：
  - `ioc.loader`（AssetLoader）：负责加载/释放 Prefab 与资源
  - `ioc.tweener`：负责执行 UI 动画
  - `ioc.eventBus`（可选）：配合 MVC 做消息分发
  - `ioc.launcher` / `MainAtom`：提供 `root` 以创建 `UIRoot`

---

## 10. UIStackLayerManager 抽象层

### 职责

- 维护单层 UI 栈（Page 或 Popup）的**有序栈结构**。
- 负责该层的**生命周期调用**（`onViewWillAppear/DidAppear/WillDisappear/DidDisappear`）。
- 负责调用 Tweener 执行**进场/退场动画**。
- 管理该层的 **UIViewCache**（DestroyImmediately / LRU / Persistent）。

UIManager 内部会为每个层级构造一个 [UIStackLayerManager](../assets/qin/dependency/ui-stack-layer-manager.ts) 实例：

- Page 层：`pageManager = new UIStackLayerManager(pageLayer, PRESET.UI.PAGE_CACHE_CAPACITY, …)`
- Popup 层：`popupManager = new UIStackLayerManager(popupLayer, PRESET.UI.POPUP_CACHE_CAPACITY, …)`

### 公共行为约定

#### open(config, params?)

- 若栈中 **已经存在相同 config 的实例**：
  - 通过 [truncateTo(existedIndex)](../assets/qin/dependency/ui-stack-layer-manager.ts) 截断栈（保留之前的所有下层视图 + 这个目标视图）。
  - 不再执行 appear 生命周期，只调用该实例的 [onViewFocus()](../assets/qin/dependency/ui.typings.ts)。
- 若栈中 **不存在相同实例**：
  1. 对当前栈顶（如果有）调用：
     - [onViewWillDisappear()](../assets/qin/dependency/ui.typings.ts)
     - `exitTween`（[\_\_playExitTween](../assets/qin/dependency/ui.ts)）
     - [onViewDidDisappear()](../assets/qin/dependency/ui.typings.ts)
  2. 从缓存中尝试复用实例；若没有则通过 [\_\_createInstance](../assets/qin/dependency/ui.ts) 新建。
  3. 对新实例调用：
     - [onViewWillAppear(params)](../assets/qin/dependency/ui.typings.ts)
     - `enterTween`（[\_\_playEnterTween](../assets/qin/dependency/ui.ts)）
     - [onViewDidAppear()](../assets/qin/dependency/ui.typings.ts)
  4. 将实例 push 入栈。
- **注意**：打开新实例时 **不调用 [onViewFocus](../assets/qin/dependency/ui.typings.ts)**。Focus 只在以下场景发生：
  - 复用已有实例（截断栈后）。
  - 上层视图关闭后，下层栈顶被动拿回焦点。
  - 清空某层后，由上一层明确触发 [focusTop()](../assets/qin/dependency/ui-stack-layer-manager.ts)。

#### close()

- 若栈为空，直接返回。
- 弹出栈顶实例，对其调用：
  - [onViewWillDisappear()](../assets/qin/dependency/ui.typings.ts)
  - `exitTween`
  - [onViewDidDisappear()](../assets/qin/dependency/ui.typings.ts)
- 把该实例交给 [UIViewCache](../assets/qin/dependency/ui.ts)，按其 `cachePolicy` 决定销毁或缓存。
- 然后对当前新栈顶调用 [onViewFocus()](../assets/qin/dependency/ui.typings.ts)（若栈为空则不做任何事）。

#### closeBy(config)

- 在栈中从顶到底查找匹配该 config 的实例。
- 若未找到，直接返回。
- 找到后，从栈中移除该实例，并对其执行与 [close()](../assets/qin/dependency/ui-stack-layer-manager.ts) 相同的关闭逻辑：
  - [onViewWillDisappear()](../assets/qin/dependency/ui.typings.ts)
  - `exitTween`
  - [onViewDidDisappear()](../assets/qin/dependency/ui.typings.ts)
  - 交给 [UIViewCache](../assets/qin/dependency/ui.ts) 处理。
- 最后对新栈顶调用 [onViewFocus()](../assets/qin/dependency/ui.typings.ts)。

#### clear()

- 依次从栈顶向下清空：
  - 对每个实例调用 [onViewWillDisappear()](../assets/qin/dependency/ui.typings.ts)
  - **不播放 exit 动画**
  - 调用 [onViewDidDisappear()](../assets/qin/dependency/ui.typings.ts)
  - 交给 [UIViewCache](../assets/qin/dependency/ui.ts) 处理。
- 这个方法是“快速清栈”：不等待动画，用于场景切换、统一关闭等。

#### focusTop()

- 若栈顶存在，则调用其 [onViewFocus()](../assets/qin/dependency/ui.typings.ts)。
- 不会触发 appear 生命周期，也不会有动画。

---

## 11. Page 层行为（通过 UIStackLayerManager 管理）

### 打开 Page：openPage

- UIManager 调用 [pageManager.open(config, params)](../assets/qin/dependency/ui.ts)。
- 行为遵循 [UIStackLayerManager.open](../assets/qin/dependency/ui-stack-layer-manager.ts) 约定：
  - 若重复激活同一 Page：截断栈，只调用目标 Page 的 [onViewFocus()](../assets/qin/dependency/ui.typings.ts)。
  - 若打开新 Page：
    - 上一 Page：`WillDisappear -> exitTween -> DidDisappear`。
    - 新 Page：`WillAppear(params) -> enterTween -> DidAppear`。
    - 不触发 [onViewFocus](../assets/qin/dependency/ui.typings.ts)。

### 关闭 Page

- [closeTopPage()](../assets/qin/dependency/ui.ts)：
  - 调用 [pageManager.close()](../assets/qin/dependency/ui-stack-layer-manager.ts)。
  - 若 Page 栈被清空，则让 Screen 调用一次 [onViewFocus()](../assets/qin/dependency/ui.typings.ts)。
- [closePage(key)](../assets/qin/dependency/ui.ts)：
  - 调用 [pageManager.closeBy(config)](../assets/qin/dependency/ui-stack-layer-manager.ts)。
  - 若关闭后 Page 栈为空，同样将焦点交给 Screen。
- [clearPage()](../assets/qin/dependency/ui.ts)：
  - 调用 [pageManager.clear()](../assets/qin/dependency/ui.ts) 快速清栈（无动画）。
  - 然后对 Screen 调用一次 [onViewFocus()](../assets/qin/dependency/ui.typings.ts)。

---

## 12. Popup 层行为（通过 UIStackLayerManager 管理）

### 打开 Popup：openPopup

- UIManager 调用 [popupManager.open(config, params)](../assets/qin/dependency/ui.ts)。
- 行为遵循 [UIStackLayerManager.open](../assets/qin/dependency/ui-stack-layer-manager.ts) 约定：
  - 若重复激活同一 Popup：截断栈，只调用目标 Popup 的 [onViewFocus()](../assets/qin/dependency/ui.typings.ts)。
  - 若打开新 Popup：
    - 上一 Popup（如果有）：`WillDisappear -> exitTween -> DidDisappear`。
    - 新 Popup：`WillAppear(params) -> enterTween -> DidAppear`。
    - 不触发 [onViewFocus](../assets/qin/dependency/ui.typings.ts)。
- 打开或截断后都会刷新遮罩状态和遮罩层级。

### 关闭 Popup

- [closeTopPopup()](../assets/qin/dependency/ui.ts)：
  - 调用 [popupManager.close()](../assets/qin/dependency/ui-stack-layer-manager.ts)。
  - 然后 [\_\_updatePopupMask()](../assets/qin/dependency/ui.ts) 刷新遮罩。
- [closePopup(key)](../assets/qin/dependency/ui.ts)：
  - 调用 [popupManager.closeBy(config)](../assets/qin/dependency/ui-stack-layer-manager.ts)。
  - 然后 [\_\_updatePopupMask()](../assets/qin/dependency/ui.ts)。
- [clearPopup()](../assets/qin/dependency/ui.ts)：
  - 调用 [popupManager.clear()](../assets/qin/dependency/ui.ts) 快速清栈（无动画）。
  - 刷新遮罩（遮罩隐藏）。
  - 最后调用 [pageManager.focusTop()](../assets/qin/dependency/ui-stack-layer-manager.ts)，把焦点交还给当前 Page 栈顶（若有）。

---

## 13. Popup 遮罩行为

- 遮罩节点：`ui-popup-mask`，位于 PopupLayer 下，由 UIManager 在 [ensureRoot()](../assets/qin/dependency/ui.ts) 时创建。
- 遮罩显示规则（[\_\_updatePopupMask](../assets/qin/dependency/ui.ts)）：

  - 若 Popup 栈为空：
    - `popupMask.active = false`。
  - 若 Popup 栈非空：
    - `popupMask.active = true`。
    - 取当前 Popup 栈顶实例 [top = popupManager.top](../assets/qin/dependency/ui-stack-layer-manager.ts)：
      - 若 `top.config.modal === true`：
        - 启用 `Graphics`，画一层半透明黑色全屏遮罩（截断点击，视觉变暗）。
      - 否则（非模态）：
        - 清理 `Graphics`，关闭填充，仅保留节点用于**截断点击**或透明效果。
    - 调整 sibling index，使遮罩始终位于栈顶弹窗的正下方。

- 遮罩点击行为（[\_\_onPopupMaskClicked](../assets/qin/dependency/ui.ts)）：
  - 获取当前栈顶 Popup [top](../assets/qin/dependency/ui-stack-layer-manager.ts)：
    - 若无栈顶：不做任何事情。
    - 若 `top.config.modal === true`：
      - 点击只被遮罩截断，不触发关闭。
    - 若 `top.config.modal === false` 且 `top.config.closeOnMaskClick === true`：
      - 调用 [closeTopPopup()](../assets/qin/dependency/ui.ts)，即关闭栈顶 Popup。

---

## 14. back 行为

[UIManager.back()](../assets/qin/dependency/ui.ts) 的策略：

1. 若 `popupManager.size > 0`：
   - 优先关闭栈顶 Popup（[closeTopPopup()](../assets/qin/dependency/ui.ts)）。
2. 否则若 `pageManager.size > 1`：
   - 回退 Page 栈：[closeTopPage()](../assets/qin/dependency/ui.ts)。
3. 否则：
   - 不处理 Screen，留给业务决定（例如切换场景）。

为避免重复触发，[back()](../assets/qin/dependency/ui.ts) 内部使用 `__backing` 标记防抖：

- 如果正在执行 back，再次调用会被忽略，并打一个警告 log。

---

## 15. 后续工作

- 基于本设计在 `assets/qin/dependency` 等目录下实现：
  - UIManager 依赖及 UIRoot/Layers 创建
  - Screen/Page/Popup/Overlay 基类与生命周期 + onViewFocus
  - 导航与栈管理、缓存策略、遮罩与 Tweener 集成
- 后续可以扩展：
  - 更复杂的数据绑定机制
  - UI 状态调试面板
  - 用配置表/工具自动生成 UIConfig 映射
