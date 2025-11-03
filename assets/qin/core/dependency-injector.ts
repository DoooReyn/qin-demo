import { IDependency } from "../typings/dependency";

/**
 * 依赖注入器
 * - @description 依赖注入器用于管理和注入应用程序中的依赖项
 */
export class DependencyInjector {
  /** 依赖容器 */
  private __container: Map<string, IDependency> = new Map();

  /**
   * 注入依赖
   * @param dep 依赖
   */
  inject(dep: IDependency): void {
    if (!this.__container.has(dep.name)) {
      this.__container.set(dep.name, dep);
      dep.onAttach();
    }
  }

  /**
   * 注销依赖
   * @param dep 依赖
   */
  eject(dep: IDependency | string): void {
    if (typeof dep === "string") {
      dep = this.__container.get(dep) as IDependency;
    }
    if (dep && this.__container.has(dep.name)) {
      dep.onDetach();
      this.__container.delete(dep.name);
    }
  }

  /**
   * 解析依赖
   * @param name 依赖名称
   * @returns 依赖实例
   */
  resolve<T extends IDependency>(name: string): T | undefined {
    return this.__container.get(name) as T;
  }

  /**
   * 注销所有依赖
   */
  async destroy() {
    const dependencies = Array.from(this.__container.entries()).reverse();
    for (let [_, dep] of dependencies) {
      dep.onDetach();
    }
    this.__container.clear();
  }
}
