import { Injectable, ioc } from "../ioc";
import { Dependency } from "./dependency";
import { IRedDotManager, IRedDotConfig, IRedDotData, IRedDotChangeEvent, IRedDotPool } from "./reddot.typings";

/**
 * 红点池实现
 */
class RedDotPool implements IRedDotPool {
  /** 红点对象容器 */
  private __container: IRedDotData[] = [];
  /** 红点对象池最大容量 */
  private __maxSize: number = 100;

  /**
   * 获取红点对象
   * @returns 红点对象
   */
  acquire(): IRedDotData {
    if (this.__container.length > 0) {
      const reddot = this.__container.pop()!;
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
    if (this.__container.length < this.__maxSize) {
      this.__container.push(reddot);
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
  private __configs: Map<string, IRedDotConfig> = new Map();
  /** 红点数据映射 */
  private __reddots: Map<string, IRedDotData> = new Map();
  /** 状态监听器映射 */
  private __listeners: Map<string, Set<(event: IRedDotChangeEvent) => void>> = new Map();
  /** 红点对象池 */
  private __pool: IRedDotPool = new RedDotPool();
  /** 批量更新队列 */
  private __batchQueue: { id: string; data: any }[] = [];
  /** 是否正在批量更新 */
  private __isBatching: boolean = false;

  /**
   * 依赖分离时的清理
   */
  async onDetach(): Promise<void> {
    this.__configs.clear();
    this.__reddots.clear();
    this.__listeners.clear();
    this.__batchQueue.length = 0;
    ioc.logcat?.red.wf("红点管理系统已清理");
    return super.onDetach();
  }

  /**
   * 注册红点配置
   * @param config 红点配置
   */
  register(config: IRedDotConfig): void {
    if (this.__configs.has(config.id)) {
      ioc.logcat?.red.ef("红点 {0} 已存在，无法重复注册", config.id);
      return;
    }

    this.__configs.set(config.id, config);

    // 初始化红点数据
    const reddot = this.__pool.acquire();
    reddot.updateTime = Date.now();

    // 如果支持持久化，尝试恢复本地数据
    if (config.persistent) {
      this.__loadFromStorage(config.id, reddot);
    }

    this.__reddots.set(config.id, reddot);

    // 处理父子关系
    if (config.parent) {
      const parentConfig = this.__configs.get(config.parent);
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
    const config = this.__configs.get(id);
    if (!config) {
      ioc.logcat?.red.ef("红点 {0} 未注册，无法更新数据", id);
      return;
    }

    const reddot = this.__reddots.get(id);
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
      this.__emitChangeEvent(id, newVisible, data);

      // 更新父红点状态
      this.__updateParentState(id);

      // 持久化处理
      if (config.persistent) {
        this.__saveToStorage(id, reddot);
      }
    }
  }

  /**
   * 获取红点状态
   * @param id 红点ID
   * @returns 是否显示红点
   */
  getState(id: string): boolean {
    const reddot = this.__reddots.get(id);
    return reddot ? reddot.visible : false;
  }

  /**
   * 获取红点数据
   * @param id 红点ID
   * @returns 红点状态数据
   */
  getData(id: string): IRedDotData | null {
    const reddot = this.__reddots.get(id);
    return reddot ? { ...reddot } : null;
  }

  /**
   * 监听红点状态变化
   * @param id 红点ID
   * @param callback 状态变化回调
   * @returns 取消监听的函数
   */
  subscribe(id: string, callback: (event: IRedDotChangeEvent) => void): () => void {
    if (!this.__listeners.has(id)) {
      this.__listeners.set(id, new Set());
    }

    this.__listeners.get(id)!.add(callback);

    // 返回取消监听的函数
    return () => {
      this.unsubscribe(id, callback);
    };
  }

  /**
   * 取消监听红点状态变化
   * @param id 红点ID
   * @param callback 状态变化回调
   */
  unsubscribe(id: string, callback: (event: IRedDotChangeEvent) => void): void {
    const listeners = this.__listeners.get(id);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.__listeners.delete(id);
      }
    }
  }

  /**
   * 批量更新红点数据
   * @param updates 批量更新数据
   */
  batchUpdate(updates: { id: string; data: any }[]): void {
    const changedEvents: IRedDotChangeEvent[] = [];
    const parentIdsToUpdate = new Set<string>();

    this.__isBatching = true;

    try {
      updates.forEach((update) => {
        const config = this.__configs.get(update.id);
        if (!config) {
          ioc.logcat?.red.ef("红点 {0} 未注册，无法更新数据", update.id);
          return;
        }

        const reddot = this.__reddots.get(update.id);
        if (!reddot) {
          ioc.logcat?.red.ef("红点 {0} 数据不存在", update.id);
          return;
        }

        // 更新数据
        reddot.data = update.data;
        reddot.updateTime = Date.now();

        // 评估新状态
        const newVisible = config.rule.evaluate(update.data);

        if (reddot.visible !== newVisible) {
          reddot.visible = newVisible;

          // 收集状态变化事件，稍后批量触发
          changedEvents.push({ id: update.id, visible: newVisible, data: update.data });

          // 收集需要更新的父红点ID
          if (config.parent) {
            parentIdsToUpdate.add(config.parent);
          }

          // 持久化处理
          if (config.persistent) {
            this.__saveToStorage(update.id, reddot);
          }
        }
      });

      // 批量更新父红点状态
      parentIdsToUpdate.forEach((parentId) => {
        this.__updateParentState(parentId);
      });

      // 批量触发状态变化事件
      changedEvents.forEach((event) => {
        this.__notifyListeners(event);
        this.__notifyEventBus(event);
      });
    } finally {
      this.__isBatching = false;
    }
  }

  /**
   * 清除红点状态
   * @param id 红点ID
   */
  clear(id: string): void {
    const config = this.__configs.get(id);
    if (!config) {
      ioc.logcat?.red.ef("红点 {0} 未注册，无法清除", id);
      return;
    }

    const reddot = this.__reddots.get(id);
    if (!reddot) {
      return;
    }

    reddot.visible = false;
    reddot.data = undefined;
    reddot.updateTime = Date.now();

    // 触发状态变化事件
    this.__emitChangeEvent(id, false, undefined);

    // 更新父红点状态
    this.__updateParentState(id);

    // 持久化处理
    if (config.persistent) {
      this.__saveToStorage(id, reddot);
    }
  }

  /**
   * 触发红点点击事件
   * @param id 红点ID
   */
  onClick(id: string): void {
    const config = this.__configs.get(id);
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
    this.__reddots.forEach((reddot, id) => {
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
    return this.__configs.has(id);
  }

  /**
   * 注销红点
   * @param id 红点ID
   */
  unregister(id: string): void {
    const config = this.__configs.get(id);
    if (!config) {
      return;
    }

    // 清理子红点的父引用
    if (config.children) {
      config.children.forEach((childId) => {
        const childConfig = this.__configs.get(childId);
        if (childConfig) {
          childConfig.parent = undefined;
        }
      });
    }

    // 清理父红点的子引用
    if (config.parent) {
      const parentConfig = this.__configs.get(config.parent);
      if (parentConfig && parentConfig.children) {
        const index = parentConfig.children.indexOf(id);
        if (index !== -1) {
          parentConfig.children.splice(index, 1);
        }
      }
    }

    // 释放红点对象
    const reddot = this.__reddots.get(id);
    if (reddot) {
      this.__pool.release(reddot);
      this.__reddots.delete(id);
    }

    // 清理监听器
    this.__listeners.delete(id);

    // 删除配置
    this.__configs.delete(id);

    ioc.logcat?.red.wf("红点 {0} 注销成功", id);
  }

  /**
   * 触发状态变化事件
   * @param id 红点ID
   * @param visible 是否可见
   * @param data 红点数据
   */
  private __emitChangeEvent(id: string, visible: boolean, data?: any): void {
    const event: IRedDotChangeEvent = { id, visible, data };

    // 如果不是批量更新模式，立即触发事件
    if (!this.__isBatching) {
      this.__notifyListeners(event);
      this.__notifyEventBus(event);
    }
  }

  /**
   * 通知监听器
   * @param event 状态变化事件
   */
  private __notifyListeners(event: IRedDotChangeEvent): void {
    const listeners = this.__listeners.get(event.id);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          ioc.logcat?.red.ef("红点 {0} 状态变化回调执行失败: {1}", event.id, error);
        }
      });
    }
  }

  /**
   * 通知事件总线
   * @param event 状态变化事件
   */
  private __notifyEventBus(event: IRedDotChangeEvent): void {
    ioc.eventBus.red.publish("reddot:change:" + event.id, event);
  }

  /**
   * 更新父红点状态
   * @param childId 子红点ID
   */
  private __updateParentState(childId: string): void {
    const config = this.__configs.get(childId);
    if (!config || !config.parent) {
      return;
    }

    const parentConfig = this.__configs.get(config.parent);
    if (!parentConfig || !parentConfig.children) {
      return;
    }

    // 计算父红点状态（任一子红点可见则父红点可见）
    let parentVisible = false;
    for (const childId of parentConfig.children) {
      const childReddot = this.__reddots.get(childId);
      if (childReddot && childReddot.visible) {
        parentVisible = true;
        break;
      }
    }

    const parentReddot = this.__reddots.get(config.parent);
    if (parentReddot && parentReddot.visible !== parentVisible) {
      parentReddot.visible = parentVisible;
      parentReddot.updateTime = Date.now();

      // 触发父红点状态变化事件
      this.__emitChangeEvent(config.parent, parentVisible, parentReddot.data);

      // 递归更新祖父红点
      this.__updateParentState(config.parent);
    }
  }

  /**
   * 从本地存储加载红点数据
   * @param id 红点ID
   * @param reddot 红点数据对象
   */
  private __loadFromStorage(id: string, reddot: IRedDotData): void {
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
  private __saveToStorage(id: string, reddot: IRedDotData): void {
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
