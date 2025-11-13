import { Texture2D } from "cc";

import { IDependency } from "./dependency.typings";

/**
 * 性能分析器接口
 */
export interface IProfiler extends IDependency {
  /** 是否输出详细信息 */
  verbose: boolean;

  /**
   * 获取错误堆栈
   * @param depth 堆栈深度
   * @returns
   */
  getErrorStack(depth: number): string;

  /**
   * 模拟耗时操作
   * @param t 耗时，默认为10ms
   */
  simulateTimeConsumingOperation(t?: number): void;

  /**
   * 设置错误上报通讯员
   * @description 负责将错误日志上报给服务器或输出到文件
   * @param reporter 错误上报通讯员
   */
  setErrorReporter(reporter: (error: string) => void): void;

  /** 设置错误去重窗口（毫秒） */
  setErrorDedupWindow(ms: number): void;
  /** 获取错误去重窗口（毫秒） */
  getErrorDedupWindow(): number;

  /** 设置错误上报限频（窗口毫秒与最大条数，可部分设置） */
  setErrorRateLimit(options: { windowMs?: number; max?: number }): void;
  /** 获取错误上报限频配置 */
  getErrorRateLimit(): { windowMs: number; max: number };
  /** 重置当前限频窗口计数（立即生效） */
  resetErrorRateWindow(): void;

  /**
   * 跟踪钩子方法的执行，如果有错误则进行捕获上报
   * @param hook 钩子
   * @param thisArg 钩子方法的 this 指向
   * @returns
   */
  errorTrace(hook: Function, thisArg: any): void;

  /** 当前纹理数量 */
  get textureCount(): number;

  /**
   * 打印纹理日志
   * @param hashOrTexture 纹理哈希值或者纹理对象
   */
  dumpTextureLog(hashOrTexture: number | Texture2D): void;

  /** 重载网页 */
  reload(): void;
}
