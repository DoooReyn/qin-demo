import { sys } from "cc";

import { Injectable } from "../ioc";
import { ILogcat, ILogger, LoggerLevel } from "../typings/logcat";
import { Dependency } from "./dependency";

/**
 * 日志颜色
 */
const LOGGER_COLOR: Record<LoggerLevel, string> = {
  [LoggerLevel.V]: "background-color:#9F9F9F;color:#222222;",
  [LoggerLevel.D]: "background-color:#6A6A6A;color:#FFFFFF;",
  [LoggerLevel.I]: "background-color:#00FF00;color:#222222;",
  [LoggerLevel.W]: "background-color:#FFFF00;color:#222222;",
  [LoggerLevel.E]: "background-color:#FF0000;color:#222222;",
  [LoggerLevel.F]: "background-color:#AA0000;color:#FFFFFF;",
  [LoggerLevel.N]: "background-color:#CCCCCC;color:#222222;",
} as const;

/**
 * 日志级别输出函数
 */
const LOGGER_LEVEL_ENTRY: Record<LoggerLevel, (...args: any[]) => void> = {
  [LoggerLevel.V]: console.debug,
  [LoggerLevel.D]: console.debug,
  [LoggerLevel.I]: console.info,
  [LoggerLevel.W]: console.warn,
  [LoggerLevel.E]: console.error,
  [LoggerLevel.F]: console.error,
  [LoggerLevel.N]: () => {},
} as const;

/**
 * 日志
 * @description 日志为框架提供日志输出能力
 */
class Logger implements ILogger {
  /** 日志级别 */
  private __level: LoggerLevel = LoggerLevel.V;

  /**
   * 构造函数
   * @param header 日志头
   */
  constructor(public readonly header: string) {}

  /** 日志级别 */
  get level(): LoggerLevel {
    return this.__level;
  }
  set level(level: LoggerLevel) {
    this.__level = level;
  }

  /** 日志输出 */
  private __print(level: LoggerLevel, msg: any[]): void {
    if (level >= this.__level) {
      const fn = LOGGER_LEVEL_ENTRY[level];
      const date = new Date();
      const time = date.toLocaleTimeString() + "." + date.getMilliseconds();
      const prefix = `[${LoggerLevel[level]}] ${this.header} ${time}`;
      if (sys.isBrowser) {
        fn(`%c${prefix}`, LOGGER_COLOR[level], ...msg);
      } else {
        fn(prefix, ...msg);
      }
    }
  }

  /** 详细日志 */
  v(...msg: any[]): void {
    this.__print(LoggerLevel.V, msg);
  }

  /** 调试日志 */
  d(...msg: any[]): void {
    this.__print(LoggerLevel.D, msg);
  }

  /** 信息日志 */
  i(...msg: any[]): void {
    this.__print(LoggerLevel.I, msg);
  }

  /** 警告日志 */
  w(...msg: any[]): void {
    this.__print(LoggerLevel.W, msg);
  }

  /** 错误日志 */
  e(...msg: any[]): void {
    this.__print(LoggerLevel.E, msg);
  }

  /** 致命错误日志 */
  f(...msg: any[]): void {
    this.__print(LoggerLevel.F, msg);
  }
}

@Injectable({ name: "Logcat" })
export class Logcat extends Dependency implements ILogcat {
  /** 日志容器 */
  private __container: Map<string, Logger> = new Map();

  get qin(): ILogger {
    return this.acquire("qin");
  }

  get res() {
    return this.acquire("res");
  }

  clear(): void {
    this.__container.clear();
  }

  acquire(name: string): Logger {
    if (!this.__container.has(name)) {
      this.__container.set(name, new Logger(name));
    }
    return this.__container.get(name)!;
  }

  with(level: LoggerLevel) {
    this.__container.forEach((logger) => {
      logger.level = level;
    });
  }

  on() {
    this.with(LoggerLevel.V);
  }

  off() {
    this.with(LoggerLevel.N);
  }
}
