import { Constructor } from "./common";
import { IDependency } from "./dependency";

/** 对象池条目概要接口 */
export interface IObjectEntryOutline {
  /** 标记 */
  name: string;
  /** 创建时间 */
  createAt: number;
  /** 回收时间 */
  recycleAt: number;
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
 * 对象池管理能力接口
 */
export interface IPool extends IDependency {
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
   * 懒清理
   */
  lazyCleanup(): void;
  /**
   * 清空所有对象池
   */
  clear(): void;
}
