import { Node, Prefab, instantiate, UITransform, screen, Widget, Graphics } from "cc";

import ioc, { Injectable } from "../ioc";
import { Dependency } from "./dependency";
import { IUIManager, IUIRootLayers, IUIView, IUIViewInstance, UIConfig } from "./ui.typings";
import { PRESET } from "../preset";
import { colors } from "../ability";

/**
 * 通用视图缓存：支持 DestroyImmediately / LRU / Persistent
 */
class UIViewCache {
  private readonly __map = new Map<string, IUIViewInstance>();
  private __lru: string[] = [];

  constructor(private readonly __capacity: number) {}

  /** 将实例放入缓存，或根据策略直接销毁 */
  put(inst: IUIViewInstance): void {
    const { config } = inst;

    if (config.cachePolicy === "DestroyImmediately") {
      inst.controller.onViewDisposed?.();
      inst.node.destroy();
      return;
    }

    const key = config.key;
    this.__map.set(key, inst);

    // 更新 LRU 顺序：移除旧位置，再推入队尾
    this.__lru = this.__lru.filter((k) => k !== key);
    this.__lru.push(key);

    if (config.cachePolicy === "LRU") {
      while (this.__lru.length > this.__capacity) {
        const evictKey = this.__lru.shift();
        if (!evictKey) break;
        const evicted = this.__map.get(evictKey);
        if (evicted) {
          evicted.controller.onViewDisposed?.();
          evicted.node.destroy();
          this.__map.delete(evictKey);
        }
      }
    }
    // Persistent: 不做淘汰，由 clear 统一清理
  }

  /** 从缓存中取出实例（若存在），同时从缓存移除 */
  take(config: UIConfig): IUIViewInstance | null {
    const key = config.key;
    const inst = this.__map.get(key) ?? null;
    if (!inst) return null;

    this.__map.delete(key);
    this.__lru = this.__lru.filter((k) => k !== key);
    return inst;
  }

  /** 清空缓存（用于 onDetach 等场景） */
  clear(): void {
    this.__map.forEach((inst) => {
      inst.controller.onViewDisposed?.();
      inst.node.destroy();
    });
    this.__map.clear();
    this.__lru = [];
  }
}

/**
 * UI 管理系统依赖（骨架实现）
 */
@Injectable({ name: "UIManager", priority: 230 })
export class UIManager extends Dependency implements IUIManager {
  /** UIRoot 与各层级节点 */
  private __layers: IUIRootLayers | null = null;

  /** UI 配置表占位（后续可接配置表或代码注册） */
  private __registry: Map<string, UIConfig> = new Map();

  private __screen: { config: UIConfig; node: Node; controller: IUIView } | null = null;
  private __pageStack: { config: UIConfig; node: Node; controller: IUIView }[] = [];
  private __popupStack: { config: UIConfig; node: Node; controller: IUIView }[] = [];

  /** Page 缓存（按 key，一次仅缓存一个实例） */
  private __pageCache = new UIViewCache(PRESET.UI.PAGE_CACHE_CAPACITY);

  /** Popup 缓存（按 key，一次仅缓存一个实例） */
  private __popupCache = new UIViewCache(PRESET.UI.POPUP_CACHE_CAPACITY);

  get layers(): IUIRootLayers | null {
    return this.__layers;
  }

  /**
   * 注册单个 UI 配置
   */
  register(config: UIConfig): void {
    if (this.__registry.has(config.key)) {
      ioc.logcat?.qin.wf("UIManager.register: 重复注册 UIConfig key={0}", config.key);
      return;
    }
    this.__registry.set(config.key, config);
  }

  /**
   * 批量注册 UI 配置
   */
  registerMany(configs: UIConfig[]): void {
    configs.forEach((cfg) => this.register(cfg));
  }

  async onAttach(): Promise<void> {
    // 懒初始化 UIRoot，由 ensureRoot 负责真正创建
    return super.onAttach();
  }

  async onDetach(): Promise<void> {
    // TODO: 清理所有 UI / 释放资源（后续实现）
    this.__layers = null;
    this.__registry.clear();
    return super.onDetach();
  }

