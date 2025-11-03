import { IDependency } from "./dependency";
import { IService } from "./service";

/** 框架选项 */
export interface IQinOptions {
  /** 应用名称 */
  app: string;
  /** 应用版本 */
  version: string;
  /** 环境变量 */
  env: string;
  /** 可选服务 */
  services?: IService[];
  /** 可选依赖 */
  dependencies?: IDependency[];

  [key: string]: any;
}
