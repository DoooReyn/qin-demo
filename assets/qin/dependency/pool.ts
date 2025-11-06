import ioc, { Injectable } from "../ioc";
import {
  Constructor,
  IObjectEntry,
  IObjectEntryOutline,
  IObjectPool,
  IPool,
} from "../typings";
import { misc, mock, time } from "../ability";
import { Dependency } from "./dependency";

/**
 * 对象池条目
 */
export class ObjectEntry implements IObjectEntry {
  /** 条目概要 */
  protected get _outline(): IObjectEntryOutline {
    return this[Pool.key] as IObjectEntryOutline;
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
 * 对象池管理
 * - 统一管理（使用和回收）所有对象池
 */
@Injectable({ name: "Pool" })
export class Pool extends Dependency implements IPool {
  public static key: symbol = Symbol.for("OBJ_ENTRY");

  /** 池子容器 */
  private __container: Map<string, IObjectPool<IObjectEntry>> = new Map();

  register(cls: Constructor<IObjectEntry>) {
    const name = ObEntryOutlineOf(cls)?.name;

    if (name == undefined) {
      throw new Error(`对象池条目必须调用装饰器 @pool.obEntryOutline`);
    }

    if (this.__container.has(name)) {
      throw new Error(`对象池条目 ${name} 已注册`);
    }

    ioc.logcat.qin.i("注册对象池条目：" + name);

    this.__container.set(name, new ObjectPool(cls));
  }

  unregister(cls: Constructor<IObjectEntry>) {
    const name = ObEntryOutlineOf(cls)?.name;

    if (name == undefined) {
      throw new Error(`对象池条目必须调用装饰器 @pool.obEntryOutline`);
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

  acquire<T extends IObjectEntry>(
    cls: Constructor<T>,
    ...args: any[]
  ): T | null {
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
    target.prototype[Pool.key] = {
      name,
      createAt: 0,
      recycleAt: 0,
    };
    ioc.pool.register(target);
    return target;
  };
}

/**
 * 获取对象池条目概要
 * @param target 对象池条目构造
 * @returns
 */
export function ObEntryOutlineOf(target: any) {
  return mock.memberOf<IObjectEntryOutline>(target, Pool.key);
}
