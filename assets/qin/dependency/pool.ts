import { instantiate, Prefab } from "cc";

import { might, misc, mock, time } from "../ability";
import ioc, { Injectable } from "../ioc";
import { Constructor } from "../typings";
import { Dependency } from "./dependency";
import {
  INodePoC, IObjectEntry, IObjectEntryOutline, IObjectPool, IObPoC, IPoolNode
} from "./pool.typings";

/**
 * 对象池条目
 */
export class ObjectEntry implements IObjectEntry {
  /** 条目概要 */
  protected get _outline(): IObjectEntryOutline {
    return this[ObjectPoolContainer.Key] as IObjectEntryOutline;
  }

  /** 条目名称 */
  public get name(): string {
    return this._outline.name;
  }

  /**
   * 池子容量限制
   * @description 容量 <= 0 时表示不限制（默认不限制）
   */
  public get capacity() {
    return 0;
  }

  /**
   * 过期时间（毫秒）
   * @description 过期时间 <= 0 时表示不过期（默认不过期）
   */
  public get expires() {
    return 0;
  }

  /**
   * 是否过期
   */
  public get expired() {
    if (!this.destroyed) {
      return false;
    }

    const expires = this.expires;
    if (expires <= 0) {
      return false;
    }

    return time.now >= expires + this._outline.recycleAt;
  }

  /**
   * 自动初始化
   * @warn 请勿手动调用
   * @param args 入参
   */
  public initialize(...args: any[]) {
    if (!this.initialized) {
      this._outline.createAt = Date.now();
      this._onStart(...args);
    }
  }

  /**
   * 自动回收
   * @warn 请勿手动调用
   */
  public recycle() {
    if (!this.destroyed) {
      this._outline.recycleAt = Date.now();
      this._outline.createAt = 0;
      this._onEnded();
      return true;
    }
    return false;
  }

  /** 是否已初始化 */
  public get initialized() {
    return this._outline.createAt > 0;
  }

  /** 是否已销毁 */
  public get destroyed() {
    return this._outline.recycleAt > 0;
  }

  /**
   * 生命周期#开始
   * @warn 请勿手动调用
   * @param args 入参
   */
  protected _onStart(...args: any[]) {}

  /**
   * 生命周期#结束
   * @warn 请勿手动调用
   */
  protected _onEnded() {}
}

/**
 * 对象池
 */
export class ObjectPool<T extends IObjectEntry> implements IObjectPool<T> {
  /** 条目列表 */
  protected readonly _items: T[];

  /** 条目构造 */
  protected readonly _cls: Constructor<T>;

  /**
   * 构造函数
   * @param cls 条目构造
   */
  constructor(cls: Constructor<T>) {
    this._cls = cls;
    this._items = [];
  }

  /** 创建条目 */
  private __create(): T {
    return new this._cls();
  }

  /** 取出条目 */
  private __fetch(): T | undefined {
    return this._items.shift();
  }

  /** 条目数量 */
  public get size() {
    return this._items.length;
  }

  /**
   * 填充条目
   * @param n 目标数量
   * @returns
   */
  public fill(n: number): void {
    if (this.size >= n) return;
    const need = n - this.size;
    for (let i = 0; i < need; i++) {
      this._items.push(this.__create());
    }
  }

  /**
   * 取出条目
   * @param args 入参
   * @returns
   */
  public acquire(...args: any[]): T {
    const instance = this.__fetch() ?? this.__create();
    instance.initialize(...args);
    return instance;
  }

  /**
   * 回收条目
   * @param instance 条目实例
   */
  public recycle(instance: T): void {
    if (instance && instance.recycle()) {
      misc.nextTick(() => {
        this._items.push(instance);
      });
    }
  }

  /** 清空条目 */
  public clear(): void {
    const size = this.size;
    for (let i = size - 1; i >= 0; i--) {
      this._items[i].recycle();
      this._items.splice(i, 1);
    }
    this._items.length = 0;
  }

  /** 检测过期条目并删除 */
  public detect() {
    const size = this.size;
    for (let i = size - 1; i >= 0; i--) {
      if (this._items[i].expired) {
        this._items.splice(i, 1);
      }
    }
  }
}

/**
 * 对象池容器
 * - 统一管理（使用和回收）所有对象池
 */
@Injectable({ name: "ObPoC" })
export class ObjectPoolContainer extends Dependency implements IObPoC {
  /** 标识 */
  public static Key: symbol = Symbol.for("ObPoC");

  /** 池子容器 */
  private __container: Map<string, IObjectPool<IObjectEntry>> = new Map();

  register(cls: Constructor<IObjectEntry>) {
    const name = ObEntryOutlineOf(cls)?.name;

    if (name == undefined) {
      throw new Error(`对象池条目必须调用装饰器 @ObEntryOutline`);
    }

    if (this.__container.has(name)) {
      throw new Error(`对象池条目 ${name} 已注册`);
    }

    console.info(`注册对象池条目：${name}`);

    this.__container.set(name, new ObjectPool(cls));
  }

  unregister(cls: Constructor<IObjectEntry>) {
    const name = ObEntryOutlineOf(cls)?.name;

    if (name == undefined) {
      throw new Error(`对象池条目必须调用装饰器 @ObEntryOutline`);
    }

    if (!this.__container.has(name)) {
      throw new Error(`对象池条目 ${name} 未注册`);
    }

    return this.__container.delete(name);
  }

