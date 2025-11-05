import { IDependency } from "./dependency";
import { IService } from "./service";

/**
 * 服务注册容器接口
 * @description 服务注册容器接口定义了服务注册容器的基本功能
 */
export interface IServiceRegistry extends IDependency {
  /** 注册服务 */
  register(svr: IService): void;
  /** 注销服务 */
  unregister(svr: IService | string): Promise<void>;
  /** 是否存在服务 */
  has(name: string): boolean;
  /** 获取服务 */
  resolve<T extends IService>(name: string): T | undefined;
  /** 初始化所有服务 */
  init(): Promise<void>;
  /** 注销所有服务 */
  destroy(): Promise<void>;
}
