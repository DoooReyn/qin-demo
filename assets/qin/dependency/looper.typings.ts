import { IDependency } from "../dependency/dependency.typings";

/**
 * 应用循环系统接口
 * @description 应用循环系统接口定义了应用循环系统的行为
 */
export interface ILooper extends IDependency {
  /** 启动循环 */
  start: () => void;
  /** 暂停循环 */
  pause: () => void;
}
