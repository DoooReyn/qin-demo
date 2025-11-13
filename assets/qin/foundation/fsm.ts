import { dict, time } from "../ability";
import { FSMCallbacks, FSMConfig, FSMKey, IFSM, TransitionTable } from "./fsm.typings";

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
    // Freeze transitions to ensure immutability
    this.__transitions = dict.deepFreeze({ ...config.transitions }) as TransitionTable<TState, TEvent>;
    this.__callbacks = {
      onBeforeTransition: config.onBeforeTransition,
      onAfterTransition: config.onAfterTransition,
    };
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

    // before callback, can veto with false
    if (this.__callbacks.onBeforeTransition) {
      const res = await this.__callbacks.onBeforeTransition(from, to, event, context);
      if (res === false) return false;
    }

    // state change
    this.__state = to;
    this.__enteredAt = time.now;

    // after callback
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

