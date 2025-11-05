import { misc } from "./misc";
import { time } from "./time";
import { Constructor } from "../typings/common";
import { IAbility } from "./ability";
import { mock } from "./mock";
import { logcat } from "./logcat";
import { might } from "./might";

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
  recycle(): void;
}

/**
 * 对象池条目
 */
export class ObjectEntry {
  /** 条目概要 */
  protected get _outline(): IObjectEntryOutline {
    return this[pool.key] as IObjectEntryOutline;
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
 * 对象池管理能力接口
 */
export interface IPool extends IAbility {
  /** 标识 */
  key: symbol;
  /**
   * 对象池条目装饰器
   * @param name
   */
  obEntryOutline(name: string): any;
  /**
   * 获取对象池条目概要
   * @param target
   */
  obEntryOutlineOf(target: any): IObjectEntryOutline;
  /**
   * 注册对象池
   * @param cls 对象池条目构造
   * @returns
   */
  register(cls: Constructor<ObjectEntry>): void;
  /**
   * 注销对象池
   * @param cls 对象池条目构造
   * @returns
   */
  unregister(cls: Constructor<ObjectEntry>): void;
  /**
   * 获取对象池
   * @param cls 对象池条目构造
   * @returns
   */
  poolOf(cls: Constructor<ObjectEntry>): ObjectPool<ObjectEntry>;
  /**
   * 获取对象池条目实例
   * @param cls 对象池条目构造
   * @param args 实例化参数
   * @returns
   */
  acquire<T extends ObjectEntry>(cls: Constructor<T>, ...args: any[]): T | null;
  /**
   * 回收对象池条目实例
   * @param instance 对象池条目实例
   */
  recycle<T extends ObjectEntry>(instance: T): void;
  /**
   * 懒清理
   */
  lazyCleanup(): void;
  /**
   * 清空所有对象池
   */
  clear(): void;
}

/**
 * 对象池
 */
export class ObjectPool<T extends ObjectEntry> {
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

/** 池子容器 */
const CONTAINER: Map<string, ObjectPool<ObjectEntry>> = new Map();

/**
 * 对象池管理能力实现
 * - 统一管理（使用和回收）所有对象池
 */
export const pool: IPool = {
  name: "Pool",
  description: "对象池管理",
  key: Symbol.for("OBJ_ENTRY"),
  obEntryOutline(name: string) {
    return function (target: any) {
      target.prototype[pool.key] = {
        name,
        createAt: 0,
        recycleAt: 0,
      };
      pool.register(target);
      return target;
    };
  },
  obEntryOutlineOf(target: any) {
    return mock.memberOf<IObjectEntryOutline>(target, pool.key);
  },
  register(cls: Constructor<ObjectEntry>) {
    const name = pool.obEntryOutlineOf(cls)?.name;

    if (name == undefined) {
      throw new Error(`对象池条目必须调用装饰器 @pool.obEntryOutline`);
    }

    if (CONTAINER.has(name)) {
      throw new Error(`对象池条目 ${name} 已注册`);
    }

    logcat.qin.i("注册对象池条目：" + name);

    CONTAINER.set(name, new ObjectPool(cls));
  },
  unregister(cls: Constructor<ObjectEntry>) {
    const name = pool.obEntryOutlineOf(cls)?.name;

    if (name == undefined) {
      throw new Error(`对象池条目必须调用装饰器 @pool.obEntryOutline`);
    }

    if (!CONTAINER.has(name)) {
      throw new Error(`对象池条目 ${name} 未注册`);
    }

    return CONTAINER.delete(name);
  },
  poolOf(cls: Constructor<ObjectEntry>) {
    const name = pool.obEntryOutlineOf(cls)?.name;
    if (name == undefined) return undefined;
    if (!CONTAINER.has(name)) return undefined;
    return CONTAINER.get(name);
  },
  acquire<T extends ObjectEntry>(
    cls: Constructor<T>,
    ...args: any[]
  ): T | null {
    const inst = pool.poolOf(cls) as ObjectPool<T>;
    if (inst == undefined) return null;
    return inst.acquire(...args);
  },
  recycle<T extends ObjectEntry>(instance: T): void {
    if (instance && instance instanceof ObjectEntry) {
      const name = instance.name;
      if (!CONTAINER.has(name)) {
        throw new Error(`对象池条目 ${name} 未注册`);
      }
      CONTAINER.get(name)!.recycle(instance);
    }
  },
  lazyCleanup() {
    CONTAINER.forEach((v) => v.detect());
  },
  clear(): void {
    CONTAINER.forEach((p) => p.clear());
    CONTAINER.clear();
  },
};

/**
 * 触发器接口
 */
export interface ITrigger extends IObjectEntry {
  /**
   * 是否有效
   */
  get isValid(): boolean;
  /**
   * 比较触发器是否一致
   * @param trigger 触发器
   * @returns
   */
  equals(trigger: Trigger): boolean;
  /**
   * 比较触发器是否一致
   * @param fn 回调方法
   * @param context 回调上下文
   * @returns
   */
  equalsWith(fn: Function, context: any): boolean;
  /**
   * 运行触发器
   */
  run(): void;
  /**
   * 运行触发器
   * @param args 额外入参（插入到原始入参之前）
   */
  runWith(...args: any[]): void;
}

/**
 * 触发器容器接口
 */
export interface ITriggers {
  /**
   * 清空触发器
   */
  clear(): void;
  /**
   * 添加触发器
   * @param fn 回调方法
   * @param context 回调上下文
   * @param once 是否一次性
   * @param args 回调入参
   */
  add(fn: Function, context?: any, once?: boolean, ...args: any[]): void;
  /**
   * 移除触发器
   * @param fn 回调方法
   * @param context 回调上下文
   */
  delWith(fn: Function, context?: any): void;
  /**
   * 移除触发器
   * @param trigger 触发器
   */
  del(trigger: Trigger): void;
  /**
   * 运行触发器
   */
  run(): void;
  /**
   * 运行触发器
   * @param args 额外入参（插入到原始入参之前）
   */
  runWith(...args: any[]): void;
}

/**
 * 触发器
 */
@pool.obEntryOutline("Trigger")
export class Trigger extends ObjectEntry implements ITrigger {
  /** 回调方法 */
  private __handle: ((...args: any[]) => unknown) | null = null;
  /** 回调上下文 */
  private __ctx: any = null;
  /** 是否一次性 */
  private __once: boolean = false;
  /** 回调入参 */
  private __args: any[] = [];

  protected _onStart(
    handle: (...args: any[]) => unknown,
    context: any,
    once: boolean = false,
    args: any[]
  ) {
    super._onStart();
    this.__handle = handle;
    this.__ctx = context;
    this.__once = once;
    this.__args = args;
  }

  protected _onEnded() {
    super._onEnded();
    this.__handle = null;
    this.__ctx = null;
    this.__once = false;
    this.__args = [];
  }

  /**
   * 是否有效
   */
  public get isValid() {
    return this.__handle && this.__ctx;
  }

  /**
   * 比较触发器是否一致
   * @param trigger 触发器
   * @returns
   */
  public equals(trigger: Trigger) {
    return this.__handle === trigger.__handle && this.__ctx === trigger.__ctx;
  }

  /**
   * 比较触发器是否一致
   * @param fn 回调方法
   * @param context 回调上下文
   * @returns
   */
  public equalsWith(fn: Function, context: any) {
    return this.__handle === fn && this.__ctx === context;
  }

  /**
   * 运行触发器
   */
  public run() {
    if (this.isValid) {
      const [, err] = might.sync(this.__handle!, this.__ctx, this.__args);
      if (err) {
        logcat.qin.e("触发器: 运行时错误", err);
      }
      if (this.__once) {
        pool.recycle(this);
      }
    }
  }

  /**
   * 运行触发器
   * @param args 额外入参（插入到原始入参之前）
   */
  public runWith(...args: any[]) {
    if (this.isValid) {
      const [, err] = might.sync(
        this.__handle!,
        this.__ctx,
        args.concat(this.__args)
      );
      if (err) {
        logcat.qin.e("触发器: 运行时错误", err);
      }
      if (this.__once) {
        pool.recycle(this);
      }
    }
  }
}

/**
 * 触发器容器
 */
export class Triggers implements ITriggers {
  /** 触发器列表 */
  private __container: Trigger[] = [];

  /**
   * 清空触发器
   */
  public clear() {
    this.__container.forEach((trigger) => pool.recycle(trigger));
    this.__container.length = 0;
  }

  /**
   * 添加触发器
   * @param fn 回调方法
   * @param context 回调上下文
   * @param once 是否一次性
   * @param args 回调入参
   */
  public add(
    fn: Function,
    context: any = misc.ctx,
    once: boolean = false,
    ...args: any[]
  ) {
    const trigger = pool.acquire(Trigger, fn, context, once, args);
    if (trigger !== null) {
      this.__container.push(trigger);
    }
  }

  /**
   * 移除触发器
   * @param fn 回调方法
   * @param context 回调上下文
   */
  public delWith(fn: Function, context: any = misc.ctx) {
    const at = this.__container.findIndex((trg) => trg.equalsWith(fn, context));
    if (at > -1) {
      const trigger = this.__container[at];
      pool.recycle(trigger);
      this.__container.splice(at, 1);
    }
  }

  /**
   * 移除触发器
   * @param trigger 触发器
   */
  public del(trigger: Trigger) {
    const at = this.__container.findIndex((trg) => trg.equals(trigger));
    if (at > -1) {
      const trigger = this.__container[at];
      pool.recycle(trigger);
      this.__container.splice(at, 1);
    }
  }

  /**
   * 运行触发器
   */
  public run() {
    for (let i = this.__container.length - 1; i >= 0; i--) {
      const trigger = this.__container[i];
      trigger.run();
      if (trigger.destroyed) {
        this.__container.splice(i, 1);
      }
    }
  }

  /**
   * 运行触发器
   * @param args 额外入参（插入到原始入参之前）
   */
  public runWith(...args: any[]) {
    for (let i = this.__container.length - 1; i >= 0; i--) {
      const trigger = this.__container[i];
      trigger.runWith(...args);
      if (trigger.destroyed) {
        this.__container.splice(i, 1);
      }
    }
  }
}
