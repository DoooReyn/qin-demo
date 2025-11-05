import { sys } from "cc";
import { IAbility } from "./ability";

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
 * @description 日志接口为框架提供日志输出能力
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

/**
 * 日志系统接口
 * @description 日志系统接口为框架提供分类日志输出能力
 */
export interface ILogcat extends IAbility {
  /** 清空容器 */
  clear(): void;
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

/** 日志容器 */
const CONTAINER: Map<string, Logger> = new Map();

/**
 * 日志系统
 * @description 日志系统，用于记录应用程序的运行日志
 */
export const logcat: ILogcat = {
  name: "Logcat",
  description: "日志系统",
  get qin(): ILogger {
    return logcat.acquire("qin");
  },
  clear(): void {
    CONTAINER.clear();
  },
  acquire(name: string): Logger {
    if (!CONTAINER.has(name)) {
      CONTAINER.set(name, new Logger(name));
    }
    return CONTAINER.get(name)!;
  },
  with(level: LoggerLevel) {
    CONTAINER.forEach((logger) => {
      logger.level = level;
    });
  },
  on() {
    logcat.with(LoggerLevel.V);
  },
  off() {
    logcat.with(LoggerLevel.N);
  },
};
