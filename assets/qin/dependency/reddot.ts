/**
 * 红点管理系统实现
 */

import { Injectable, ioc } from "../ioc";
import { Dependency } from "./dependency";
import {
  IRedDotManager,
  IRedDotConfig,
  IRedDotRule,
  IRedDotData,
  IRedDotChangeEvent,
  RedDotStyle,
  IRedDotPool,
} from "./reddot.typings";

/**
 * 红点池实现
 */
class RedDotPool implements IRedDotPool {
  private pool: IRedDotData[] = [];
  private maxSize: number = 150;

  /**
   * 获取红点对象
   * @returns 红点对象
   */
  acquire(): IRedDotData {
    if (this.pool.length > 0) {
      const reddot = this.pool.pop()!;
      reddot.data = undefined;
      reddot.visible = false;
      reddot.updateTime = 0;
      return reddot;
    }
    return {
      data: undefined,
      visible: false,
      updateTime: Date.now(),
    };
  }

  /**
   * 释放红点对象
   * @param reddot 红点对象
   */
  release(reddot: IRedDotData): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(reddot);
    }
  }
}

/**
 * 红点管理器实现
 */
@Injectable({
  name: "RedDot",
  version: "1.0.0",
  description: "红点管理系统",
  author: "Qin",
})
export class RedDotManager extends Dependency implements IRedDotManager {
  /** 红点配置映射 */
  private configs: Map<string, IRedDotConfig> = new Map();
  /** 红点数据映射 */
  private reddots: Map<string, IRedDotData> = new Map();
  /** 状态监听器映射 */
  private listeners: Map<string, Set<(event: IRedDotChangeEvent) => void>> = new Map();
  /** 红点对象池 */
  private pool: IRedDotPool = new RedDotPool();
  /** 批量更新队列 */
  private batchQueue: { id: string; data: any }[] = [];
  /** 是否正在批量更新 */
  private isBatching: boolean = false;

  /**
   * 依赖附加时的初始化
   */
  async onAttach(): Promise<void> {
    ioc.logcat?.red.wf("红点管理系统已初始化");
  }

  /**
   * 依赖分离时的清理
   */
  async onDetach(): Promise<void> {
    this.configs.clear();
    this.reddots.clear();
    this.listeners.clear();
    this.batchQueue.length = 0;
    ioc.logcat?.red.wf("红点管理系统已清理");
  }

  /**
   * 注册红点配置
   * @param config 红点配置
   */
  register(config: IRedDotConfig): void {
    if (this.configs.has(config.id)) {
      ioc.logcat?.red.ef("红点 {0} 已存在，无法重复注册", config.id);
      return;
    }

    this.configs.set(config.id, config);

    // 初始化红点数据
    const reddot = this.pool.acquire();
    reddot.updateTime = Date.now();

    // 如果支持持久化，尝试恢复本地数据
    if (config.persistent) {
      this.loadFromStorage(config.id, reddot);
    }

    this.reddots.set(config.id, reddot);

    // 处理父子关系
    if (config.parent) {
      const parentConfig = this.configs.get(config.parent);
      if (parentConfig) {
        if (!parentConfig.children) {
          parentConfig.children = [];
        }
        if (!parentConfig.children.includes(config.id)) {
          parentConfig.children.push(config.id);
        }
      }
    }

    ioc.logcat?.red.wf("红点 {0} 注册成功", config.id);
  }

  /**
   * 更新红点数据
   * @param id 红点ID
   * @param data 红点数据
   */
  updateData(id: string, data: any): void {
    const config = this.configs.get(id);
    if (!config) {
      ioc.logcat?.red.ef("红点 {0} 未注册，无法更新数据", id);
      return;
    }

    const reddot = this.reddots.get(id);
    if (!reddot) {
      ioc.logcat?.red.ef("红点 {0} 数据不存在", id);
      return;
    }

    // 更新数据
    reddot.data = data;
    reddot.updateTime = Date.now();

    // 评估新状态
    const newVisible = config.rule.evaluate(data);

    if (reddot.visible !== newVisible) {
      reddot.visible = newVisible;

      // 触发状态变化事件
      this.emitChangeEvent(id, newVisible, data);

      // 更新父红点状态
      this.updateParentState(id);

      // 持久化处理
      if (config.persistent) {
        this.saveToStorage(id, reddot);
      }
    }
  }

  /**
   * 获取红点状态
   * @param id 红点ID
   * @returns 是否显示红点
   */
  getState(id: string): boolean {
    const reddot = this.reddots.get(id);
    return reddot ? reddot.visible : false;
  }

  /**
   * 获取红点数据
   * @param id 红点ID
   * @returns 红点状态数据
   */
  getData(id: string): IRedDotData | null {
    const reddot = this.reddots.get(id);
    return reddot ? { ...reddot } : null;
  }

