import { instantiate, Node, Prefab } from "cc";

import { ioc } from "../ioc";
import { IAbility } from "./ability";
import { might } from "./might";
import { time } from "./time";

/**
 * 节点
 */
interface PoolNode extends Node {
  /** 节点回收标记 */
  __recycled__?: boolean;
  /** 节点过期标记 */
  __expire_at__?: number;
}

/**
 * 节点池
 */
export class NodePool {
  /** 节点过期时间（毫秒） */
  public static readonly EXPIRES: number = 30_000;

  /** 节点列表 */
  private __container: PoolNode[] = [];

  /**
   * 节点池构造器
   * @param template 模板（只支持预制体）
   * @param expires 过期时间（毫秒）
   * @warn Expires <= 0 表示永不过期
   */
  public constructor(public readonly template: Prefab, public readonly expires: number = NodePool.EXPIRES) {}

  /**
   * 获取节点
   * @returns
   */
  public acquire() {
    let node: PoolNode;
    if (this.__container.length > 0) {
      node = this.__container.shift()!;
    } else {
      node = instantiate(this.template);
    }
    delete node.__recycled__;
    delete node.__expire_at__;
    return node;
  }

  /**
   * 回收节点
   * @param inst 节点实例
   */
  public recycle(inst: PoolNode) {
    if (inst && inst.isValid && inst.__recycled__ === undefined) {
      inst.__recycled__ = true;
      inst.__expire_at__ = this.expires > 0 ? time.now + this.expires : 0;
      inst.removeFromParent();
      // 延迟一帧回收，避免同一帧重复使用
      ioc.timer.shared.nextTick(might.sync, might, () => this.__container.push(inst));
    }
  }

  /**
   * 清空节点池
   */
  public clear() {
    this.__container.forEach((item) => item.destroy());
    this.__container = [];
  }

  /**
   * 清理过期节点
   */
  public lazyCleanup() {
    const count = this.__container.length;
    if (count > 0) {
      const item = this.__container[count - 1];
      const expireAt = item.__expire_at__!;
      const now = time.now;
      if (expireAt > 0 && now >= expireAt) {
        this.__container.pop();
        item.destroy();
        ioc.logcat.res.d(`节点池: 节点过期，自动销毁 池子 ${this.template.name} 剩余 ${this.size}`);
      }
    }
  }

  /** 节点剩余个数 */
  public get size() {
    return this.__container.length;
  }
}

/**
 * 节点池容器能力接口
 */
export interface INodePool extends IAbility {
  /**
   * 注册节点池
   * @param key 节点池名称
   * @param template 预制体模板
   * @@param expires 过期时间（毫秒）
   */
  register(template: Prefab, expires?: number): void;
  /**
   * 注销节点池
   * @param key 节点池名称
   */
  unregister(key: string): void;
  /**
   * 节点池是否已注册
   * @param key 节点池名称
   * @returns
   */
  has(key: string): boolean;
  /**
   * 获取节点池模板资源
   * @param key 节点池名称
   * @returns
   */
  templateOf(key: string): Prefab | null;
  /**
   * 获取节点
   * @param key 节点池名称
   * @returns
   */
  acquire<N extends PoolNode>(key: string): N | null;
  /**
   * 回收节点
   * @param inst 节点实例
   */
  recycle(inst: PoolNode): void;
  /**
   * 获取节点池当前节点数量
   * @param key 节点池名称
   * @returns
   */
  sizeOf(key: string): number;
  /**
   * 懒清理
   * @description 每隔一段时间删除一个对象，防止内存溢出
   */
  lazyCleanup(): void;
  /**
   * 清空所有节点池
   */
  clear(): void;
}

/** 节点池容器 */
const CONTAINER: Map<string, NodePool> = new Map();

/**
 * 节点池容器能力实现
 */
export const nodePool: INodePool = {
  name: "NodePool",
  description: "节点池容器能力",
  register(template: Prefab, expires: number = NodePool.EXPIRES) {
    const key = template.data.name;

    if (CONTAINER.has(key)) {
      throw new Error(`节点池: 注册失败，节点池已存在 ${key}`);
    }

    const pool = new NodePool(template, expires);
    CONTAINER.set(key, pool);
  },
  unregister(key: string) {
    if (!CONTAINER.has(key)) {
      throw new Error(`节点池: 注销失败，节点池不存在 ${key}`);
    }

    const pool = CONTAINER.get(key)!;
    pool.clear();
    CONTAINER.delete(key);
  },
  has(key: string) {
    return CONTAINER.has(key);
  },
  templateOf(key: string) {
    if (CONTAINER.has(key)) {
      const pool = CONTAINER.get(key)!;
      return pool.template;
    }
    return null;
  },
  acquire<N extends PoolNode>(key: string): N | null {
    if (CONTAINER.has(key)) {
      const pool = CONTAINER.get(key)!;
      return pool.acquire() as N;
    } else {
      ioc.logcat.res.w(`节点池: 获取失败，节点池不存在 ${key}`);
      return null;
    }
  },
  recycle(inst: PoolNode) {
    if (inst && inst.isValid && inst["_prefab"] && inst["_prefab"]["asset"]) {
      const key = inst["_prefab"]["asset"]["name"];
      if (CONTAINER.has(key)) {
        CONTAINER.get(key)!.recycle(inst);
      } else {
        ioc.logcat.res.w(`节点池: 回收失败，节点池不存在 ${key}`);
      }
    }
  },
  sizeOf(key: string) {
    if (CONTAINER.has(key)) {
      return CONTAINER.get(key)!.size;
    }
    return 0;
  },
  lazyCleanup() {
    CONTAINER.forEach((pool) => pool.lazyCleanup());
  },
  clear() {
    CONTAINER.forEach((pool) => pool.clear());
  },
};
