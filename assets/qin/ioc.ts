import {
  IAssetLoader,
  IAstc,
  IAudioPlayer,
  ICacheContainer,
  IDatabase,
  IDependency,
  IDependencyMeta,
  IEnvironment,
  IEventBus,
  IIncremental,
  ILauncher,
  ILogcat,
  ILooper,
  INodePoC,
  IObPoC,
  IPriorityInput,
  IProfiler,
  ISensitives,
  IStoreContainer,
  ITableQueries,
  ITimer,
  Ii18n,
  ITweener,
} from "./dependency";

/**
 * 依赖注入容器
 * @description 依赖注入容器用于管理和注入应用程序中的依赖项
 */
export class IoC {
  /**
   * 单例
   */
  public static get Shared(): IoC {
    // @ts-ignore
    return (IoC.__inst ??= new IoC());
  }

  /** 依赖容器 */
  private __container: Map<string, IDependency> = new Map();

  /**
   * 依赖是否已注入
   * @param name 依赖名称
   * @returns
   */
  has(name: string) {
    return this.__container.has(name);
  }

  /**
   * 注入依赖
   * @param dep 依赖
   * @param dependencies 依赖项的依赖
   */
  inject<D extends IDependency>(dep: D): D {
    if (this.__container.has(dep.meta.name)) {
      throw new Error(`依赖 ${dep.meta.name} 已注册.`);
    }
    this.__container.set(dep.meta.name, dep);
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
    if (dep && this.__container.has(dep.meta.name)) {
      dep.onDetach();
      this.__container.delete(dep.meta.name);
    }
  }

  /**
   * 初始化所有依赖项
   */
  async initialize() {
    for (let [_, dep] of this.__container) {
      await dep.onAttach();
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
    return this.__container.get(dep.meta.name) as D;
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

  /** 应用循环系统 */
  get looper() {
    return this.resolve<ILooper>("Looper");
  }

  /** 事件总线 */
  get eventBus() {
    return this.resolve<IEventBus>("EventBus");
  }

  /** 环境参数解析器 */
  get environment() {
    return this.resolve<IEnvironment>("Environment");
  }

  /** 定时器容器 */
  get timer() {
    return this.resolve<ITimer>("Timer");
  }

  /** 日志系统 */
  get logcat() {
    return this.resolve<ILogcat>("Logcat");
  }

  /** 递增ID生成器 */
  get incremental() {
    return this.resolve<IIncremental>("Incremental");
  }

  /** 对象池容器 */
  get objPool() {
    return this.resolve<IObPoC>("ObPoC");
  }

  /** 节点池容器 */
  get nodePool() {
    return this.resolve<INodePoC>("NodePoC");
  }

  /** 敏感词过滤器 */
  get sensitives() {
    return this.resolve<ISensitives>("Sensitives");
  }

  /** ASTC 解析器 */
  get astc() {
    return this.resolve<IAstc>("ASTC");
  }

  /** 音频播放器 */
  get audio() {
    return this.resolve<IAudioPlayer>("AudioPlayer");
  }

  /** 启动器 */
  get launcher() {
    return this.resolve<ILauncher>("Launcher");
  }

  /** 缓存容器 */
  get cache() {
    return this.resolve<ICacheContainer>("CacheContainer");
  }

  /** 资源加载器 */
  get loader() {
    return this.resolve<IAssetLoader>("AssetLoader");
  }

  /** 全局优先级输入 */
  get priorityInput() {
    return this.resolve<IPriorityInput>("PriorityInput");
  }

  /** 性能分析器 */
  get profiler() {
    return this.resolve<IProfiler>("Profiler");
  }

  /** 存储容器 */
  get store() {
    return this.resolve<IStoreContainer>("Store");
  }

  /** 表格查询工具 */
  get tableQueies() {
    return this.resolve<ITableQueries>("TableQueries");
  }

  /** 国际化工具 */
  get i18n() {
    return this.resolve<Ii18n>("I18n");
  }

  /** 内存数据库 */
  get db() {
    return this.resolve<IDatabase>("Database");
  }

  /** 缓动动画（Tweener） */
  get tweener() {
    return this.resolve<ITweener>("Tweener");
  }
}

/** 依赖注入容器单例 */
export const ioc: IoC = IoC.Shared;

/**
 * 依赖注册装饰器
 * @param options 依赖配置选项
 */
export function Injectable(meta: IDependencyMeta) {
  return function <T extends new (...args: any[]) => IDependency>(target: T) {
    if (!ioc.has(meta.name)) {
      const inst = new target();
      inst.meta = meta;
      ioc.inject(inst);
      console.info("注册依赖:", meta.name);
    }
    return target;
  };
}

export default ioc;
