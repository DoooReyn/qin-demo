import { time } from "../../ability";
import { Counter } from "./counter";
import { ITick } from "../../typings";
import ioc from "../../ioc";

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
    const counter = ioc.pool.acquire(Counter, interval, total);
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
    this.__container.forEach((counter) => ioc.pool.recycle(counter));
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
