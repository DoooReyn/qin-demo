import { EDITOR } from "cc/env";

import { IDependency, Language } from "./dependency";
import ioc, { IoC } from "./ioc";
import { PRESET } from "./preset";
import { IApplicationOptions } from "./typings";

/**
 * Qin
 * @description Qin 是一个通用的轻量级 2D 游戏框架
 */
export class Application {
  /** 框架描述 */
  readonly description: string =
    "\n--------------------------------------------------" +
    "\n  Qin Framework" +
    "\n  Copyright © 2025 Qin Team ❤️ DoooReyn" +
    "\n  Version: 0.0.1" +
    "\n--------------------------------------------------";

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
  async initialize(options: IApplicationOptions) {
    if (EDITOR) return Promise.resolve();

    if (this.__initializing) {
      throw new Error("Qin 正在初始化中.");
    }

    if (this.__initialized) {
      throw new Error("Qin 已初始化.");
    }

    // 标记为正在初始化
    this.__initializing = true;

    // 挂载依赖项
    ioc.logcat.qin.i("依赖项挂载开始");
    ioc.eventBus.app.publish(PRESET.EVENT.APP_DEP_BEFORE_MOUNTED);
    await ioc.mount();
    ioc.logcat.qin.i("依赖项挂载完成");
    ioc.eventBus.app.publish(PRESET.EVENT.APP_DEP_AFTER_MOUNTED);

    // 启动应用
    ioc.launcher.initialize(function () {
      // 通知应用启动开始
      ioc.eventBus.app.publish(PRESET.EVENT.APP_BEFORE_LAUNCHED);

      // 应用环境参数
      ioc.environment.use(options);
      ioc.logcat.qin.i("应用环境参数", ioc.environment.args);
      ioc.eventBus.app.publish(PRESET.EVENT.APP_ARGS_APPLIED);

      // 启动音频播放器
      ioc.audio.initialize();

      // 初始化国际化工具
      ioc.i18n.initialize({ language: options.language });

      // 初始化富文本图集
      ioc.richTextAtlas.initialize();

      // 初始化 UI 管理器
      ioc.ui.ensureRoot();

      // 通知应用启动完成
      ioc.eventBus.app.publish(PRESET.EVENT.APP_AFTER_LAUNCHED);

      // 启动应用循环
      ioc.looper.start();
    });

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
    await ioc.unmount();
  }

  /**
   * 解析依赖
   * @param name 依赖名称
   * @returns 依赖实例
   */
  dependencyOf<T extends IDependency>(name: string): T | undefined {
    return ioc.resolve<T>(name) as T;
  }

  /** 依赖注入容器 */
  get dpi() {
    return IoC.Shared;
  }
}

/** 全局 Application 实例 */
export const app = new Application();
