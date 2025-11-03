import { LoggerLevel } from "../../typings/logcat";

/**
 * 日志颜色
 */
export const LOGGER_COLOR: Record<LoggerLevel, string> = {
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
export const LOGGER_LEVEL_ENTRY: Record<LoggerLevel, (...args: any[]) => void> =
  {
    [LoggerLevel.V]: console.debug,
    [LoggerLevel.D]: console.debug,
    [LoggerLevel.I]: console.info,
    [LoggerLevel.W]: console.warn,
    [LoggerLevel.E]: console.error,
    [LoggerLevel.F]: console.error,
    [LoggerLevel.N]: () => {},
  } as const;
export { LoggerLevel };

