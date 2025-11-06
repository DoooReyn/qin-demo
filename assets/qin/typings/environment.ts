import { IDependency } from "./dependency";
import { IQinOptions } from "./options";

/**
 * 环境参数解析器接口
 */
export interface IEnvironment extends IDependency {
  /** 环境参数 */
  args: IQinOptions;
  /**
   * 导入环境参数
   * @param params 环境参数
   */
  use(args: IQinOptions): void;
  /**
   * 是否指定模式
   * @param mode 模式
   */
  isMode(mode: string): boolean;
  /** 是否开发模式 */
  get isDev(): boolean;
  /** 是否调试模式 */
  get isDebug(): boolean;
  /** 是否预发布模式 */
  get isBeta(): boolean;
  /** 是否发布模式 */
  get isRelease(): boolean;
}
