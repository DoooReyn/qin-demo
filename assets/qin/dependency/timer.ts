import ioc, { Injectable } from "../ioc";
import { ITimer, ICounter, ITick } from "../typings";
import { Dependency } from "./dependency";
import { Triggers } from "../foundation";
import { ObEntryOutline, ObjectEntry } from "./pool";
import { time } from "../ability";

/**
 * 计数器
 */
@ObEntryOutline("Counter")
export class Counter extends ObjectEntry implements ICounter {
  /** 设定#计次间隔 */
  protected _interval: number = 0;
  /** 设定#计次总数 */
  protected _total: number = 1;
  /** 计时#累计时间 */
  protected _accumulated: number = 0;
  /** 计时#剩余时间 */
  protected _rest: number = 0;
  /** 计时#累计次数 */
  protected _count: number = 0;
  /** 计时#是否完成 */
  protected _done: boolean = false;
  /** 触发器#计次 */
  public onCount: Triggers = new Triggers();
  /** 触发器#按帧计次 */
  public onTick: Triggers = new Triggers();
  /** 触发器#按固定频率计次 */
  public onFixedTick: Triggers = new Triggers();
  /** 触发器#完成 */
  public onDone: Triggers = new Triggers();

  /** 计时#累计次数 */
  public get count() {
    return this._count;
  }

  /** 计时#是否完成 */
  public get done() {
    return this._done;
  }

  /** 设定#计次总数 */
  public get total() {
    return this._total;
  }

  /** 设定#计次间隔 */
  public get interval() {
    return this._interval;
  }

  /** 计时#累计时间 */
  public get accumulated() {
    return this._accumulated;
  }

  public get capacity() {
    return 32;
  }

  public get expires() {
    return 600_000;
  }

  protected _onStart(interval: number = 0, total: number = 1): void {
    this._interval = interval;
    this._total = total;
    this._accumulated = 0;
    this._rest = 0;
    this._count = 0;
    this._done = false;
  }

  protected _onEnded(): void {
    this.onCount.clear();
    this.onTick.clear();
    this.onFixedTick.clear();
    this.onDone.clear();
  }

  /**
   * 累加时间片
   * @param dt 时间片
   */
  public update(dt: number) {
    if (!this._done) {
      this._accumulated += dt;
      this._rest += dt;
      this.onTick.runWith(dt);
      if (this._rest >= this._interval) {
        this._rest -= this._interval;
        this._count++;
        this.onFixedTick.runWith(this._interval);
        this.onCount.runWith(this._count, this._total);
        if (this._total > 0 && this._count >= this._total) {
          this.onDone.run();
          this.recycle();
          this._done = true;
        }
      }
    }
  }
}

/**
 * 定时器
 */
export class Tick implements ITick {
  /** 定时器标识 */
  public readonly name: string = "tick";
  /** 是否运行中 */
  private __running: boolean = false;
  /** 计数器列表 */
  private __container: Counter[] = [];
  /** 当前速率 */
  private __speed: number = 1;

  /**
   * 定时器构造
   */
  public constructor() {
    this.__running = true;
  }

  /** 运行 */
  public run() {
    if (!this.__running) {
      this.__running = true;
    }
  }

  /** 暂停 */
  public pause() {
    if (this.__running) {
      this.__running = false;
    }
  }

  /** 停止 */
  public stop() {
    if (this.__running) {
      this.__running = false;
      this.__clear();
    }
  }

  /**
   * 添加计数器
   * @param interval 设定间隔
   * @param total 设定计数
   * @returns
   */
  public add(interval: number = 0, total: number = 1) {
    const counter = ioc.objPool.acquire(Counter, interval, total);
    this.__container.push(counter);
    return counter;
  }

  /**
   * 移除计数器
   * @param counter 计数器
   */
  public del(counter: Counter) {
    const index = this.__container.indexOf(counter);
    if (index >= 0) {
      this.__container.splice(index, 1);
    }
  }

