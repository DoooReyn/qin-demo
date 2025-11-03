import { IDependency } from "./dependency";

/**
 * 日志级别
 */
export enum LoggerLevel {
  /** 详细日志 */
  V = 0,
  /** 调试日志 */
  D = 1,
  /** 信息日志 */
  I = 2,
  /** 警告日志 */
  W = 3,
  /** 错误日志 */
  E = 4,
  /** 致命错误日志 */
  F = 5,
  /** 无日志 */
  N = 99,
}

/**
 * 日志接口
 * - @description 日志接口为框架提供日志输出能力
 */
export interface ILogger {
  /** 日志级别 */
  level: LoggerLevel;
  /**
   * 打印详细日志
   * @param msg 日志消息
   */
  v(...msg: any[]): void;
  /**
   * 打印调试日志
   * @param msg 日志消息
   */
  d(...msg: any[]): void;
  /**
   * 打印信息日志
   * @param msg 日志消息
   */
  i(...msg: any[]): void;
  /**
   * 打印警告日志
   * @param msg 日志消息
   */
  w(...msg: any[]): void;
  /**
   * 打印错误日志
   * @param msg 日志消息
   */
  e(...msg: any[]): void;
  /**
   * 打印致命错误日志
   * @param msg 日志消息
   */
  f(...msg: any[]): void;
}

/**
 * 日志系统接口
 * - @description 日志系统接口为框架提供分类日志输出能力
 */
export interface ILogcat extends IDependency {
  /**
   * 获取日志记录器
   * @param name 日志记录器名称
   * @returns 日志记录器
   */
  acquire(name: string): ILogger;

  /**
   * 统一设置日志级别
   * @param level 日志级别
   */
  with(level: LoggerLevel): void;

  /**
   * 开启所有日志记录器
   */
  on(): void;
  
  /**
   * 关闭所有日志记录器
   */
  off(): void;

  /** 获取默认日志记录器 */
  get qin(): ILogger;
}
