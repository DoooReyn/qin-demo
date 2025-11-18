import { Node, instantiate, UITransform, screen, Widget, Graphics } from "cc";

import ioc, { Injectable } from "../ioc";
import { Dependency } from "./dependency";
import { IUIManager, IUIRootLayers, IUIView, UIConfig } from "./ui.typings";
import { PRESET } from "../preset";
import { colors } from "../ability";
import { UIStackLayerManager } from "./ui-stack-layer-manager";
import { UIScreenManager } from "./ui-screen-manager";

/**
 * UI 管理系统依赖（骨架实现）
 */
@Injectable({ name: "UIManager", priority: 230 })
export class UIManager extends Dependency implements IUIManager {
  /** UIRoot 与各层级节点 */
  private __layers: IUIRootLayers | null = null;
  /** UI 配置表占位（后续可接配置表或代码注册） */
  private __registry: Map<string, UIConfig> = new Map();
  /** Screen 管理器 */
  private __screenManager: UIScreenManager | null = null;
  /** Page 管理器 */
  private __pageManager: UIStackLayerManager | null = null;
  /** Popup 管理器 */
  private __popupManager: UIStackLayerManager | null = null;
  /** 是否正在后退 */
  private __backing = false;

  /** UIRoot 及各层级节点 */
  get layers(): IUIRootLayers | null {
    return this.__layers;
  }

  async onDetach(): Promise<void> {
    this.__registry.clear();
    this.__popupManager?.destroy();
    this.__pageManager?.destroy();
    this.__screenManager?.destroy();
    this.__layers?.root.destroy();
    this.__layers = null;
    this.__screenManager = null;
    this.__pageManager = null;
    this.__popupManager = null;
    return super.onDetach();
  }

  /**
   * 注册单个 UI 配置
   * @param config UI 配置
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
   * @param configs UI 配置列表
   */
  registerMany(configs: UIConfig[]): void {
    configs.forEach((cfg) => this.register(cfg));
  }

  /**
   * 初始化或获取 UIRoot 及各层级节点
   * @returns UIRoot 及各层级节点
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
    const uiRoot = this.__getOrCreateChild(root, "ui-root");
    const screenLayer = this.__getOrCreateChild(uiRoot, "ui-screen");
    const pageLayer = this.__getOrCreateChild(uiRoot, "ui-page");
    const popupLayer = this.__getOrCreateChild(uiRoot, "ui-popup");
    const overlayLayer = this.__getOrCreateChild(uiRoot, "ui-overlay");
    const popupMask = this.__getOrCreateChild(popupLayer, "ui-popup-mask");
    popupMask.active = false;
    popupMask.on(Node.EventType.TOUCH_END, this.__onPopupMaskClicked, this);
    const toastOverlayRoot = this.__getOrCreateChild(overlayLayer, "ui-toast-overlay");
    const drawerOverlayRoot = this.__getOrCreateChild(overlayLayer, "ui-drawer-overlay");
    const marqueeOverlayRoot = this.__getOrCreateChild(overlayLayer, "ui-marquee-overlay");
    const guideOverlayRoot = this.__getOrCreateChild(overlayLayer, "ui-guide-overlay");

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
    this.__screenManager = new UIScreenManager(screenLayer, playEnterTween, playExitTween, createInstance);
    this.__pageManager = new UIStackLayerManager(
      pageLayer,
      PRESET.UI.PAGE_CACHE_CAPACITY,
      playEnterTween,
      playExitTween,
      createInstance
    );
    this.__popupManager = new UIStackLayerManager(
      popupLayer,
      PRESET.UI.POPUP_CACHE_CAPACITY,
      playEnterTween,
      playExitTween,
      createInstance
    );

    return this.__layers;
  }

  /**
   * 工具：根据名称获取或创建子节点
   * @param parent 父节点
   * @param name 子节点名称
   * @returns 子节点
   */
  private __getOrCreateChild(parent: Node, name: string): Node {
    let child = parent.getChildByName(name);
    if (!child) {
      child = new Node(name);
      const trans = child.acquire(UITransform);
      const widget = child.acquire(Widget);
      parent.addChild(child);
      trans.setContentSize(screen.windowSize);
      widget.left = 0;
      widget.right = 0;
      widget.top = 0;
      widget.bottom = 0;
      widget.isAlignLeft = true;
      widget.isAlignRight = true;
      widget.isAlignTop = true;
      widget.isAlignBottom = true;
      widget.updateAlignment();
    }
    return child;
  }

  /**
   * 播放进入动画（若配置了 enterTweenLib）
   * @param config UI 配置
   * @param node 视图节点
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
   * @param config UI 配置
   * @param node 视图节点
   */
  private async __playExitTween(config: UIConfig, node: Node): Promise<void> {
    const lib = config.exitTweenLib;
    if (!lib || !ioc.tweener) {
      return;
    }
    await ioc.tweener.play(node, lib, { duration: 0.3 });
  }

