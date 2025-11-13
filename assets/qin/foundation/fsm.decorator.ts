import { FiniteStateMachine } from "./fsm";
import { FSMConfig, FSMKey, IFSM } from "./fsm.typings";

/**
 * 状态机装饰器
 * @param config 状态机配置
 */
export function StateMachine<
  TState extends FSMKey,
  TEvent extends FSMKey,
  TContext = any
>(config: FSMConfig<TState, TEvent, TContext>) {
  return function <T extends new (...args: any[]) => {}>(Ctor: T) {
    return class extends (Ctor as any) {
      public fsm!: IFSM<TState, TEvent, TContext>;
      constructor(...args: any[]) {
        super(...args);
        this.fsm = new FiniteStateMachine<TState, TEvent, TContext>(config);
      }
    } as unknown as T;
  };
}

