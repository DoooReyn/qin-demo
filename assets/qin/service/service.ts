import { IDependency } from "../typings/dependency";
import { IService } from "../typings/service";

/**
 * 服务项基类
 */
export class Service {
  /**
   * 获取依赖项
   * @param name 依赖项名称
   * @returns 
   */
  dependencyOf<T extends IDependency>(name: string): T | undefined {
    return undefined;
  }

  /**
   * 获取服务项
   * @param name 服务项名称
   * @returns 
   */
  serviceOf<T extends IService>(name: string): T | undefined {
    return undefined;
  }

  /**
   * 安装服务项
   * @returns 
   */
  install(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * 卸载服务项
   * @returns 
   */
  uninstall(): Promise<void> {
    return Promise.resolve();
  }
}
