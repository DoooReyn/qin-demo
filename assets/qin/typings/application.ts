import { Language } from "../dependency";

/** 框架选项 */
export interface IApplicationOptions {
  /** 应用名称 */
  app: string;
  /** 应用版本 */
  version: string;
  /** 环境变量 */
  env: string;
  /** 默认语言 */
  language: Language;

  [key: string]: any;
}