  /**
   * 监听红点状态变化
   * @param id 红点ID
   * @param callback 状态变化回调
   * @returns 取消监听的函数
   */
  subscribe(id: string, callback: (event: IRedDotChangeEvent) => void): () => void {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set());
    }

    this.listeners.get(id)!.add(callback);

    // 返回取消监听的函数
    return () => {
      const listeners = this.listeners.get(id);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(id);
        }
      }
    };
  }

  /**
   * 批量更新红点数据
   * @param updates 批量更新数据
   */
  batchUpdate(updates: { id: string; data: any }[]): void {
    this.isBatching = true;
    this.batchQueue.push(...updates);

    try {
      updates.forEach((update) => {
        this.updateData(update.id, update.data);
      });
    } finally {
      this.isBatching = false;
      this.batchQueue.length = 0;
    }
  }

  /**
   * 清除红点状态
   * @param id 红点ID
   */
  clear(id: string): void {
    const config = this.configs.get(id);
    if (!config) {
      ioc.logcat?.red.ef("红点 {0} 未注册，无法清除", id);
      return;
    }

    const reddot = this.reddots.get(id);
    if (!reddot) {
      return;
    }

    reddot.visible = false;
    reddot.data = undefined;
    reddot.updateTime = Date.now();

    // 触发状态变化事件
    this.emitChangeEvent(id, false, undefined);

    // 更新父红点状态
    this.updateParentState(id);

    // 持久化处理
    if (config.persistent) {
      this.saveToStorage(id, reddot);
    }
  }

  /**
   * 触发红点点击事件
   * @param id 红点ID
   */
  onClick(id: string): void {
    const config = this.configs.get(id);
    if (!config) {
      ioc.logcat?.red.ef("红点 {0} 未注册", id);
      return;
    }

    // 自动清除处理
    if (config.autoClear) {
      this.clear(id);
    }
  }

  /**
   * 获取所有红点状态
   * @returns 所有红点状态映射
   */
  getAllStates(): Map<string, IRedDotData> {
    const result = new Map<string, IRedDotData>();
    this.reddots.forEach((reddot, id) => {
      result.set(id, { ...reddot });
    });
    return result;
  }

  /**
   * 检查红点是否存在
   * @param id 红点ID
   * @returns 是否存在
   */
  has(id: string): boolean {
    return this.configs.has(id);
  }

  /**
   * 注销红点
   * @param id 红点ID
   */
  unregister(id: string): void {
    const config = this.configs.get(id);
    if (!config) {
      return;
    }

    // 清理子红点的父引用
    if (config.children) {
      config.children.forEach((childId) => {
        const childConfig = this.configs.get(childId);
        if (childConfig) {
          childConfig.parent = undefined;
        }
      });
    }

    // 清理父红点的子引用
    if (config.parent) {
      const parentConfig = this.configs.get(config.parent);
      if (parentConfig && parentConfig.children) {
        const index = parentConfig.children.indexOf(id);
        if (index !== -1) {
          parentConfig.children.splice(index, 1);
        }
      }
    }

    // 释放红点对象
    const reddot = this.reddots.get(id);
    if (reddot) {
      this.pool.release(reddot);
      this.reddots.delete(id);
    }

    // 清理监听器
    this.listeners.delete(id);

    // 删除配置
    this.configs.delete(id);

    ioc.logcat?.red.wf("红点 {0} 注销成功", id);
  }

  /**
   * 触发状态变化事件
   * @param id 红点ID
   * @param visible 是否可见
   * @param data 红点数据
   */
  private emitChangeEvent(id: string, visible: boolean, data?: any): void {
    const event: IRedDotChangeEvent = { id, visible, data };

    // 通知当前红点的监听器
    const listeners = this.listeners.get(id);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          ioc.logcat?.red.ef("红点 {0} 状态变化回调执行失败: {1}", id, error);
        }
      });
    }

    // 通过事件总线通知其他模块
    ioc.eventBus.red.publish("reddot:change:" + id, event);
  }

  /**
   * 更新父红点状态
   * @param childId 子红点ID
   */
  private updateParentState(childId: string): void {
    const config = this.configs.get(childId);
    if (!config || !config.parent) {
      return;
    }

    const parentConfig = this.configs.get(config.parent);
    if (!parentConfig || !parentConfig.children) {
      return;
    }

    // 计算父红点状态（任一子红点可见则父红点可见）
    let parentVisible = false;
    for (const childId of parentConfig.children) {
      const childReddot = this.reddots.get(childId);
      if (childReddot && childReddot.visible) {
        parentVisible = true;
        break;
      }
    }

    const parentReddot = this.reddots.get(config.parent);
    if (parentReddot && parentReddot.visible !== parentVisible) {
      parentReddot.visible = parentVisible;
      parentReddot.updateTime = Date.now();

      // 触发父红点状态变化事件
      this.emitChangeEvent(config.parent, parentVisible, parentReddot.data);

      // 递归更新祖父红点
      this.updateParentState(config.parent);
    }
  }

  /**
   * 从本地存储加载红点数据
   * @param id 红点ID
   * @param reddot 红点数据对象
   */
  private loadFromStorage(id: string, reddot: IRedDotData): void {
    if (ioc.store) {
      try {
        const key = `reddot:${id}`;
        ioc.store.load(key);
        const storeItem = ioc.store.itemOf(key);
        if (storeItem && storeItem.data) {
          this.updateData(id, storeItem.data);
          ioc.logcat?.red.wf("红点 {0} 持久化数据恢复成功", id);
        }
      } catch (error) {
        ioc.logcat?.red.ef("红点 {0} 持久化数据加载失败: {1}", id, error);
      }
    }
  }

  /**
   * 保存红点数据到本地存储
   * @param id 红点ID
   * @param reddot 红点数据
   */
  private saveToStorage(id: string, reddot: IRedDotData): void {
    if (ioc.store) {
      try {
        const storeItem = ioc.store.itemOf(`reddot:${id}`);
        if (storeItem) {
          storeItem.data.visible = reddot.visible;
          storeItem.data.data = reddot.data;
          storeItem.data.updateTime = reddot.updateTime;
          storeItem.save();
        }
      } catch (error) {
        ioc.logcat?.red.ef("红点 {0} 持久化失败: {1}", id, error);
      }
    }
  }
}