  /**
   * 初始化或获取 UIRoot 及各层级节点
   */
  ensureRoot(): IUIRootLayers {
    if (this.__layers) {
      return this.__layers;
    }

    const launcher = ioc.launcher;
    if (!launcher || !launcher.root) {
      throw new Error("UIManager.ensureRoot: launcher.root 未就绪，请在场景初始化完成后使用 UI 系统");
    }

    const root = launcher.root;
    const uiRoot = this.__getOrCreateChild(root, "UIRoot");
    const screenLayer = this.__getOrCreateChild(uiRoot, "ScreenLayer");
    const pageLayer = this.__getOrCreateChild(uiRoot, "PageLayer");
    const popupLayer = this.__getOrCreateChild(uiRoot, "PopupLayer");
    const overlayLayer = this.__getOrCreateChild(uiRoot, "OverlayLayer");

    const popupMask = this.__getOrCreateChild(popupLayer, "PopupMask");
    popupMask.active = false;
    // 遮罩点击：根据栈顶弹窗配置决定是否关闭弹窗
    popupMask.on(Node.EventType.TOUCH_END, this.__onPopupMaskClicked, this);

    const toastOverlayRoot = this.__getOrCreateChild(overlayLayer, "ToastOverlayRoot");
    const drawerOverlayRoot = this.__getOrCreateChild(overlayLayer, "DrawerOverlayRoot");
    const marqueeOverlayRoot = this.__getOrCreateChild(overlayLayer, "MarqueeOverlayRoot");
    const guideOverlayRoot = this.__getOrCreateChild(overlayLayer, "GuideOverlayRoot");

    this.__layers = {
      root: uiRoot,
      screenLayer,
      pageLayer,
      popupLayer,
      overlayLayer,
      popupMask,
      toastOverlayRoot,
      drawerOverlayRoot,
      marqueeOverlayRoot,
      guideOverlayRoot,
    };

    return this.__layers;
  }

  /**
   * 工具：根据名称获取或创建子节点
   */
  private __getOrCreateChild(parent: Node, name: string): Node {
    let child = parent.getChildByName(name);
    if (!child) {
      child = new Node(name);
      const trans = child.acquire(UITransform);
      trans.setContentSize(screen.windowSize);
      const widget = child.acquire(Widget);
      widget.left = 0;
      widget.right = 0;
      widget.top = 0;
      widget.bottom = 0;
      widget.isAlignLeft = true;
      widget.isAlignRight = true;
      widget.isAlignTop = true;
      widget.isAlignBottom = true;
      parent.addChild(child);
      widget.updateAlignment();
    }
    return child;
  }

  /**
   * 播放进入动画（若配置了 enterTweenLib）
   */
  private async __playEnterTween(config: UIConfig, node: Node): Promise<void> {
    const lib = config.enterTweenLib;
    if (!lib || !ioc.tweener) {
      return;
    }
    await ioc.tweener.play(node, lib, { duration: 0.3 });
  }

  /**
   * 播放退出动画（若配置了 exitTweenLib）
   */
  private async __playExitTween(config: UIConfig, node: Node): Promise<void> {
    const lib = config.exitTweenLib;
    if (!lib || !ioc.tweener) {
      return;
    }
    await ioc.tweener.play(node, lib, { duration: 0.3 });
  }

  private async __createInstance(
    config: UIConfig,
    parent: Node
  ): Promise<{ config: UIConfig; node: Node; controller: IUIView } | null> {
    const prefab = await ioc.loader?.loadPrefab(config.prefabPath);
    if (!prefab) {
      ioc.logcat?.qin.ef("UIManager.__createInstance: 预制体加载失败 path={0}", config.prefabPath);
      return null;
    }

    const node = instantiate(prefab as Prefab);
    parent.addChild(node);

    const controller = node.acquire(config.controller);
    controller?.onViewCreated?.();

    return { config, node, controller };
  }

  // === Page / Popup 缓存相关工具 ===

  /** 将 Page 实例放入缓存（根据 cachePolicy 决定是否缓存与淘汰） */
  private __cachePageInstance(inst: { config: UIConfig; node: Node; controller: IUIView }): void {
    this.__pageCache.put(inst);
  }

  /** 从 Page 缓存中取出实例（若存在） */
  private __takePageFromCache(config: UIConfig): { config: UIConfig; node: Node; controller: IUIView } | null {
    return this.__pageCache.take(config);
  }

