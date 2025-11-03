import { IEventChannel, IEventListener } from "../../typings/event-bus";

/**
 * 事件渠道
 * - 用于发布和订阅事件
 * - 每个渠道可以有多个事件监听器
 */
export class EventChannel implements IEventChannel {
  /** 渠道名称 */
  private __channel: string;

  /** 获取渠道名称 */
  get channel(): string {
    return this.__channel;
  }

  /** 事件监听器容器 */
  private __listeners: Map<string, IEventListener[]> = new Map();

  constructor(channel: string) {
    this.__channel = channel;
  }

  /**
   * 发布事件
   * @param event 事件名称
   * @param data 事件数据
   */
  publish(event: string, ...data: any[]): void {
    if (this.__listeners.has(event)) {
      this.__listeners
        .get(event)!
        .forEach((listener) =>
          listener.handle.apply(listener.context, ...data)
        );
    }
  }

  /**
   * 查询事件是否已订阅
   * @param event 事件名称
   * @returns 是否已订阅
   */
  has(event: string): boolean {
    return (
      this.__listeners.has(event) && this.__listeners.get(event)!.length > 0
    );
  }

  /**
   * 订阅事件
   * @param listener 事件监听器
   */
  subscribe(listener: IEventListener): void {
    if (!this.__listeners.has(listener.event)) {
      this.__listeners.set(listener.event, []);
    }
    this.__listeners.get(listener.event)!.push(listener);
  }

  /**
   * 取消订阅事件
   * - 同时指定事件名称和上下文时，取消该监听器的订阅
   * - 仅指定事件名称时，取消所有该事件的订阅
   * - 仅指定上下文时，取消所有该上下文的订阅
   * - 未指定事件名称和上下文时，取消所有订阅
   * @param event 事件名称 [可选]
   * @param ctx 事件上下文 [可选]
   */
  unsubscribe(event?: string, ctx?: any): void {
    if (event !== undefined && ctx !== undefined) {
      // 同时指定事件名称和上下文时，取消特定监听器的订阅
      if (this.__listeners.has(event)) {
        const listeners = this.__listeners.get(event)!;
        for (let i = listeners.length - 1; i >= 0; i--) {
          if (listeners[i].context === ctx) {
            listeners.splice(i, 1);
          }
        }
        if (listeners.length === 0) {
          this.__listeners.delete(event);
        }
      }
    } else if (event != undefined && ctx == undefined) {
      // 仅指定事件名称时，取消所有该事件的订阅
      if (this.__listeners.has(event)) {
        this.__listeners.delete(event);
      }
    } else if (event == undefined && ctx != undefined) {
      // 仅指定上下文时，取消所有该上下文的订阅
      for (let [evt, listeners] of this.__listeners) {
        for (let i = listeners.length - 1; i >= 0; i--) {
          if (listeners[i].context === ctx) {
            listeners.splice(i, 1);
          }
        }
        if (listeners.length === 0) {
          this.__listeners.delete(evt);
        }
      }
    } else {
      // 未指定事件名称和上下文时，取消所有订阅
      this.unsubscribeAll();
    }
  }

  /**
   * 取消所有订阅事件
   */
  unsubscribeAll(): void {
    this.__listeners.clear();
  }
}
