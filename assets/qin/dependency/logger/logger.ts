import { sys } from "cc";
import { LOGGER_COLOR, LOGGER_LEVEL_ENTRY, LoggerLevel } from "./typings";
import { ILogger } from "../../typings/logcat";

/**
 * 日志
 * - @description 日志为框架提供日志输出能力
 */
export class Logger implements ILogger {
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
