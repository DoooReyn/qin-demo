import { Node, Prefab } from "cc";

import { Constructor } from "../typings/common.typings";
import { IDependency } from "./dependency.typings";

/** 对象池条目概要接口 */
export interface IObjectEntryOutline {
  /** 标记 */
  name: string;
  /** 容量 */
  capacity: number;
  /** 过期时间（毫秒） */
  expires: number;
}

/**
 * 对象池条目接口
 */
export interface IObjectEntry {
  /** 条目名称 */
  get name(): string;
  /**
   * 池子容量限制
   * @description 容量 <= 0 时表示不限制（默认不限制）
   */
  get capacity(): number;
  /**
   * 过期时间（毫秒）
   * @description 过期时间 <= 0 时表示不过期（默认不过期）
   */
  get expires(): number;
  /**
   * 是否过期
   */
  get expired(): boolean;
  /** 是否已初始化 */
  get initialized(): boolean;
  /** 是否已销毁 */
  get destroyed(): boolean;
  /**
   * 自动初始化
   * @warn 请勿手动调用
   * @param args 入参
   */
  initialize(...args: any[]): void;
  /**
   * 自动回收
   * @warn 请勿手动调用
   */
  recycle(): boolean;
  /** 重置 */
  reset(): void;
}

/**
 * 对象池接口
 */
export interface IObjectPool<T extends IObjectEntry> {
  /** 条目数量 */
  get size(): number;
  /**
   * 填充条目
   * @param n 目标数量
   * @returns
   */
  fill(n: number): void;
  /**
   * 取出条目
   * @param args 入参
   * @returns
   */
  acquire(...args: any[]): T;
  /**
   * 回收条目
   * @param instance 条目实例
   */
  recycle(instance: T): void;
  /** 清空条目 */
  clear(): void;
  /** 检测过期条目并删除 */
  detect(): void;
}

/**
 * 对象池容器接口
 */
export interface IObPoC extends IDependency {
  /**
   * 注册对象池
   * @param cls 对象池条目构造
   * @returns
   */
  register(cls: Constructor<IObjectEntry>): void;
  /**
   * 注销对象池
   * @param cls 对象池条目构造
   * @returns
   */
  unregister(cls: Constructor<IObjectEntry>): void;
  /**
   * 检查对象池是否存在
   * @param cls 对象池条目构造
   * @returns
   */
  has(cls: Constructor<IObjectEntry>): boolean;
  /**
   * 获取对象池
   * @param cls 对象池条目构造
   * @returns
   */
  poolOf(cls: Constructor<IObjectEntry>): IObjectPool<IObjectEntry>;
  /**
   * 获取对象池条目实例
   * @param cls 对象池条目构造
   * @param args 实例化参数
   * @returns
   */
  acquire<T extends IObjectEntry>(cls: Constructor<T>, ...args: any[]): T | null;
  /**
   * 回收对象池条目实例
   * @param instance 对象池条目实例
   */
  recycle<T extends IObjectEntry>(instance: T): void;
  /**
   * 清理未使用对象
   */
  clearUnused(): void;
  /**
   * 清空所有对象池
   */
  clear(): void;
}

/**
 * 节点池条目
 */
export interface IPoolNode extends Node {
  /** 节点回收标记 */
  __recycled__?: boolean;
  /** 节点过期标记 */
  __expire_at__?: number;
}

/**
 * 节点池容器能力接口
 */
export interface INodePoC extends IDependency {
  /**
   * 注册节点池
   * @param key 节点池名称
   * @param template 模板
   * @@param expires 过期时间（毫秒）
   */
  registerByNodeConstructor(key: string, node: Constructor<IPoolNode>, expires?: number): void;
  /**
   * 注册节点池
   * @param key 节点池名称
   * @param template 模板
   * @@param expires 过期时间（毫秒）
   */
  registerByNodeInstance(key: string, node: IPoolNode, expires?: number): void;
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
  templateOf(key: string): Prefab | IPoolNode | null;
  /**
   * 获取节点
   * @param key 节点池名称
   * @returns
   */
  acquire<N extends IPoolNode>(key: string): N | null;
  /**
   * 回收节点
   * @param inst 节点实例
   */
  recycle(inst: IPoolNode): void;
  /**
   * 获取节点池当前节点数量
   * @param key 节点池名称
   * @returns
   */
  sizeOf(key: string): number;
  /**
   * 清理未使用节点
   */
  clearUnused(): void;
  /**
   * 清空所有节点池
   */
  clear(): void;
}
