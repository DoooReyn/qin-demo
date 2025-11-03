import { IDependency } from "../../typings/dependency";
import { Logger } from "./logger";

/**
 * 日志系统
 * - @description 日志系统，用于记录应用程序的运行日志
 */
export class Logcat implements IDependency {
  /** 依赖名称 */
  readonly name: string = "Logcat";
  /** 依赖描述 */
  readonly description: string = "日志系统";
  
  /** 日志记录器容器 */
  private __container: Map<string, Logger> = new Map();

  onAttach(): void {
    this.acquire("sys");
    this.acquire("gui");
    this.acquire("res");
    this.acquire("net");
    this.acquire("app");
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
}