  /**
   * 下一帧执行
   * @param fn 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  public nextTick(fn: Function, context: any, ...args: any[]) {
    return this.delay(0, fn, context, ...args);
  }

  /**
   * N 帧后执行
   * @param n 帧数
   * @param fn 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  public nextTicks(n: number, fn: Function, context: any, ...args: any[]) {
    const t = n <= 0 ? 0 : n * time.frameOf(60);
    return this.delay(t, fn, context, ...args);
  }

  /**
   * 延迟执行
   * @param interval 设定间隔
   * @param fn 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  public delay(interval: number, fn: Function, context: any, ...args: any[]) {
    const counter = this.add(interval);
    counter.onDone.add(fn, context, true, ...args);
    return counter;
  }

  /**
   * 计次执行
   * @param interval 设定间隔
   * @param total 设定计数
   * @param fn 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  public repeat(
    interval: number,
    total: number,
    fn: Function,
    context: any,
    ...args: any[]
  ) {
    const counter = this.add(interval, total);
    counter.onCount.add(fn, context, false, ...args);
    return counter;
  }

  /**
   * 重复执行
   * @param interval 设定间隔
   * @param fn 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  public loop(interval: number, fn: Function, context: any, ...args: any[]) {
    const counter = this.add(interval, 0);
    counter.onCount.add(fn, context, false, ...args);
    return counter;
  }

  /**
   * 每帧执行
   * @param fn 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  public everyTick(fn: Function, context: any, ...args: any[]) {
    const counter = this.add(0, 0);
    counter.onTick.add(fn, context, false, ...args);
    return counter;
  }

  /**
   * 以固定频率重复执行
   * @param fn 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  public fixedTick(
    interval: number,
    fn: Function,
    context: any,
    ...args: any[]
  ) {
    const counter = this.add(interval, 0);
    counter.onFixedTick.add(fn, context, false, ...args);
    return counter;
  }

  /**
   * 清空所有计数器
   */
  private __clear() {
    this.__container.forEach((counter) => ioc.objPool.recycle(counter));
    this.__container.length = 0;
  }

  /**
   * 当前速率
   */
  public get speed() {
    return this.__speed;
  }

  public set speed(v: number) {
    this.__speed = v;
  }

  /**
   * 累积时间片
   * @param dt 时间片
   */
  public update(dt: number) {
    if (this.__running) {
      for (
        let i = 0, l = this.__container.length, counter: Counter;
        i < l;
        i++
      ) {
        counter = this.__container[i];
        counter.update(dt * this.__speed);
        if (counter.done) {
          this.__container.splice(i, 1);
          i--;
          l--;
        }
      }
    }
  }
}

/**
 * 定时器容器
 * @description 提供了时器的安装、卸载和更新功能
 */
@Injectable({ name: "Timer" })
export class Timer extends Dependency implements ITimer {
  /** 定时器容器 */
  private readonly __container: Map<string, Tick> = new Map();

  onDetach(): Promise<void> {
    this.stop();
    return super.onDetach();
  }

  /**
   * 获取定时器
   * @param key 定时器标识
   */
  public acquire(key: string) {
    let tick = this.__container.get(key);
    if (!tick) {
      tick = new Tick();
      this.__container.set(key, tick);
    }
    return tick;
  }

  /**
   * 获取共享定时器
   * - 一般的，不应对此定时器调速
   */
  public get shared() {
    return this.acquire("shared");
  }

  /**
   * 暂停所有定时器（不包括 Director）
   */
  public pause() {
    this.__container.forEach((tick) => tick.pause());
  }

  /**
   * 恢复所有定时器（不包括 Director）
   */
  public resume() {
    this.__container.forEach((tick) => tick.run());
  }

  /**
   * 停止（清除）所有定时器
   */
  public stop() {
    this.pause();
    this.__container.forEach((tick) => tick.stop());
    this.__container.clear();
  }

  /**
   * 更新所有定时器
   * @param dt 时间片
   */
  public update(dt: number) {
    this.__container.forEach((tick) => tick.update(dt));
  }
}
