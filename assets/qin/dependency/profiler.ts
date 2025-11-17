import { director, game, profiler, Director, DynamicAtlasManager, Texture2D } from "cc";

import { gg, might, misc, platform, time } from "../ability";
import ioc, { Injectable } from "../ioc";
import { Dependency } from "./dependency";
import { IProfiler } from "./profiler.typings";

/**
 * 性能监视器
 */
@Injectable({ name: "Profiler", priority: 150 })
export class Profiler extends Dependency implements IProfiler {
  /** 是否输出详细信息 */
  private __verbose: boolean = true;
  /** 当前纹理映射 */
  private __texturesMap: Map<number, Texture2D> = new Map();
  /** 纹理日志记录 */
  private __texturesLog: Map<number, string[]> = new Map();
  /** 错误上报通讯员 */
  private __errorReporter: ((error: string) => void) | undefined = undefined;
  /** 去重窗口（毫秒） */
  private __dedupWindowMs: number = 10000;
  /** 限频窗口（毫秒） */
  private __rateLimitWindowMs: number = 10000;
  /** 限频窗口内最大上报条数 */
  private __rateLimitMax: number = 10;
  /** 已见错误签名 -> 上次上报时间 */
  private __seenSignatures: Map<string, number> = new Map();
  /** 限频窗口起始时间 */
  private __rateWindowStart: number = 0;
  /** 限频窗口内已上报数量 */
  private __rateWindowCount: number = 0;

  /**
   * 上报错误
   * @param error 错误信息
   */
  private __reportError(error: string) {
    const now = time.now;

    // 限频窗口管理
    if (this.__rateWindowStart === 0 || now - this.__rateWindowStart > this.__rateLimitWindowMs) {
      this.__rateWindowStart = now;
      this.__rateWindowCount = 0;
    }
    if (this.__rateWindowCount >= this.__rateLimitMax) {
      // 超过限额，直接丢弃
      return;
    }

    // 去重：基于 类型/原因/首帧 堆栈 提取签名
    const sig = this.__extractSignature(error);
    const last = this.__seenSignatures.get(sig);
    if (last !== undefined && now - last < this.__dedupWindowMs) {
      // 窗口内重复，丢弃
      return;
    }
    this.__seenSignatures.set(sig, now);

    // 通过通道上报
    if (this.__errorReporter) {
      this.__errorReporter(error);
    } else {
      ioc.logcat.qin.e(error);
    }

    // 计数+1
    this.__rateWindowCount += 1;
  }

  /**
   * 提取错误签名（用于去重）
   * 基于 类型/原因/堆栈首帧 的组合
   */
  private __extractSignature(error: string): string {
    const lines = error.split("\n");
    const typeLine = lines.find((l) => l.startsWith("类型: ")) ?? "";
    const reasonLine = lines.find((l) => l.startsWith("原因: ")) ?? "";
    const stackIdx = lines.findIndex((l) => l.startsWith("堆栈: "));
    const topFrame = stackIdx >= 0 ? lines[stackIdx + 1] ?? "" : "";
    return `${typeLine}|${reasonLine}|${topFrame}`;
  }

  /**
   * 组织错误上报信息
   * @param type 类型
   * @param reason 原因
   * @param stack 堆栈
   * @returns
   */
  private __cleanError(type: string, reason: string, stack: string) {
    return [
      "！！！错误警报！！！",
      `时间: ${time.ymdhms()}`,
      `类型: ${type}`,
      `原因: ${reason.trim()}`,
      `堆栈: ${stack}`,
    ].join("\n");
  }

