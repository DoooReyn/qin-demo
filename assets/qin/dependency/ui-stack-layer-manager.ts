import { Node } from "cc";

import { IUIView, IUIViewInstance, UIConfig } from "./ui.typings";
import { UIViewCache } from "./ui-view-cache";
import { PRESET } from "../preset";

export type UILayerPlayEnter = (config: UIConfig, node: Node, params?: any) => Promise<void>;
export type UILayerPlayExit = (config: UIConfig, node: Node) => Promise<void>;
export type UILayerCreateInstance = (config: UIConfig, parent: Node) => Promise<IUIViewInstance | null>;

/**
 * UI 栈层通用逻辑：缓存 + 生命周期辅助
 */
export class UIStackLayerManager {
  protected readonly stack: IUIViewInstance[];
  protected readonly cache: UIViewCache;

  constructor(
    protected readonly layerNode: Node,
    protected readonly cacheCapacity: number,
    protected readonly playEnter: UILayerPlayEnter,
    protected readonly playExit: UILayerPlayExit,
    protected readonly createInstance: UILayerCreateInstance
  ) {
    this.stack = [];
    this.cache = new UIViewCache(this.cacheCapacity);
  }

  get size(): number {
    return this.stack.length;
  }

  get top(): IUIViewInstance | null {
    return this.stack[this.stack.length - 1] ?? null;
  }

  protected findIndex(config: UIConfig): number {
    for (let i = this.stack.length - 1; i >= 0; i--) {
      if (this.stack[i].config === config) {
        return i;
      }
    }
    return -1;
  }

  protected truncateTo(targetIndex: number): void {
    const minLength = targetIndex < 0 ? 0 : targetIndex + 1;
    while (this.stack.length > minLength) {
      const inst = this.stack.pop()!;
      this.destroyWithoutAnimation(inst);
    }
  }

  focusTop(): void {
    const top = this.stack[this.stack.length - 1];
    if (top) {
      top.controller.onViewFocus?.();
    }
  }

  protected async instantiate(config: UIConfig): Promise<IUIViewInstance | null> {
    const cached = this.cache.take(config);
    if (cached) {
      this.layerNode.addChild(cached.node);
      return cached;
    }
    return this.createInstance(config, this.layerNode);
  }

  protected async closeWithAnimation(inst: IUIViewInstance): Promise<void> {
    inst.controller.onViewWillDisappear?.();
    await this.playExit(inst.config, inst.node);
    inst.controller.onViewDidDisappear?.();
    this.cache.put(inst);
  }

  protected destroyWithoutAnimation(inst: IUIViewInstance): void {
    inst.controller.onViewWillDisappear?.();
    inst.controller.onViewDidDisappear?.();
    this.cache.put(inst);
  }

  cacheInstance(inst: IUIViewInstance) {
    this.cache.put(inst);
  }

  takeInstance(config: UIConfig): IUIViewInstance | null {
    return this.cache.take(config);
  }

  async open(config: UIConfig, params?: any): Promise<void> {
    // 检查是否已在栈中存在相同配置的视图
    let existedIndex = -1;
    for (let i = this.stack.length - 1; i >= 0; i--) {
      if (this.stack[i].config === config) {
        existedIndex = i;
        break;
      }
    }

    if (existedIndex >= 0) {
      // A -> B -> C -> D -> B 场景：截断栈，使其形如 A -> B
      this.truncateTo(existedIndex);
      const target = this.stack[existedIndex];
      // 已位于栈顶，不再执行 appear 生命周期，仅刷新焦点
      target.controller.onViewFocus?.();
      return;
    }

    const top = this.stack[this.stack.length - 1];
    if (top) {
      top.controller.onViewWillDisappear?.();
      await this.playExit(top.config, top.node);
      top.controller.onViewDidDisappear?.();
    }

    // 优先从缓存中复用实例
    let inst = this.takeInstance(config);
    if (inst) {
      this.layerNode.addChild(inst.node);
    } else {
      inst = await this.createInstance(config, this.layerNode);
    }
    if (!inst) return;

    inst.controller.onViewWillAppear?.(params);
    await this.playEnter(config, inst.node);
    inst.controller.onViewDidAppear?.();

    this.stack.push(inst);
  }

  async close(): Promise<void> {
    if (this.stack.length === 0) {
      return;
    }

    const top = this.stack.pop()!;
    top.controller.onViewWillDisappear?.();
    await this.playExit(top.config, top.node);
    top.controller.onViewDidDisappear?.();

    // 根据缓存策略决定销毁或缓存
    this.cache.put(top);

    this.focusTop();
  }

  async closeBy(config: UIConfig): Promise<void> {
    if (this.stack.length === 0) {
      return;
    }

    let index = -1;
    for (let i = this.stack.length - 1; i >= 0; i--) {
      if (this.stack[i].config === config) {
        index = i;
        break;
      }
    }

    if (index === -1) {
      return;
    }

    const inst = this.stack[index];
    this.stack.splice(index, 1);

    inst.controller.onViewWillDisappear?.();
    await this.playExit(inst.config, inst.node);
    inst.controller.onViewDidDisappear?.();

    // 根据缓存策略决定销毁或缓存
    this.cache.put(inst);

    this.focusTop();
  }

  async clear(): Promise<void> {
    while (this.stack.length > 0) {
      const inst = this.stack.pop()!;
      inst.controller.onViewWillDisappear?.();
      inst.controller.onViewDidDisappear?.();
      this.cache.put(inst);
    }
  }

  destroy() {
    this.clear();
    this.cache.clear();
  }
}
