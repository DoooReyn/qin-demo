import { IDependency } from "./dependency";

/**
 * 依赖注入容器接口
 * @description 依赖注入容器接口定义了依赖注入器的基本功能
 */
export interface IDependencyInjector {
  /** 注入依赖 */
  inject<D extends IDependency>(dep: D): D;
  /** 注销依赖 */
  eject(dep: IDependency | string): void;
  /** 解析依赖 */
  resolve<D extends IDependency>(dep: IDependency | string): D | undefined;
  /** 注销所有依赖 */
  destroy(): Promise<void>;
}