  /** 监控错误 */
  private __monitorError() {
    type AE = (k: string, es: (e: any) => void, b?: boolean) => void;
    const addEventListener = gg.acquire<AE>("addEventListener");
    if (addEventListener === undefined) return;

    const that = this;
    addEventListener(
      "error",
      function (e: any) {
        const stacks = e.error.stack.split("\n");
        const reason = stacks[0].substring(stacks[0].indexOf(" ") + 1);
        const stack = stacks
          .slice(1, 6)
          .map((v: string) => v.substring(7))
          .join("\n");
        that.__reportError(that.__cleanError(e.error.name, reason, stack));
        return true;
      },
      true
    );
    addEventListener("unhandledrejection", function (e: PromiseRejectionEvent) {
      let stacks: string[] = [];
      let type = "unhandledrejection";
      let message = "Unknown Promise rejection";

      // 处理不同类型的错误原因
      if (e.reason && e.reason.stack) {
        stacks = e.reason.stack.split("\n");
        type = stacks[0].split(":")[0] ?? "unhandledrejection";
        message = e.reason.message || stacks[0];
      } else if (typeof e.reason === "string") {
        message = e.reason;
        stacks = ["PromiseRejectError: " + message];
      } else {
        message = String(e.reason);
        stacks = ["PromiseRejectError: " + message];
      }

      const stack = stacks
        .slice(1, 10)
        .map((v) => v.substring(7))
        .join("\n");
      that.__reportError(that.__cleanError(type, message, stack));
    });
  }

  /**
   * 监控纹理数量
   */
  private __monitorTextures() {
    if (!this.__verbose || !ioc.environment.isDev) return;

    const that = this;
    // @ts-ignore
    const construct: any = Texture2D.prototype._createTexture;
    const destruct: any = Texture2D.prototype.destroy;
    // @ts-ignore
    Texture2D.prototype._createTexture = function () {
      const self = this as Texture2D;
      const hash = self.getHash();
      that.__texturesMap.set(this.getHash(), this);
      that.__appendTextureLog("创建纹理", hash);
      return construct.apply(self, arguments);
    };
    Texture2D.prototype.destroy = function () {
      const self = this as Texture2D;
      const hash = self.getHash();
      that.__texturesMap.delete(hash);
      that.__appendTextureLog("销毁纹理", hash);
      return destruct.apply(self, arguments);
    };
    if (ioc.environment.isDev && platform.desktopBrowser) {
      director.on(Director.EVENT_BEGIN_FRAME, this._onFrameBegin, this);
      director.on(Director.EVENT_AFTER_DRAW, this._onFrameEnd, this);
    }
  }

  /** 初始化调试信息 */
  private __initDebugPanel() {
    if (ioc.environment.isDev && platform.desktopBrowser) {
      profiler.hideStats();
      const dam = DynamicAtlasManager.instance;
      debugPanel.addItem("device", "设备信息", () => director.root!.device.renderer);
      debugPanel.addItem("triangles", "三角面数", () => `${director.root!.device.numTris}`);
      debugPanel.addItem("fps", "实时帧率", () => `${director.root!.fps || (1.0 / game.deltaTime) | 0}`);
      debugPanel.addItem("drawcalls", "绘制调用", () => `${director.root!.device.numDrawCalls}`);
      debugPanel.addItem("textures", "纹理数量", () => `${this.textureCount}`);
      debugPanel.addItem(
        "texSize",
        "纹理内存",
        () => `${(director.root!.device.memoryStatus.textureSize / 1024 / 1024).toFixed(2)}M`
      );
      debugPanel.addItem(
        "bufSize",
        "纹理缓冲",
        () => `${(director.root!.device.memoryStatus.bufferSize / 1024 / 1024).toFixed(2)}M`
      );
      debugPanel.addItem("dynamicAtlas", "动态图集", () => {
        return [
          `开关: ${dam.enabled ? "On" : "Off"}`,
          `当前图集数量: ${dam.atlasCount}`,
          `最大图集数量: ${dam.maxAtlasCount}`,
          `单图集的尺寸: ${dam.textureSize}x${dam.textureSize}`,
          `可入图集的最大纹理尺寸: ${dam.maxFrameSize}x${dam.maxFrameSize}`,
        ].join("\n");
      });
    }
  }

  /**
   * 添加纹理日志
   * @param header 日志头
   * @param hash 纹理哈希值
   */
  private __appendTextureLog(header: string, hash: number) {
    if (!this.__verbose || !ioc.environment.isDev) return;

    const head = `${header}<${hash}>`;
    const stack = [head, this.getErrorStack(6)].join("\n");
    if (this.__texturesLog.has(hash)) {
      this.__texturesLog.get(hash)!.push(stack);
    } else {
      this.__texturesLog.set(hash, [stack]);
    }
  }

  /** 同步调试信息 */
  private __sync() {
    if (!ioc.environment.isDev) return;
    debugPanel.update();
  }

  /** 帧开始事件 */
  protected _onFrameBegin() {}

