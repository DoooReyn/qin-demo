import { IObjectEntry, ITriggers } from "../ability";
import { IService } from "./service";

/**
 * 计数器接口
 */
export interface ICounter extends IObjectEntry {
  /** 触发器#计次 */
  onCount: ITriggers;
  /** 触发器#按帧计次 */
  onTick: ITriggers;
  /** 触发器#按固定频率计次 */
  onFixedTick: ITriggers;
  /** 触发器#完成 */
  onDone: ITriggers;
  /** 计时#累计次数 */
  get count(): number;
  /** 计时#是否完成 */
  get done(): boolean;
  /** 设定#计次总数 */
  get total(): number;
  /** 设定#计次间隔 */
  get interval(): number;
  /** 计时#累计时间 */
  get accumulated(): number;
  /**
   * 累加时间片
   * @param dt 时间片
   */
  update(dt: number): void;
}

/**
 * 定时器接口
 */
export interface ITick {
  /** 定时器标识 */
  readonly name: string;
  /** 运行 */
  run(): void;
  /** 暂停 */
  pause(): void;
  /** 停止 */
  stop(): void;
  /**
   * 添加计数器
   * @param interval 设定间隔
   * @param total 设定计数
   * @returns
   */
  add(interval?: number, total?: number): ICounter;
  /**
   * 移除计数器
   * @param counter 计数器
   */
  del(counter: ICounter): void;
  /**
   * 下一帧执行
   * @param fn 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  nextTick(fn: Function, context: any, ...args: any[]): ICounter;
  /**
   * N 帧后执行
   * @param n 帧数
   * @param fn 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  nextTicks(n: number, fn: Function, context: any, ...args: any[]): ICounter;
  /**
   * 延迟执行
   * @param interval 设定间隔
   * @param fn 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  delay(interval: number, fn: Function, context: any, ...args: any[]): ICounter;
  /**
   * 计次执行
   * @param interval 设定间隔
   * @param total 设定计数
   * @param fn 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  repeat(
    interval: number,
    total: number,
    fn: Function,
    context: any,
    ...args: any[]
  ): ICounter;
  /**
   * 重复执行
   * @param interval 设定间隔
   * @param fn 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  loop(interval: number, fn: Function, context: any, ...args: any[]): ICounter;
  /**
   * 每帧执行
   * @param fn 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  everyTick(fn: Function, context: any, ...args: any[]): ICounter;
  /**
   * 以固定频率重复执行
   * @param fn 回调方法
   * @param context 回调上下文
   * @param args 回调入参
   * @returns
   */
  fixedTick(
    interval: number,
    fn: Function,
    context: any,
    ...args: any[]
  ): ICounter;
  /**
   * 当前速率
   */
  speed: number;
  /**
   * 累积时间片
   * @param dt 时间片
   */
  update(dt: number): void;
}

/**
 * 定时器服务接口
 * @description 定时器服务接口定义了定时器服务的行为
 */
export interface ITimerService extends IService {
  /**
   * 获取定时器
   * @param key 定时器标识
   */
  acquire(key: string): ITick;
  /**
   * 获取应用级定时器
   * - 一般的，不应对此定时器调速
   */
  get app(): ITick;
  /**
   * 获取共享定时器
   * - 一般的，不应对此定时器调速
   */
  get shared(): ITick;
  /**
   * 获取通用可变速定时器
   * - 一般的，此定时器用于需要变速的环境
   */
  get varying(): ITick;
  /**
   * 暂停所有定时器（不包括 Director）
   */
  pauseAll(): void;
  /**
   * 恢复所有定时器（不包括 Director）
   */
  resumeAll(): void;
  /**
   * 停止（清除）所有定时器（不包括 Director）
   */
  stopAll(): void;
}