  /** 将 Popup 实例放入缓存（根据 cachePolicy 决定是否缓存与淘汰） */
  private __cachePopupInstance(inst: { config: UIConfig; node: Node; controller: IUIView }): void {
    this.__popupCache.put(inst);
  }

  /** 从 Popup 缓存中取出实例（若存在） */
  private __takePopupFromCache(config: UIConfig): { config: UIConfig; node: Node; controller: IUIView } | null {
    return this.__popupCache.take(config);
  }

  /**
   * 更新弹窗遮罩的可见性
   */
  private __updatePopupMask(): void {
    if (!this.__layers) return;
    const { popupMask: mask } = this.__layers;

    // 栈为空：直接隐藏遮罩
    if (this.__popupStack.length === 0) {
      mask.active = false;
      return;
    }

    const top = this.__popupStack[this.__popupStack.length - 1];

    mask.active = true;

    // 模态：半透明黑色遮罩；非模态：遮罩全透明，仅用于截断点击
    const blackboard = mask.acquire(Graphics);
    if (top.config.modal) {
      blackboard.enabled = true;
      blackboard.clear();
      blackboard.fillColor = colors.from(PRESET.COLOR.BLACK_25);
      blackboard.fillRect(
        -(screen.windowSize.width >> 1) - 5,
        -(screen.windowSize.height >> 1) - 5,
        screen.windowSize.width + 10,
        screen.windowSize.height + 10
      );
      console.log("blackboard.fillColor", blackboard.fillColor);
    } else {
      blackboard.clear();
      blackboard.enabled = false;
    }

    // 确保遮罩位于当前栈顶弹窗正下方
    const topNode = top.node;
    const topIndex = topNode.getSiblingIndex();
    const targetIndex = Math.max(0, topIndex - 1);
    mask.setSiblingIndex(targetIndex);
  }

  /**
   * 关闭并移除一个栈元素：执行完整生命周期，并根据 cachePolicy 决定销毁或缓存
   */
  private __destroyStackItem(item: { config: UIConfig; node: Node; controller: IUIView }): void {
    item.controller.onViewWillDisappear?.();
    item.controller.onViewDidDisappear?.();

    if (item.config.type === "Page") {
      this.__cachePageInstance(item);
    } else if (item.config.type === "Popup") {
      this.__cachePopupInstance(item);
    } else {
      // 其他类型暂不缓存
      item.controller.onViewDisposed?.();
      item.node.destroy();
    }
  }

  /**
   * 截断栈到指定下标（包含 targetIndex），并为被移除元素执行完整生命周期
   * 若 targetIndex 为 -1，则清空整个栈
   */
  private __truncateStackTo(stack: { config: UIConfig; node: Node; controller: IUIView }[], targetIndex: number): void {
    const minLength = targetIndex < 0 ? 0 : targetIndex + 1;
    while (stack.length > minLength) {
      const inst = stack.pop()!;
      this.__destroyStackItem(inst);
    }
  }

  /**
   * 弹窗遮罩点击回调
   */
  private async __onPopupMaskClicked() {
    const top = this.__popupStack[this.__popupStack.length - 1];
    if (!top) return;

    // 非模态弹窗：允许点击遮罩关闭自身
    // 模态弹窗：点击遮罩只截断点击，不关闭
    if (!top.config.modal && top.config.closeOnMaskClick) {
      await this.closeTopPopup();
    }
  }

  /**
   * 根据 key 或 controller 构造器解析 UIConfig
   */
  private __getConfig(keyOrClass: string | (new (...args: any[]) => IUIView)): UIConfig | undefined {
    if (typeof keyOrClass === "string") {
      return this.__registry.get(keyOrClass);
    }

    for (const cfg of this.__registry.values()) {
      if (cfg.controller === keyOrClass) {
        return cfg;
      }
    }

    return undefined;
  }

  // === 以下为导航与显示接口骨架，后续将根据设计文档补充具体逻辑 ===

