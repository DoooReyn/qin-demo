import { IDependency } from "./dependency";

/**
 * 服务项
 * @description 服务项为框架提供特定业务能力，它跟游戏功能紧密相关
 * - 服务项在依赖项之后注册
 * - 服务项可以获取其他服务项和依赖项
 */
export interface IService {
  /** 服务名称 */
  readonly name: string;
  /** 服务描述 */
  readonly description: string;
  /** 获取依赖项 */
  dependencyOf?<D extends IDependency>(name: string): D;
  /** 获取服务项 */
  serviceOf?<D extends IService>(name: string): D;
  /** 服务安装 */
  install(): Promise<void>;
  /** 服务卸载 */
  uninstall(): Promise<void>;
  /** 服务更新 */
  update(ms: number): void;
}