  poolOf(cls: Constructor<IObjectEntry>) {
    const name = ObEntryOutlineOf(cls)?.name;
    if (name == undefined) return undefined;
    if (!this.__container.has(name)) return undefined;
    return this.__container.get(name);
  }

  acquire<T extends IObjectEntry>(cls: Constructor<T>, ...args: any[]): T | null {
    const inst = this.poolOf(cls);
    if (inst == undefined) return null;
    return inst.acquire(...args) as T;
  }

  recycle<T extends IObjectEntry>(instance: T): void {
    if (instance && instance instanceof ObjectEntry) {
      const name = instance.name;
      if (!this.__container.has(name)) {
        throw new Error(`对象池条目 ${name} 未注册`);
      }
      this.__container.get(name)!.recycle(instance);
    }
  }

  lazyCleanup() {
    this.__container.forEach((v) => v.detect());
  }

  clear(): void {
    this.__container.forEach((p) => p.clear());
    this.__container.clear();
  }
}

/**
 * 对象池条目装饰器
 * @param name 对象池条目名称
 * @returns
 */
export function ObEntryOutline(name: string) {
  return function (target: any) {
    target.prototype[ObjectPoolContainer.Key] = {
      name,
      createAt: 0,
      recycleAt: 0,
    };
    ioc.objPool.register(target);
    return target;
  };
}

/**
 * 获取对象池条目概要
 * @param target 对象池条目构造
 * @returns
 */
export function ObEntryOutlineOf(target: any) {
  return mock.memberOf<IObjectEntryOutline>(target, ObjectPoolContainer.Key);
}

/**
 * 节点池
 */
export class NodePool {
  /** 节点过期时间（毫秒） */
  public static readonly EXPIRES: number = 30_000;

  /** 节点列表 */
  private __container: IPoolNode[] = [];

  /**
   * 节点池构造器
   * @param template 模板（只支持预制体）
   * @param expires 过期时间（毫秒）
   * @warn Expires <= 0 表示永不过期
   */
  public constructor(
    public readonly template: Prefab | IPoolNode,
    public readonly expires: number = NodePool.EXPIRES
  ) {}

  /**
   * 获取节点
   * @returns
   */
  public acquire() {
    let node: IPoolNode;
    if (this.__container.length > 0) {
      node = this.__container.shift()!;
    } else {
      node = instantiate(this.template) as IPoolNode;
    }
    delete node.__recycled__;
    delete node.__expire_at__;
    return node;
  }

  /**
   * 回收节点
   * @param inst 节点实例
   */
  public recycle(inst: IPoolNode) {
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
 * 节点池容器
 */
@Injectable({ name: "NodePoC" })
export class NodePoolContainer extends Dependency implements INodePoC {
  /** 节点池容器 */
  private __container: Map<string, NodePool> = new Map();

  registerByNodeConstructor(key: string, node: Constructor<IPoolNode>, expires: number = NodePool.EXPIRES) {
    if (this.__container.has(key)) {
      throw new Error(`节点池: 注册失败，节点池已存在 ${key}`);
    }

    const template = new node();
    template.name = key;
    const pool = new NodePool(template, expires);
    this.__container.set(key, pool);

    ioc.logcat.res.i(`注册节点池条目: ${key}`);
  }

  registerByNodeInstance(key: string, node: IPoolNode, expires: number = NodePool.EXPIRES) {
    if (this.__container.has(key)) {
      throw new Error(`节点池: 注册失败，节点池已存在 ${key}`);
    }

    const template = node;
    template.name = key;
    const pool = new NodePool(template, expires);
    this.__container.set(key, pool);

    ioc.logcat.res.i(`注册节点池条目: ${key}`);
  }

  register(template: Prefab, expires: number = NodePool.EXPIRES) {
    const key = template.data.name;

    if (this.__container.has(key)) {
      throw new Error(`节点池: 注册失败，节点池已存在 ${key}`);
    }

    const pool = new NodePool(template, expires);
    this.__container.set(key, pool);

    ioc.logcat.res.i(`注册节点池条目: ${key}`);
  }

  unregister(key: string) {
    if (!this.__container.has(key)) {
      throw new Error(`节点池: 注销失败，节点池不存在 ${key}`);
    }

    const pool = this.__container.get(key)!;
    pool.clear();
    this.__container.delete(key);
  }

  has(key: string) {
    return this.__container.has(key);
  }

  templateOf(key: string) {
    if (this.__container.has(key)) {
      const pool = this.__container.get(key)!;
      return pool.template;
    }
    return null;
  }

  acquire<N extends IPoolNode>(key: string): N | null {
    if (this.__container.has(key)) {
      const pool = this.__container.get(key)!;
      return pool.acquire() as N;
    } else {
      ioc.logcat.res.w(`节点池: 获取失败，节点池不存在 ${key}`);
      return null;
    }
  }

  recycle(inst: IPoolNode) {
    if (inst && inst.isValid) {
      let key = inst.name;
      if (inst["_prefab"] && inst["_prefab"]["asset"]) {
        key = inst["_prefab"]["asset"]["name"];
      }
      if (this.__container.has(key)) {
        this.__container.get(key)!.recycle(inst);
      } else {
        ioc.logcat.res.w(`节点池: 回收失败，节点池不存在 ${key}`);
      }
    }
  }

  sizeOf(key: string) {
    if (this.__container.has(key)) {
      return this.__container.get(key)!.size;
    }
    return 0;
  }

  lazyCleanup() {
    this.__container.forEach((pool) => pool.lazyCleanup());
  }

  clear() {
    this.__container.forEach((pool) => pool.clear());
  }
}
