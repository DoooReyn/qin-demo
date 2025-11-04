import { IDependency } from "./dependency";

/**
 * 应用循环系统接口
 * @description 应用循环系统接口定义了应用循环系统的行为
 */
export interface ILooper extends IDependency {
  /** 设置循环回调 */
  loop: (dt: number) => void;
}
