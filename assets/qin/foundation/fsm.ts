import { dict, time } from "../ability";
import { FSMCallbacks, FSMConfig, FSMKey, IFSM, TransitionTable, FSMStateLocalCallbacks } from "./fsm.typings";

/**
 * 有限状态机
 */
export class FiniteStateMachine<
  TState extends FSMKey,
  TEvent extends FSMKey,
  TContext = any
> implements IFSM<TState, TEvent, TContext> {
  /** 状态转换表 */
  private readonly __transitions: TransitionTable<TState, TEvent>;
  /** 回调函数 */
  private readonly __callbacks: FSMCallbacks<TState, TEvent, TContext>;
  /** 本地状态回调表 */
  private readonly __stateCallbacks?: Readonly<Partial<Record<TState, FSMStateLocalCallbacks<TState, TEvent, TContext>>>>;
  /** 当前状态 */
  private __state: TState;
  public get state(): TState {
    return this.__state;
  }
  /** 进入当前状态的时间 */
  private __enteredAt: number;
  public get enteredAt(): number {
    return this.__enteredAt;
  }

  constructor(config: FSMConfig<TState, TEvent, TContext>) {
    // 对 transitions 深冻结，运行期不可更改
    this.__transitions = dict.deepFreeze({ ...config.transitions }) as TransitionTable<TState, TEvent>;
    this.__callbacks = {
      onBeforeTransition: config.onBeforeTransition,
      onAfterTransition: config.onAfterTransition,
    };
    if (config.stateCallbacks) {
      this.__stateCallbacks = dict.deepFreeze({ ...(config.stateCallbacks as any) }) as Readonly<
        Partial<Record<TState, FSMStateLocalCallbacks<TState, TEvent, TContext>>>
      >;
    }
    this.__state = config.initial;
    this.__enteredAt = time.now;
  }

  /** 获取状态转换表 */
  public getTransitions(): TransitionTable<TState, TEvent> {
    return this.__transitions;
  }

  /** 检查是否可以触发某个事件 */
  public can(event: TEvent): boolean {
    const mapFrom = this.__transitions[this.state] as Partial<Record<TEvent, TState>> | undefined;
    return !!(mapFrom && mapFrom[event] !== undefined);
  }

  /** 触发某个事件 */
  public async transition(event: TEvent, context?: TContext): Promise<boolean> {
    const mapFrom = this.__transitions[this.state] as Partial<Record<TEvent, TState>> | undefined;
    if (!mapFrom) return false;
    const next = mapFrom[event];
    if (next === undefined) return false;

    const from = this.state;
    const to = next as TState;

    // 全局 onBeforeTransition
    if (this.__callbacks.onBeforeTransition) {
      const res = await this.__callbacks.onBeforeTransition(from, to, event, context);
      if (res === false) return false;
    }

    // 本地 fromState.onExit
    const exitCb = this.__stateCallbacks?.[from]?.onExit;
    if (exitCb) {
      await exitCb(from, to, event, context);
    }

    // 状态切换与时间戳更新
    this.__state = to;
    this.__enteredAt = time.now;

    // 本地 toState.onEnter
    const enterCb = this.__stateCallbacks?.[to]?.onEnter;
    if (enterCb) {
      await enterCb(to, from, event, context);
    }

    // 全局 onAfterTransition
    if (this.__callbacks.onAfterTransition) {
      await this.__callbacks.onAfterTransition(from, to, event, context);
    }

    return true;
  }

  /** 获取当前状态的持续时间 */
  public getStateDuration(): number {
    return time.now - this.__enteredAt;
  }
}

