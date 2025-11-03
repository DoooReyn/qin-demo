import { IEventBus, IEventChannel } from "../../typings/event-bus";
import { EventChannel } from "./event-channel";

/**
 * 事件总线
 * - 用于管理事件渠道，实现事件的发布和订阅。
 */
export class EventBus implements IEventBus {
  readonly name: string = "EventBus";
  readonly description: string = "事件总线";

  /** 事件渠道容器 */
  private __channels: Map<string, IEventChannel> = new Map();

  onAttach(): void {}

  onDetach(): void {
    this.removeAll();
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
