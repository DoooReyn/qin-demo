import { list } from "../ability";
import { Injectable } from "../ioc";
import { Dependency } from "./dependency";
import { IEventBus, IEventChannel, IEventListener } from "./event-bus.typings";

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
      const listeners = this.__listeners.get(event)!;
      list.each(
        listeners,
        (v, i) => {
          v.handle.apply(v.context, ...data);
          if (v.once) {
            listeners.splice(i, 1);
          }
        },
        true
      );
    }
  }

  /**
   * 查询事件是否已订阅
   * @param event 事件名称
   * @returns 是否已订阅
   */
  has(event: string): boolean {
    return this.__listeners.has(event) && this.__listeners.get(event)!.length > 0;
  }

  /**
   * 订阅事件
   * @param listener 事件监听器
   */
  subscribe(listener: IEventListener): void {
    if (!this.__listeners.has(listener.event)) {
      this.__listeners.set(listener.event, [listener]);
    } else {
      this.__listeners.get(listener.event)!.push(listener);
    }
  }

  /**
   * 批量订阅事件
   * @param listeners 事件监听器
   */
  subscribes(...listeners: IEventListener[]): void {
    for (const listener of listeners) {
      this.subscribe(listener);
    }
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

/**
 * 事件总线
 * - 用于管理事件渠道，实现事件的发布和订阅。
 */
@Injectable({ name: "EventBus" })
export class EventBus extends Dependency implements IEventBus {
  /** 事件渠道容器 */
  private __channels: Map<string, IEventChannel> = new Map();

  get shared() {
    return this.acquire("shared");
  }

  get app() {
    return this.acquire("app");
  }

  get gui() {
    return this.acquire("gui");
  }

  get red() {
    return this.acquire("red");
  }

  onDetach() {
    this.removeAll();
    return super.onDetach();
  }

  /**
   * 获取事件渠道
   * @param channel 渠道名称
   * @returns 事件渠道
   */
  acquire(channel: string): IEventChannel {
    if (!this.__channels.has(channel)) {
      this.__channels.set(channel, new EventChannel(channel));
    }
    return this.__channels.get(channel)!;
  }

  /**
   * 查询事件渠道是否已存在
   * @param channel 渠道名称
   * @returns 是否已存在
   */
  has(channel: string): boolean {
    return this.__channels.has(channel);
  }

  /**
   * 移除事件渠道
   * @param channel 渠道名称
   */
  remove(channel: string): void {
    this.__channels.delete(channel);
  }

  /**
   * 移除所有事件渠道
   */
  removeAll(): void {
    this.__channels.clear();
  }
}
