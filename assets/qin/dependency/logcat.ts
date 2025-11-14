import { sys } from "cc";

import { literal } from "../ability";
import { Injectable } from "../ioc";
import { Dependency } from "./dependency";
import { ILogcat, ILogger, LoggerLevel } from "./logcat.typings";

/**
 * 日志颜色
 */
const LOGGER_COLOR: Record<LoggerLevel, string> = {
  [LoggerLevel.V]: "background-color:#888888;color:#222222;",
  [LoggerLevel.D]: "background-color:#6A6A6A;color:#FFFFFF;",
  [LoggerLevel.I]: "background-color:#21A3D1;color:#222222;",
  [LoggerLevel.W]: "background-color:#F9BB4B;color:#222222;",
  [LoggerLevel.E]: "background-color:#F47800;color:#222222;",
  [LoggerLevel.F]: "background-color:#9E83C3;color:#FFFFFF;",
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

  /** 格式化日志输出 */
  private __fmt(level: LoggerLevel, msg: string, ...args: any[]) {
    return this.__print(level, [literal.fmt(msg, ...args)]);
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

  vf(msg: string, ...args: any[]): void {
    this.__fmt(LoggerLevel.V, msg, ...args);
  }
  df(msg: string, ...args: any[]): void {
    this.__fmt(LoggerLevel.D, msg, ...args);
  }
  if(msg: string, ...args: any[]): void {
    this.__fmt(LoggerLevel.I, msg, ...args);
  }
  wf(msg: string, ...args: any[]): void {
    this.__fmt(LoggerLevel.W, msg, ...args);
  }
  ef(msg: string, ...args: any[]): void {
    this.__fmt(LoggerLevel.E, msg, ...args);
  }
  ff(msg: string, ...args: any[]): void {
    this.__fmt(LoggerLevel.F, msg, ...args);
  }
}

/**
 * 日志系统实现
 */
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

  get tweener() {
    return this.acquire("tweener");
  }

  get red() {
    return this.acquire("red");
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
