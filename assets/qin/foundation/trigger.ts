import { might, misc } from "../ability";
import { ObEntryOutline, ObjectEntry } from "../dependency";
import { IObjectEntry } from "../typings";
import ioc from "../ioc";

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
@ObEntryOutline("Trigger")
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
        ioc.logcat.qin.e("触发器: 运行时错误", err);
      }
      if (this.__once) {
        ioc.objPool.recycle(this);
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
        ioc.logcat.qin.e("触发器: 运行时错误", err);
      }
      if (this.__once) {
        ioc.objPool.recycle(this);
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
    this.__container.forEach((trigger) => ioc.objPool.recycle(trigger));
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
    const trigger = ioc.objPool.acquire(Trigger, fn, context, once, args);
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
      ioc.objPool.recycle(trigger);
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
      ioc.objPool.recycle(trigger);
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
