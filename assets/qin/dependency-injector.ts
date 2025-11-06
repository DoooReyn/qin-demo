import { logcat } from "./ability";
import { IDependency, IDependencyInjector, IEnvironment, IEventBus, ILooper } from "./typings";

/**
 * 依赖注入容器
 * @description 依赖注入容器用于管理和注入应用程序中的依赖项
 */
export class DependencyInjector implements IDependencyInjector {
  /**
   * 单例
   */
  public static get Shared(): DependencyInjector {
    // @ts-ignore
    return (DependencyInjector.__inst ??= new DependencyInjector());
  }

  /** 依赖容器 */
  private __container: Map<string, IDependency> = new Map();

  /**
   * 注入依赖
   * @param dep 依赖
   * @param dependencies 依赖项的依赖
   */
  inject<D extends IDependency>(dep: D): D {
    if (this.__container.has(dep.name)) {
      throw new Error(`依赖 ${dep.name} 已注册.`);
    }
    this.__container.set(dep.name, dep);
    logcat.qin.i("注册依赖:", dep.name, dep.description);
    dep.onAttach();
    return dep;
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
  resolve<D extends IDependency>(dep: D | string): D | undefined {
    if (typeof dep === "string") {
      return this.__container.get(dep) as D;
    }
    return this.__container.get(dep.name) as D;
  }

  /**
   * 注销所有依赖
   */
  async destroy() {
    // 反向注销依赖，确保先注册的后注销
    const dependencies = Array.from(this.__container.entries()).reverse();
    for (let [_, dep] of dependencies) {
      dep.onDetach();
    }
    this.__container.clear();
  }

  /**
   * 应用循环系统
   */
  get looper() {
    return this.resolve<ILooper>("Looper");
  }

  /**
   * 事件总线
   */
  get eventBus() {
    return this.resolve<IEventBus>("EventBus");
  }

  /**
   * 环境参数解析器
   */
  get environment() {
    return this.resolve<IEnvironment>("Environment");
  }
}