  /** 帧结束事件 */
  protected _onFrameEnd() {
    this.__sync();
  }

  onAttach() {
    this.__initDebugPanel();
    this.__monitorError();
    this.__monitorTextures();

    // 检测是否被调试（发布版需要禁止调试）
    if (platform.browser && ioc.environment.isRelease) {
      misc.ban();
    }

    return super.onAttach();
  }

  public getErrorStack(depth: number) {
    return new Error().stack!.split("\n").slice(depth).join("\n");
  }

  public get verbose() {
    return this.__verbose;
  }
  public set verbose(v: boolean) {
    this.__verbose = v;
  }

  public simulateTimeConsumingOperation(t: number = 10) {
    const startTime = time.now;
    while (time.now - startTime < t) {}
  }

  public setErrorReporter(reporter: (error: string) => void) {
    this.__errorReporter = reporter;
  }

  public setErrorDedupWindow(ms: number): void {
    if (!Number.isFinite(ms) || ms < 0) return;
    this.__dedupWindowMs = ms;
  }

  public getErrorDedupWindow(): number {
    return this.__dedupWindowMs;
  }

  public setErrorRateLimit(options: { windowMs?: number; max?: number }): void {
    const { windowMs, max } = options ?? {};
    if (Number.isFinite(windowMs) && windowMs >= 0) {
      this.__rateLimitWindowMs = windowMs;
      // 重置窗口以便新配置立即生效
      this.resetErrorRateWindow();
    }
    if (Number.isFinite(max) && max >= 0) {
      this.__rateLimitMax = max;
      // 若当前计数超过新阈值，保持不变，等待窗口重置
    }
  }

  public getErrorRateLimit(): { windowMs: number; max: number } {
    return { windowMs: this.__rateLimitWindowMs, max: this.__rateLimitMax };
  }

  public resetErrorRateWindow(): void {
    this.__rateWindowStart = 0;
    this.__rateWindowCount = 0;
  }

  public errorTrace(hook: Function, thisArg: any) {
    const that = this;
    return function (...args: any) {
      const [result, err] = might.sync(function () {
        return hook.apply(thisArg, args);
      });
      if (err) {
        const stacks: string[] = err!.stack!.split("\n");
        const [type, reason] = stacks.shift()!.split(":");
        const stack = stacks
          .slice(1, 6)
          .map((v: string) => v.substring(7))
          .join("\n");
        that.__reportError(that.__cleanError(type, reason, stack));
      }
    };
  }

  public get textureCount() {
    return this.__texturesMap.size;
  }

  public dumpTextureLog(hashOrTexture: number | Texture2D) {
    let hash: number;
    if (hashOrTexture instanceof Texture2D) {
      hash = hashOrTexture.getHash();
    } else {
      hash = hashOrTexture;
    }

    if (this.__texturesLog.has(hash)) {
      this.__texturesLog.get(hash)!.forEach((v) => ioc.logcat.qin.d(v));
    }
  }

  public getTextureCache(hash: number): Texture2D | undefined {
    return this.__texturesMap.get(hash);
  }

  public dumpTextures() {
    if (!ioc.environment.isDev) return;

    let textures = [] as { hash: number; width: number; height: number; memoryUsage: string }[];
    let totalMemory = 0;
    this.__texturesMap.forEach((v) => {
      const memory = (v.width * v.height * 4) / 1024;
      textures.push({
        hash: v.getHash(),
        width: v.width,
        height: v.height,
        memoryUsage: memory.toFixed(2) + "K",
      });
      totalMemory += memory / 1024;
    });
    ioc.logcat.qin.d(`占用内存: ${totalMemory.toFixed(2)}M`);
    console.table(
      textures.sort((a, b) => b.width * b.height - a.width * a.height),
      ["hash", "width", "height", "memoryUsage"]
    );
  }

  public reload() {
    platform.browser && window.location.reload();
  }

  public addDebugItem(
    key: string,
    title: string,
    getter: () => string | number | undefined | null
  ): HTMLElement | null {
    if (!ioc.environment.isDev || !platform.desktopBrowser) {
      return null;
    }
    return debugPanel.addItem(key, title, getter);
  }

  public removeDebugItem(key: string): void {
    if (!ioc.environment.isDev || !platform.desktopBrowser) {
      return;
    }
    debugPanel.removeItem(key);
  }
}
