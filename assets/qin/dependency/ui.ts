import { Node, Prefab, instantiate, UITransform, screen, Widget, Graphics } from "cc";

import ioc, { Injectable } from "../ioc";
import { Dependency } from "./dependency";
import { IUIManager, IUIRootLayers, IUIView, UIConfig } from "./ui.typings";
import { PRESET } from "../preset";
import { colors } from "../ability";
import { PageLayerManager, PopupLayerManager } from "./ui-stack-layer-manager";

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
  private __pageManager: PageLayerManager;
  private __popupManager: PopupLayerManager;

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

    const playEnterTween = this.__playEnterTween.bind(this);
    const playExitTween = this.__playExitTween.bind(this);
    const createInstance = this.__createInstance.bind(this);
    this.__pageManager = new PageLayerManager(pageLayer, playEnterTween, playExitTween, createInstance);
    this.__popupManager = new PopupLayerManager(popupLayer, playEnterTween, playExitTween, createInstance);

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

  /**
   * 更新弹窗遮罩的可见性
   */
  private __updatePopupMask(): void {
    if (!this.__layers) return;
    const { popupMask: mask } = this.__layers;

    // 栈为空：直接隐藏遮罩
    if (this.__popupManager.size === 0) {
      mask.active = false;
      return;
    }

    const top = this.__popupManager.top!;
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
      this.__pageManager.cacheInstance(item);
    } else if (item.config.type === "Popup") {
      this.__popupManager.cacheInstance(item);
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
    const top = this.__popupManager.top;
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

    await this.__pageManager.open(config, params);
  }

  async closePage(): Promise<void> {
    this.__pageManager.close();

    if (this.__pageManager.size == 0) {
      this.__screen?.controller.onViewFocus?.();
    }
  }

  async openPopup(keyOrClass: string | (new (...args: any[]) => IUIView), params?: any): Promise<void> {
    this.ensureRoot();
    const config = this.__getConfig(keyOrClass);
    if (!config) {
      ioc.logcat?.qin.ef("UIManager.openPopup: 未找到 UIConfig, key={0}", String(keyOrClass));
      return;
    }

    await this.__popupManager.open(config, params);
    this.__updatePopupMask();
  }

  async closeTopPopup(): Promise<void> {
    await this.__popupManager.close();
    this.__updatePopupMask();
  }

  async closePopup(keyOrClass: string | (new (...args: any[]) => IUIView)): Promise<void> {
    const config = this.__getConfig(keyOrClass);
    if (!config) {
      ioc.logcat?.qin.ef("UIManager.closePopup: 未找到 UIConfig, key={0}", String(keyOrClass));
      return;
    }

    await this.__popupManager.closeBy(config);

    this.__updatePopupMask();
  }

  async clearPage(): Promise<void> {
    // 清栈：执行完整的生命周期，并根据缓存策略处理
    await this.__pageManager.clear();

    // 聚焦上一层的顶层视图：Screen
    if (this.__screen) {
      this.__screen.controller.onViewFocus?.();
    }
  }

  async clearPopup(): Promise<void> {
    // 清栈：执行完整的生命周期，并根据缓存策略处理
    await this.__popupManager.clear();

    // 更新遮罩
    this.__updatePopupMask();

    // 聚焦上一层的顶层视图：Page 栈顶
    this.__pageManager.focusTop();
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
    if (this.__popupManager.size > 0) {
      await this.closeTopPopup();
      return;
    }

    // 其次回退 Page 栈
    if (this.__pageManager.size > 1) {
      await this.closePage();
      return;
    }
    // 若无 Page 可回退，则暂不处理 Screen，交由业务决定是否切换场景/Screen
  }
}
