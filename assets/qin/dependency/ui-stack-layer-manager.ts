import { Node } from "cc";

import { IUIViewInstance, UIConfig } from "./ui.typings";
import { UIViewCache } from "./ui-view-cache";

/** 视图进入动画方法 */
export type UILayerPlayEnter = (config: UIConfig, node: Node, params?: any) => Promise<void>;
/** 视图退出动画方法 */
export type UILayerPlayExit = (config: UIConfig, node: Node) => Promise<void>;
/** 视图实例化方法 */
export type UILayerCreateInstance = (config: UIConfig, parent: Node) => Promise<IUIViewInstance | null>;

/**
 * UI 栈层通用逻辑：缓存 + 生命周期辅助
 */
export class UIStackLayerManager {
  /** 视图栈 */
  private readonly __stack: IUIViewInstance[];
  /** 视图缓存 */
  private readonly __cache: UIViewCache;

  constructor(
    /** 视图层级节点 */
    private readonly __layerNode: Node,
    /** 视图缓存容量 */
    private readonly __cacheCapacity: number,
    /** 视图进入动画方法 */
    private readonly __playEnter: UILayerPlayEnter,
    /** 视图退出动画方法 */
    private readonly __playExit: UILayerPlayExit,
    /** 视图实例化方法 */
    private readonly __createInstance: UILayerCreateInstance
  ) {
    this.__stack = [];
    this.__cache = new UIViewCache(this.__cacheCapacity);
  }

  /** 栈大小 */
  get size(): number {
    return this.__stack.length;
  }

  /** 栈顶视图 */
  get top(): IUIViewInstance | null {
    return this.__stack[this.__stack.length - 1] ?? null;
  }

  /**
   * 截断栈
   * @param targetIndex 截断到的索引
   */
  private __truncateTo(targetIndex: number): void {
    const minLength = targetIndex < 0 ? 0 : targetIndex + 1;
    while (this.__stack.length > minLength) {
      const inst = this.__stack.pop()!;
      this.__destroyWithoutAnimation(inst);
    }
  }

  private __destroyWithoutAnimation(inst: IUIViewInstance): void {
    inst.controller.onViewWillDisappear?.();
    inst.controller.onViewDidDisappear?.();
    inst.node.removeFromParent();
    this.__cache.put(inst);
  }

  /** 使栈顶视图获得焦点 */
  focusTop(): void {
    const top = this.__stack[this.__stack.length - 1];
    if (top) {
      top.controller.onViewFocus?.();
    }
  }

  /** 调试用：返回当前栈中的视图 key 列表（从底到顶） */
  getStackKeys(): string[] {
    return this.__stack.map((inst) => inst.config.key);
  }

  /** 调试用：返回缓存快照 */
  getCacheSnapshot(): { size: number; keys: string[]; lru: string[] } {
    return this.__cache.getDebugSnapshot();
  }

  async open(config: UIConfig, params?: any): Promise<void> {
    // 检查是否已在栈中存在相同配置的视图
    let existedIndex = -1;
    for (let i = this.__stack.length - 1; i >= 0; i--) {
      if (this.__stack[i].config === config) {
        existedIndex = i;
        break;
      }
    }

    if (existedIndex >= 0) {
      // A -> B -> C -> D -> B 场景：截断栈，使其形如 A -> B
      this.__truncateTo(existedIndex);
      const target = this.__stack[existedIndex];
      // 已位于栈顶，不再执行 appear 生命周期，仅刷新焦点
      target.controller.onViewFocus?.();
      return;
    }

    const top = this.__stack[this.__stack.length - 1];
    if (top) {
      top.controller.onViewWillDisappear?.();
      await this.__playExit(top.config, top.node);
      top.controller.onViewDidDisappear?.();
    }

    // 优先从缓存中复用实例
    let inst = this.__cache.take(config);
    if (inst) {
      this.__layerNode.addChild(inst.node);
    } else {
      inst = await this.__createInstance(config, this.__layerNode);
    }
    if (!inst) return;

    inst.controller.onViewWillAppear?.(params);
    await this.__playEnter(config, inst.node);
    inst.controller.onViewDidAppear?.();

    this.__stack.push(inst);
  }

