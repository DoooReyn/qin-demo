import { input, EventTarget, EventTouch, Input, Touch, Vec2, Vec3 } from "cc";

import { list, misc } from "../ability";
import ioc, { Injectable } from "../ioc";
import { Dependency } from "./dependency";
import { InputExtensive, ICCPriorityInput, IPriorityInput } from "./priority-input.typings";

/**
 * 全局输入监听器
 */
class CCPriorityInput extends EventTarget implements ICCPriorityInput {
  /**
   * 构造
   * @param priority 优先级
   */
  public constructor(public readonly priority: number) {
    super();
    (input as InputExtensive)._registerEventDispatcher(this);
  }

  /**
   * 分发事件
   * @param event 输入事件
   * @returns
   */
  public dispatchEvent(event: Event): boolean {
    this.emit(event.type, event);
    return true;
  }

  /**
   * 模拟触摸屏点击（TOUCH_START）
   * @param loc 屏幕坐标
   */
  private __simulateTouchStart(loc: Vec2) {
    const touch = new Touch(loc.x, loc.y, 1);
    const evt = new EventTouch([touch], true, Input.EventType.TOUCH_START, [touch]);
    const dispatcher = (input as InputExtensive)._eventDispatcherList.find((d) => d.priority == 1);
    evt.touch = touch;
    evt.simulate = true;
    dispatcher?.dispatchEventTouch?.(evt);
  }

  /**
   * 模拟触摸屏点击（TOUCH_END）
   * @param loc 屏幕坐标
   */
  private __simulateTouchEnd(loc: Vec2) {
    const touch = new Touch(loc.x, loc.y, 1);
    const evt = new EventTouch([touch], true, Input.EventType.TOUCH_END, [touch]);
    const dispatcher = (input as InputExtensive)._eventDispatcherList.find((d) => d.priority == 1);
    if (dispatcher) {
      (<any>dispatcher)._pointerEventProcessorList[2].claimedTouchIdList.push(1);
      evt.simulate = true;
      evt.touch = touch;
      dispatcher.dispatchEventTouch?.(evt);
    }
  }

  /**
   * 模拟触摸屏点击（TOUCH_CANCEL）
   * @param loc 屏幕坐标
   */
  private __simulateTouchCancel(loc: Vec2) {
    const touch = new Touch(loc.x, loc.y, 1);
    const evt = new EventTouch([touch], true, Input.EventType.TOUCH_CANCEL, [touch]);
    const dispatcher = (input as InputExtensive)._eventDispatcherList.find((d) => d.priority == 1);
    evt.simulate = true;
    evt.touch = touch;
    dispatcher?.dispatchEventTouch?.(evt);
  }

  /**
   * 模拟点击屏幕（一次完整的流程 TOUCH_START -> TOUCH_END -> TOUCH_CANCEL）
   * @param loc 屏幕坐标
   * @param fn 回调
   * @param context 回调上下文
   * @param args 入参
   */
  public simulateClickAtScreenSpace(loc: Vec2, fn?: Function, context?: any, ...args: any[]) {
    this.__simulateTouchStart(loc);
    setTimeout(() => {
      this.__simulateTouchEnd(loc);
      setTimeout(() => this.__simulateTouchCancel(loc), 16);
      fn && context && fn.apply(context, args);
    }, 16);
  }

  /**
   * 模拟点击屏幕（一次完整的流程 TOUCH_START -> TOUCH_END -> TOUCH_CANCEL）
   * @param loc 世界坐标
   * @param fn 回调
   * @param context 回调上下文
   * @param args 入参
   */
  public simulateClickAtWorldSpace(loc: Vec3, fn?: Function, context?: any, ...args: any[]) {
    this.simulateClickAtScreenSpace(misc.worldToScreen(loc, ioc.launcher.cameraUi).toVec2(), fn, context, ...args);
  }

  public onThrowException() {
    console.error(new Error("Handle input event failed."));
  }
}

/**
 * 优先级输入监听器
 */
@Injectable({ name: "PriorityInput", priority: 140 })
export class PriorityInput extends Dependency implements IPriorityInput {
  /** 最高优先级全局输入监听器 */
  private _highest: CCPriorityInput | undefined;
  /** 最低优先级全局输入监听器（实际上并非最低） */
  private _lowest: CCPriorityInput | undefined;

  onDetach(): Promise<void> {
    const arr = (input as InputExtensive)._eventDispatcherList;
    if (this._highest) {
      list.removeOne(arr, this._highest, true);
    }
    if (this._lowest) {
      list.removeOne(arr, this._lowest, true);
    }
    return super.onDetach();
  }

  /** 最高优先级全局输入监听器 */
  public get highest() {
    this._highest ??= new CCPriorityInput(Number.MAX_SAFE_INTEGER);
    return this._highest;
  }

  /** 最低优先级全局输入监听器（实际上并非最低） */
  public get lowest() {
    this._lowest ??= new CCPriorityInput(2);
    return this._lowest;
  }
}
