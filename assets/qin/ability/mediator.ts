import { native, sys } from "cc";
import { IAbility } from "./ability";

/**
 * 原生交互能力接口
 * @description
 * ```
 * - JS与原生交互
 *   1. 在原生层注册事件 `JsbBridgeWrapper.addScriptEventListener`
 *   2. 在JS层发送消息 `mediator.dispatch`
 * - 原生与JS交互
 *   1. 在JS层注册事件 `mediator.register`
 *   2. 在原生层发送消息 `JsbBridgeWrapper.dispatchEventToScript`
 * ```
 * @warn 交互时只能传递字符串，如果需要传递对象，请先序列化成JSON字符串再传递
 * @example Android
 * ```java
 * JsbBridgeWrapper jbw = JsbBridgeWrapper.getInstance();
 * jbw.addScriptEventListener("requestLabelContent", arg ->{
 *     System.out.print("@JAVA: here is the argument transport in" + arg);
 *     jbw.dispatchEventToScript("changeLabelContent","Charlotte");
 * });
 * ```
 * @example iOS
 * ```objective-c
 * // Objective-C
 * JsbBridgeWrapper* m = [JsbBridgeWrapper sharedInstance];
 * OnScriptEventListener requestLabelContent = ^void(NSString* arg){
 *     JsbBridgeWrapper* m = [JsbBridgeWrapper sharedInstance];
 *     [m dispatchEventToScript:@"changeLabelContent" arg:@"Charlotte"];
 * };
 * [m addScriptEventListener:@"requestLabelContent" listener:requestLabelContent];
 * ```
 */
export interface IMediator extends IAbility {
  /**
   * 注册事件
   * @param event 事件名称
   * @param callback 回调函数
   */
  register(event: string, callback: (arg: string) => void): void;
  /**
   * 注销事件
   * @param event 事件名称
   * @param callback 回调函数
   */
  unregister(event: string, callback: (arg: string) => void): void;
  /**
   * 发送消息
   * @param event 事件名称
   * @param arg 消息参数（只能是字符串）
   */
  dispatch(event: string, arg?: string | { [key: string]: any }): void;
}

/**
 * 原生交互能力实现
 */
export const mediator: IMediator = {
  name: "Mediator",
  description: "原生交互能力",
  register(event: string, callback: (arg: string) => void) {
    if (sys.isNative) {
      native.jsbBridgeWrapper.addNativeEventListener(event, callback);
    }
  },
  unregister(event: string, callback: (arg: string) => void) {
    if (sys.isNative) {
      native.jsbBridgeWrapper.removeNativeEventListener(event, callback);
    }
  },
  dispatch(event: string, arg?: string | { [key: string]: any }) {
    if (sys.isNative) {
      if (arg === undefined) {
        native.jsbBridgeWrapper.dispatchEventToNative(event);
      } else {
        if (typeof arg === "object") arg = JSON.stringify(arg, null, 0);
        native.jsbBridgeWrapper.dispatchEventToNative(event, arg);
      }
    }
  },
};
