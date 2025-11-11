import { EventTarget, EventTouch, Input, Vec2, Vec3 } from "cc";

import { IDependency } from "./dependency.typings";

/** 事件分发器 */
export interface IEventDispatcher extends EventTarget {
  readonly priority: number;
  dispatchEvent(event: Event): boolean;
  dispatchEventTouch?(touch: EventTouch): void;
  onThrowException(): void;
}

export interface ICCPriorityInput extends IEventDispatcher {
  /**
   * 模拟点击屏幕（一次完整的流程 TOUCH_START -> TOUCH_END -> TOUCH_CANCEL）
   * @param loc 屏幕坐标
   * @param fn 回调
   * @param context 回调上下文
   * @param args 入参
   */
  simulateClickAtScreenSpace(loc: Vec2, fn?: Function, context?: any, ...args: any[]): void;
  /**
   * 模拟点击屏幕（一次完整的流程 TOUCH_START -> TOUCH_END -> TOUCH_CANCEL）
   * @param loc 世界坐标
   * @param fn 回调
   * @param context 回调上下文
   * @param args 入参
   */
  simulateClickAtWorldSpace(loc: Vec3, fn?: Function, context?: any, ...args: any[]): void;
}

/** 输入接口扩展 */
export interface InputExtensive extends Input {
  _registerEventDispatcher(dispatcher: IEventDispatcher): void;
  _eventDispatcherList: IEventDispatcher[];
}

/**
 * 优先级输入监听器接口
 */
export interface IPriorityInput extends IDependency {
  get highest(): ICCPriorityInput;
  get lowest(): ICCPriorityInput;
}
