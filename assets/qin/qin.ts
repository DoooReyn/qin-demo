import { IDependency } from "./dependency";
import ioc from "./ioc";
import { IQinOptions } from "./typings";

/**
 * Qin
 * @description Qin 是一个通用的轻量级 2D 游戏框架
 */
export class Qin {
  /** 框架描述 */
  readonly description: string = `
--------------------------------------------------
  Qin Framework 
  Copyright © 2025 Qin Team ❤ Reyn
  Version: 0.0.1
--------------------------------------------------
`;

  /** 是否已初始化 */
  private __initialized: boolean;

  /** 是否正在初始化 */
  private __initializing: boolean;

  constructor() {
    ioc.logcat.qin.i(this.description);
    this.__initializing = false;
    this.__initialized = false;
  }

  /** 初始化框架 */
  async initialize(options: IQinOptions) {
    if (this.__initializing) {
      throw new Error("Qin 正在初始化中.");
    }

    if (this.__initialized) {
      throw new Error("Qin 已初始化.");
    }

    // 标记为正在初始化
    this.__initializing = true;

    // 初始化依赖项
    await ioc.initialize();
    ioc.logcat.qin.i("依赖项初始化完成");

    // 应用环境参数
    ioc.environment.use(options);
    ioc.logcat.qin.i("应用环境参数", ioc.environment.args);

    // 启动应用循环
    ioc.looper.start();

    // 标记为初始化完成
    this.__initializing = false;
    this.__initialized = true;
  }

  /**
   * 注销框架
   * - 注销依赖注入器
   */
  async destroy() {
    // 注销依赖
    await ioc.destroy();
  }

  /**
   * 解析依赖
   * @param name 依赖名称
   * @returns 依赖实例
   */
  dependencyOf<T extends IDependency>(name: string): T | undefined {
    return ioc.resolve<T>(name) as T;
  }
}
