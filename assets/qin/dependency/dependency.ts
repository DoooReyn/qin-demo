import { IDependencyMeta } from "./dependency.typings";

/**
 * 依赖项基类
 */
export class Dependency {
  /** 元数据 */
  meta: IDependencyMeta;
  /** 依赖项注册回调 */
  onAttach(): Promise<void> {
    return Promise.resolve();
  }
  /** 依赖项注销回调 */
  onDetach(): Promise<void> {
    return Promise.resolve();
  }
}