  async openScreen(keyOrClass: string | (new (...args: any[]) => IUIView), params?: any): Promise<void> {
    this.ensureRoot();
    const config = this.__getConfig(keyOrClass);
    if (!config) {
      ioc.logcat?.qin.ef("UIManager.openScreen: 未找到 UIConfig, key={0}", String(keyOrClass));
      return;
    }

    const layers = this.ensureRoot();

    if (this.__screen) {
      const old = this.__screen;
      old.controller.onViewWillDisappear?.();
      await this.__playExitTween(old.config, old.node);
      old.controller.onViewDidDisappear?.();
      old.controller.onViewDisposed?.();
      old.node.destroy();
      this.__screen = null;
    }

    const inst = await this.__createInstance(config, layers.screenLayer);
    if (!inst) return;

    inst.controller.onViewWillAppear?.(params);
    await this.__playEnterTween(config, inst.node);
    inst.controller.onViewDidAppear?.();

    this.__screen = inst;
  }

  async openPage(keyOrClass: string | (new (...args: any[]) => IUIView), params?: any): Promise<void> {
    this.ensureRoot();
    const config = this.__getConfig(keyOrClass);
    if (!config) {
      ioc.logcat?.qin.ef("UIManager.openPage: 未找到 UIConfig, key={0}", String(keyOrClass));
      return;
    }

    const layers = this.ensureRoot();

    // 检查是否已在栈中存在相同配置的 Page
    let existedIndex = -1;
    for (let i = this.__pageStack.length - 1; i >= 0; i--) {
      if (this.__pageStack[i].config === config) {
        existedIndex = i;
        break;
      }
    }

    if (existedIndex >= 0) {
      // A -> B -> C -> D -> B 场景：截断栈，使其形如 A -> B
      this.__truncateStackTo(this.__pageStack, existedIndex);
      const target = this.__pageStack[existedIndex];
      // 已位于栈顶，不再执行 appear 生命周期，仅刷新焦点
      target.controller.onViewFocus?.();
      return;
    }

    const top = this.__pageStack[this.__pageStack.length - 1];
    if (top) {
      top.controller.onViewWillDisappear?.();
      await this.__playExitTween(top.config, top.node);
      top.controller.onViewDidDisappear?.();
    }

    // 优先从缓存中复用实例
    let inst = this.__takePageFromCache(config);
    if (inst) {
      layers.pageLayer.addChild(inst.node);
    } else {
      inst = await this.__createInstance(config, layers.pageLayer);
    }
    if (!inst) return;

    inst.controller.onViewWillAppear?.(params);
    await this.__playEnterTween(config, inst.node);
    inst.controller.onViewDidAppear?.();
    inst.controller.onViewFocus?.();

    this.__pageStack.push(inst);
  }

  async closePage(): Promise<void> {
    if (this.__pageStack.length === 0) {
      return;
    }

    const top = this.__pageStack.pop()!;
    top.controller.onViewWillDisappear?.();
    await this.__playExitTween(top.config, top.node);
    top.controller.onViewDidDisappear?.();

    // 根据缓存策略决定销毁或缓存
    this.__cachePageInstance(top);

    const next = this.__pageStack[this.__pageStack.length - 1];
    if (next) {
      next.controller.onViewWillAppear?.();
      next.controller.onViewDidAppear?.();
      next.controller.onViewFocus?.();
    }
  }

  async openPopup(keyOrClass: string | (new (...args: any[]) => IUIView), params?: any): Promise<void> {
    this.ensureRoot();
    const config = this.__getConfig(keyOrClass);
    if (!config) {
      ioc.logcat?.qin.ef("UIManager.openPopup: 未找到 UIConfig, key={0}", String(keyOrClass));
      return;
    }

    const layers = this.ensureRoot();

    // 检查是否已在栈中存在相同配置的弹窗
    let existedIndex = -1;
    for (let i = this.__popupStack.length - 1; i >= 0; i--) {
      if (this.__popupStack[i].config === config) {
        existedIndex = i;
        break;
      }
    }

    if (existedIndex >= 0) {
      // A -> B -> C -> D -> B 场景：截断栈，使其形如 A -> B
      this.__truncateStackTo(this.__popupStack, existedIndex);
      this.__updatePopupMask();
      const target = this.__popupStack[existedIndex];
      // 已位于栈顶，无需再次插入，只需触发焦点回调
      target.controller.onViewFocus?.();
      return;
    }

    // 优先从缓存中复用实例
    let inst = this.__takePopupFromCache(config);
    if (inst) {
      layers.popupLayer.addChild(inst.node);
    } else {
      inst = await this.__createInstance(config, layers.popupLayer);
    }
    if (!inst) return;

    inst.controller.onViewWillAppear?.(params);
    await this.__playEnterTween(config, inst.node);
    inst.controller.onViewDidAppear?.();
    inst.controller.onViewFocus?.();

    this.__popupStack.push(inst);
    this.__updatePopupMask();
  }