  async close(): Promise<void> {
    if (this.__stack.length === 0) {
      return;
    }

    const top = this.__stack.pop()!;
    top.controller.onViewWillDisappear?.();
    await this.__playExit(top.config, top.node);
    top.controller.onViewDidDisappear?.();
    top.node.removeFromParent();

    // 根据缓存策略决定销毁或缓存
    this.__cache.put(top);

    this.focusTop();
  }

  async closeBy(config: UIConfig): Promise<void> {
    if (this.__stack.length === 0) {
      return;
    }

    let index = -1;
    for (let i = this.__stack.length - 1; i >= 0; i--) {
      if (this.__stack[i].config === config) {
        index = i;
        break;
      }
    }

    if (index === -1) {
      return;
    }

    const inst = this.__stack[index];
    this.__stack.splice(index, 1);

    inst.controller.onViewWillDisappear?.();
    await this.__playExit(inst.config, inst.node);
    inst.controller.onViewDidDisappear?.();
    inst.node.removeFromParent();

    // 根据缓存策略决定销毁或缓存
    this.__cache.put(inst);

    this.focusTop();
  }

  clear(): void {
    while (this.__stack.length > 0) {
      const inst = this.__stack.pop()!;
      inst.controller.onViewWillDisappear?.();
      inst.controller.onViewDidDisappear?.();
      inst.node.removeFromParent();
      this.__cache.put(inst);
    }
  }

  destroy() {
    this.clear();
    this.__cache.clear();
  }
}

/**
 * Screen 管理：单实例，无栈，始终 DestroyImmediately
 */
export class UIScreenManager {
  /** 当前视图 */
  private __current: IUIViewInstance | null = null;

  constructor(
    /** 层级节点 */
    private readonly __layerNode: Node,
    /** 视图进入动画方法 */
    private readonly __playEnter: UILayerPlayEnter,
    /** 视图退出动画方法 */
    private readonly __playExit: UILayerPlayExit,
    /** 视图实例化方法 */
    private readonly __createInstance: UILayerCreateInstance
  ) {}

  /** 当前视图 */
  get current(): IUIViewInstance | null {
    return this.__current;
  }

  /** 当前视图 key */
  get currentKey(): string | undefined {
    return this.__current?.config.key;
  }

  /**
   * 打开视图
   * @param config 视图配置
   * @param params 参数
   */
  async open(config: UIConfig, params?: any): Promise<void> {
    const old = this.__current;
    if (old) {
      old.controller.onViewWillDisappear?.();
      await this.__playExit(old.config, old.node);
      old.controller.onViewDidDisappear?.();
      old.controller.onViewDisposed?.();
      old.node.destroy();
      this.__current = null;
    }

    const inst = await this.__createInstance(config, this.__layerNode);
    if (!inst) return;

    inst.controller.onViewWillAppear?.(params);
    await this.__playEnter(config, inst.node, params);
    inst.controller.onViewDidAppear?.();

    this.__current = inst;
  }

  /**
   * 关闭视图
   * @param force 是否强制关闭
   */
  async close(force: boolean = false) {
    const current = this.__current;
    if (current) {
      current.controller.onViewWillDisappear?.();
      if (!force) {
        await this.__playExit(current.config, current.node);
      }
      current.controller.onViewDidDisappear?.();
      current.controller.onViewDisposed?.();
      current.node.destroy();
      this.__current = null;
    }
  }

  /** 使当前视图获得焦点 */
  focus(): void {
    this.__current?.controller.onViewFocus?.();
  }

  /** 销毁 */
  destroy() {
    this.close(true);
  }
}
