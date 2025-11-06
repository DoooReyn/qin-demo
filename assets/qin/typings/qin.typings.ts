/** 框架选项 */
export interface IQinOptions {
  /** 应用名称 */
  app: string;
  /** 应用版本 */
  version: string;
  /** 环境变量 */
  env: string;

  [key: string]: any;
}