  async closeTopPopup(): Promise<void> {
    if (this.__popupStack.length === 0) {
      return;
    }

    const top = this.__popupStack.pop()!;
    top.controller.onViewWillDisappear?.();
    await this.__playExitTween(top.config, top.node);
    top.controller.onViewDidDisappear?.();

    this.__cachePopupInstance(top);

    // 让新的栈顶弹窗获得焦点
    const next = this.__popupStack[this.__popupStack.length - 1];
    if (next) {
      next.controller.onViewWillAppear?.();
      next.controller.onViewDidAppear?.();
      next.controller.onViewFocus?.();
    }

    this.__updatePopupMask();
  }

  async closePopup(keyOrClass: string | (new (...args: any[]) => IUIView)): Promise<void> {
    if (this.__popupStack.length === 0) {
      return;
    }

    const config = this.__getConfig(keyOrClass);
    if (!config) {
      ioc.logcat?.qin.ef("UIManager.closePopup: 未找到 UIConfig, key={0}", String(keyOrClass));
      return;
    }

    let index = -1;
    for (let i = this.__popupStack.length - 1; i >= 0; i--) {
      if (this.__popupStack[i].config === config) {
        index = i;
        break;
      }
    }

    if (index === -1) {
      return;
    }

    const inst = this.__popupStack[index];
    this.__popupStack.splice(index, 1);

    inst.controller.onViewWillDisappear?.();
    await this.__playExitTween(inst.config, inst.node);
    inst.controller.onViewDidDisappear?.();

    this.__cachePopupInstance(inst);

    // 若移除的是栈顶，则让新的栈顶获得焦点
    if (index === this.__popupStack.length) {
      const next = this.__popupStack[this.__popupStack.length - 1];
      if (next) {
        next.controller.onViewWillAppear?.();
        next.controller.onViewDidAppear?.();
        next.controller.onViewFocus?.();
      }
    }

    this.__updatePopupMask();
  }

  async clearPage(): Promise<void> {
    // 清栈：执行完整的生命周期，并根据缓存策略处理
    while (this.__pageStack.length > 0) {
      const inst = this.__pageStack.pop()!;
      inst.controller.onViewWillDisappear?.();
      inst.controller.onViewDidDisappear?.();
      this.__cachePageInstance(inst);
    }

    // 聚焦上一层的顶层视图：Screen
    if (this.__screen) {
      this.__screen.controller.onViewFocus?.();
    }
  }

  async clearPopup(): Promise<void> {
    // 清栈：执行完整的生命周期，并根据缓存策略处理
    while (this.__popupStack.length > 0) {
      const inst = this.__popupStack.pop()!;
      inst.controller.onViewWillDisappear?.();
      inst.controller.onViewDidDisappear?.();
      this.__cachePopupInstance(inst);
    }

    this.__updatePopupMask();

    // 聚焦上一层的顶层视图：Page 栈顶
    const topPage = this.__pageStack[this.__pageStack.length - 1];
    if (topPage) {
      topPage.controller.onViewFocus?.();
    }
  }

  async showOverlay(keyOrClass: string | (new (...args: any[]) => IUIView), params?: any): Promise<void> {
    this.ensureRoot();
    // TODO: 显示 Overlay
  }

  async hideOverlay(keyOrClass: string | (new (...args: any[]) => IUIView)): Promise<void> {
    // TODO: 隐藏 Overlay
  }

  async back(): Promise<void> {
    // 优先关闭栈顶弹窗
    if (this.__popupStack.length > 0) {
      await this.closeTopPopup();
      return;
    }

    // 其次回退 Page 栈
    if (this.__pageStack.length > 1) {
      await this.closePage();
      return;
    }
    // 若无 Page 可回退，则暂不处理 Screen，交由业务决定是否切换场景/Screen
  }
}
