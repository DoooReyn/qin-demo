import { IDependency } from "../typings/dependency";

/**
 * 依赖项基类
 */
export class Dependency {
  onAttach(): void {}
  onDetach(): void {}
  dependencyOf<D extends IDependency>(name: string): D | undefined {
    return undefined;
  }
}
