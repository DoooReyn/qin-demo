import { DependencyInjector } from "./core/dependency-injector";
import { Looper } from "./core/looper";
import { ILooper } from "./typings/looper";
import { ServiceRegistry } from "./core/service-registry";
import { Logcat } from "./dependency/logger/logcat";
import { IDependency } from "./typings/dependency";
import { IQinOptions } from "./typings/options";
import { IService } from "./typings/service";
import { EventBus } from "./dependency/event-bus/event-bus";
import { Incremental } from "./dependency/incremental";

/**
 * Qin
 * - @description Qin 是一个通用的轻量级 2D 游戏框架
 */
export class Qin {
  /** 框架描述 */
  readonly description: string = `Qin Framework 
Copyright © 2025 Qin Team ❤ Reyn
Version: 0.0.1`;

  /** 框架选项 */
  private __options: IQinOptions = {
    app: "qin",
    version: "0.0.1",
    env: "dev",
  };

  /** 依赖注入器 */
  private __dpi: DependencyInjector;

  /** 服务注册器 */
  private __svr: ServiceRegistry;

  /** 是否已初始化 */
  private __initialized: boolean;

  /** 是否正在初始化 */
  private __initializing: boolean;

  constructor() {
    console.log(this.description);
    this.__initializing = false;
    this.__initialized = false;
    this.__dpi = new DependencyInjector();
    this.__svr = new ServiceRegistry();

    const logcat = new Logcat();
    this.__dpi.onInjected = (dep) => {
      logcat.qin.i("注册依赖:", dep.name);
      dep.dependencyOf = (name: string) => this.dependencyOf(name);
    };
    this.__svr.onRegistered = (svr: IService) => {
      logcat.qin.i("注册服务:", svr.name);
      svr.dependencyOf = (name: string) => this.dependencyOf(name);
      svr.serviceOf = (name: string) => this.serviceOf(name);
    };

    this.__dpi.inject(logcat);
    this.__dpi.inject(this.__svr);
  }
  
  /**
   * 检查环境是否匹配
   * @param env 环境名称
   * @returns 是否匹配
   */
  isEnv(env: string) {
    return this.__options.env === env;
  }

  /**
   * 是否为开发环境
   */
  get isDev() {
    return this.isEnv("dev");
  }

  /**
   * 是否为预发布环境
   */
  get isBeta() {
    return this.isEnv("beta");
  }

  /**
   * 是否为生产环境
   */
  get isProd() {
    return this.isEnv("prod");
  }

  /**
   * 初始化框架
   * - 初始化框架选项
   * - 注册可选依赖
   * - 注册可选服务
   * - 初始化服务注册器
   */
  async init(options: IQinOptions) {
    if (this.__initializing) {
      throw new Error("Qin 正在初始化中.");
    }

    if (this.__initialized) {
      throw new Error("Qin 已初始化.");
    }

    // 标记为正在初始化
    this.__initializing = true;

    // 合并选项
    this.__options = { ...this.__options, ...options };

    // 注册内部依赖
    this.__dpi.inject(new Incremental());
    this.__dpi.inject(new EventBus());
    this.__dpi.inject(new Looper());

    // 注册可选依赖
    if (this.__options.dependencies) {
      this.__options.dependencies.forEach((dep) => {
        this.__dpi.inject(dep);
      });
    }

    // 注册内部服务

    // 注册可选服务
    if (this.__options.services) {
      this.__options.services.forEach((svr) => {
        this.__svr.register(svr);
      });
    }

    // 初始化服务
    await this.__svr.init();

    // 设置运行时更新函数
    this.__dpi.resolve<ILooper>("Looper")!.loop = (dt: number) => {
      this.__svr.update(dt);
    };

    // 标记为初始化完成
    this.__initializing = false;

    // 标记为已初始化
    this.__initialized = true;
  }

  /**
   * 注销框架
   * - 注销服务注册器
   * - 注销依赖注入器
   */
  async destroy() {
    // 注销服务
    await this.__svr.destroy();

    // 注销依赖
    await this.__dpi.destroy();
  }

  /**
   * 解析依赖
   * @param name 依赖名称
   * @returns 依赖实例
   */
  dependencyOf<T extends IDependency>(name: string): T | undefined {
    return this.__dpi.resolve(name) as T;
  }

  /**
   * 解析服务
   * @param name 服务名称
   * @returns 服务实例
   */
  serviceOf<T extends IService>(name: string): T | undefined {
    return this.__svr.resolve(name) as T;
  }
}
