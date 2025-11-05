import { IDependency } from "../typings/dependency";

/**
 * 依赖项基类
 */
export class Dependency {
  /** 依赖项注册回调 */
  onAttach(): void {}
  /** 依赖项注销回调 */
  onDetach(): void {}
  /**
   * 获取依赖项
   * @param name 依赖项名称
   * @returns 
   */
  dependencyOf<D extends IDependency>(name: string): D | undefined {
    return undefined;
  }
}
