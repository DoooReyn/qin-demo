import { ILogcat, LoggerLevel } from "../../typings/logcat";
import { Logger } from "./logger";

/**
 * 日志系统
 * - @description 日志系统，用于记录应用程序的运行日志
 */
export class Logcat implements ILogcat {
  readonly name: string = "Logcat";
  readonly description: string = "日志系统";

  /** 日志记录器容器 */
  private __container: Map<string, Logger> = new Map();

  onAttach(): void {
    this.acquire("qin");
  }

  onDetach(): void {
    this.__container.clear();
  }

  /**
   * 获取日志记录器
   * @param name 日志记录器名称
   * @returns 日志记录器
   */
  acquire(name: string): Logger {
    if (!this.__container.has(name)) {
      this.__container.set(name, new Logger(name));
    }
    return this.__container.get(name)!;
  }

  /** 获取默认日志记录器 */
  get qin() {
    return this.acquire("qin");
  }

  /**
   * 统一设置日志级别
   * @param level 日志级别
   */
  with(level: LoggerLevel) {
    this.__container.forEach((logger) => {
      logger.level = level;
    });
  }

  /**
   * 开启所有日志记录器
   */
  on() {
    this.with(LoggerLevel.V);
  }

  /**
   * 关闭所有日志记录器
   */
  off() {
    this.with(LoggerLevel.N);
  }
}