  /**
   * 创建 UI 实例
   * @param config UI 配置
   * @param parent 父节点
   * @returns UI 实例
   */
  private async __createInstance(
    config: UIConfig,
    parent: Node
  ): Promise<{ config: UIConfig; node: Node; controller: IUIView } | null> {
    const prefab = await ioc.loader?.loadPrefab(config.prefabPath);
    if (!prefab) {
      ioc.logcat?.qin.ef("UIManager.__createInstance: 预制体加载失败 path={0}", config.prefabPath);
      return null;
    }

    const node = instantiate(prefab);
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
   * @param keyOrClass UIConfig key 或 controller 构造器
   * @returns UIConfig
   */
  private __getConfig(keyOrClass: string | (new (...args: any[]) => IUIView)): UIConfig | undefined {
    if (typeof keyOrClass === "string") {
      return this.__registry.get(keyOrClass);
    }

    for (const [_, cfg] of this.__registry) {
      if (cfg.controller === keyOrClass) {
        return cfg;
      }
    }

    return undefined;
  }

  /**
   * 根据 key 或 controller 构造器解析 UIConfig
   * @param keyOrClass UIConfig key 或 controller 构造器
   * @param source 调用来源
   * @returns UIConfig
   */
  private __fetchConfig(keyOrClass: string | (new (...args: any[]) => IUIView), source: string): UIConfig | undefined {
    const name = typeof keyOrClass === "string" ? keyOrClass : keyOrClass.name;
    const config = this.__getConfig(keyOrClass);
    if (!config) {
      ioc.logcat?.qin.wf("UIManager.{0}: 未找到 UIConfig, key={1}", source, name);
    }
    return config;
  }

  // === 以下为导航与显示接口骨架，后续将根据设计文档补充具体逻辑 ===

  async openScreen(keyOrClass: string | (new (...args: any[]) => IUIView), params?: any): Promise<void> {
    const config = this.__fetchConfig(keyOrClass, "openScreen");
    if (config) {
      await this.__screenManager.open(config, params);
    }
  }

  async closeScreen() {
    this.__popupManager.clear();
    this.__pageManager.clear();
    return this.__screenManager.close();
  }

  clearScreen() {
    this.__screenManager.destroy();
  }

  async openPage(keyOrClass: string | (new (...args: any[]) => IUIView), params?: any): Promise<void> {
    const config = this.__fetchConfig(keyOrClass, "openPage");
    if (config) {
      await this.__pageManager.open(config, params);
    }
  }

  async closePage(keyOrClass: string | (new (...args: any[]) => IUIView)): Promise<void> {
    if (this.__pageManager.size == 0) return;

    const config = this.__fetchConfig(keyOrClass, "closePage");
    if (config) {
      await this.__pageManager.closeBy(config);
      if (this.__pageManager.size == 0) {
        this.__screenManager.focus();
      }
    }
  }

  async closeTopPage(): Promise<void> {
    if (this.__pageManager.size == 0) return;

    const top = this.__pageManager.top;
    if (top) {
      await this.closePage(top.config.key);
    }
  }

  clearPage(): void {
    // 清栈：执行完整的生命周期，并根据缓存策略处理
    this.__pageManager.clear();

    // 聚焦上一层的顶层视图：Screen
    this.__screenManager.focus();
  }

  async openPopup(keyOrClass: string | (new (...args: any[]) => IUIView), params?: any): Promise<void> {
    const config = this.__fetchConfig(keyOrClass, "openPopup");
    if (config) {
      await this.__popupManager.open(config, params);
      this.__updatePopupMask();
    }
  }

  async closePopup(keyOrClass: string | (new (...args: any[]) => IUIView)): Promise<void> {
    const config = this.__fetchConfig(keyOrClass, "closePopup");
    if (config) {
      await this.__popupManager.closeBy(config);
      this.__updatePopupMask();
    }
  }

  async closeTopPopup(): Promise<void> {
    await this.__popupManager.close();
    this.__updatePopupMask();
  }

  clearPopup(): void {
    // 清栈：执行完整的生命周期，并根据缓存策略处理
    this.__popupManager.clear();

    // 更新遮罩
    this.__updatePopupMask();

    // 聚焦上一层的顶层视图：Page 栈顶
    this.__pageManager.focusTop();
  }

  async showOverlay(keyOrClass: string | (new (...args: any[]) => IUIView), params?: any): Promise<void> {
    // TODO: 显示 Overlay
  }

  async hideOverlay(keyOrClass: string | (new (...args: any[]) => IUIView)): Promise<void> {
    // TODO: 隐藏 Overlay
  }

  async back(): Promise<void> {
    if (this.__backing) {
      ioc.logcat?.qin.wf("UIManager.back: 返回中，请稍后重试");
      return;
    }

    this.__backing = true;

    if (this.__popupManager.size > 0) {
      // 优先关闭 Popup
      await this.closeTopPopup();
    } else if (this.__pageManager.size > 0) {
      // 其次关闭 Page
      await this.closeTopPage();
    } else {
      // 暂不处理 Screen
    }

    this.__backing = false;
  }

  /**
   * 调试：打印当前 Screen / Page / Popup 栈信息
   * @param tag 标识
   */
  debugLogStacks(tag: string = "UIManager"): void {
    const screenKey = this.__screenManager.currentKey ?? null;
    const pageKeys = this.__pageManager?.getStackKeys() ?? [];
    const popupKeys = this.__popupManager?.getStackKeys() ?? [];

    const payload = {
      tag,
      screen: screenKey,
      pages: pageKeys,
      popups: popupKeys,
    };

    ioc.logcat.ui.d("[UI Debug] stacks: ", payload);
  }

  /**
   * 调试：打印当前 Page / Popup 缓存状态
   * @param tag 标识
   */
  debugLogCaches(tag: string = "UIManager"): void {
    const pageCache = this.__pageManager?.getCacheSnapshot();
    const popupCache = this.__popupManager?.getCacheSnapshot();

    const payload = {
      tag,
      pageCache,
      popupCache,
    };

    ioc.logcat.ui.d("[UI Debug] caches: ", payload);
  }
}
