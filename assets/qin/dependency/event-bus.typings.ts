import { IDependency } from "./dependency.typings";

/**
 * 事件总线
 * @description 事件总线是一种用于在应用程序中进行事件通信的机制。
 * 它允许不同的组件之间通过发布和订阅事件来进行通信，实现解耦和灵活的事件处理。
 */
export interface IEventBus extends IDependency {
  /** 获取事件渠道 */
  acquire(channel: string): IEventChannel;
  /** 查询事件渠道 */
  has(channel: string): boolean;
  /** 删除事件渠道 */
  remove(channel: string): void;
  /** 删除所有事件渠道 */
  removeAll(): void;
  /** 共享事件渠道 */
  get shared(): IEventChannel;
  /** GUI 事件频道 */
  get gui(): IEventChannel;
  /** 应用事件频道 */
  get app(): IEventChannel;
}

/**
 * 事件渠道
 * @description 事件渠道是事件总线中的一个通道，用于发布和订阅事件。
 * 每个事件渠道都有一个唯一的名称，用于标识该渠道。
 */
export interface IEventChannel {
  /** 渠道名称 */
  readonly channel: string;
  /** 发布事件 */
  publish(event: string, ...data: any[]): void;
  /** 查询事件是否已订阅 */
  has(event: string): boolean;
  /** 订阅事件 */
  subscribe(listener: IEventListener): void;
  /** 批量订阅事件 */
  subscribes(...listeners: IEventListener[]): void;
  /** 取消订阅事件 */
  unsubscribe(event?: string, ctx?: any): void;
  /** 取消所有订阅事件 */
  unsubscribeAll(): void;
}

/**
 * 事件监听器
 * @description 事件监听器是用于处理事件的回调函数。
 * 它包含事件名称、事件上下文和事件处理函数。
 */
export interface IEventListener {
  /** 事件名称 */
  readonly event: string;
  /** 事件上下文 */
  readonly context?: any;
  /** 是否只执行一次 */
  readonly once?: boolean;
  /** 事件处理函数 */
  handle(data?: any): void;
}
