import { Node, Prefab, instantiate } from "cc";

import ioc, { Injectable } from "../ioc";
import { Dependency } from "./dependency";
import { IUIManager, IUIRootLayers, IUIView, UIConfig } from "./ui.typings";

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
      parent.addChild(child);
    }
    return child;
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

    const ControllerCtor = config.controller as any;
    const comp = node.getComponent(ControllerCtor) ?? node.addComponent(ControllerCtor);
    const controller = comp as any as IUIView;

    controller?.onViewCreated?.();

    return { config, node, controller };
  }

  /**
   * 更新弹窗遮罩的可见性
   */
  private __updatePopupMask(): void {
    if (!this.__layers) return;
    const { popupMask: mask, popupLayer } = this.__layers;
    const top = this.__popupStack[this.__popupStack.length - 1];

    if (!top || !top.config.modal) {
      mask.active = false;
      return;
    }

    mask.active = true;
    // 确保遮罩位于当前栈顶弹窗正下方
    const topNode = top.node;
    const topIndex = topNode.getSiblingIndex();
    // 将遮罩插入到栈顶弹窗正下方（索引比弹窗小 1）
    const targetIndex = Math.max(0, topIndex);
    mask.setSiblingIndex(targetIndex);
  }

  /**
   * 关闭并销毁一个栈元素：执行完整生命周期并移除节点
   */
  private __destroyStackItem(item: { config: UIConfig; node: Node; controller: IUIView }): void {
    item.controller.onViewWillDisappear?.();
    item.controller.onViewDidDisappear?.();
    item.controller.onViewDisposed?.();
    item.node.removeFromParent();
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
    if (top.config.closeOnMaskClick) {
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
      this.__screen.controller.onViewWillDisappear?.();
      this.__screen.controller.onViewDidDisappear?.();
      this.__screen.controller.onViewDisposed?.();
      this.__screen.node.removeFromParent();
      this.__screen = null;
    }

    const inst = await this.__createInstance(config, layers.screenLayer);
    if (!inst) return;

    inst.controller.onViewWillAppear?.(params);
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
      top.controller.onViewDidDisappear?.();
    }

    const inst = await this.__createInstance(config, layers.pageLayer);
    if (!inst) return;

    inst.controller.onViewWillAppear?.(params);
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
    top.controller.onViewDidDisappear?.();
    top.controller.onViewDisposed?.();
    top.node.removeFromParent();

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

    const inst = await this.__createInstance(config, layers.popupLayer);
    if (!inst) return;

    inst.controller.onViewWillAppear?.(params);
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
    this.__destroyStackItem(top);

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

    this.__destroyStackItem(inst);

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

  async clearPage(options?: { force?: boolean }): Promise<void> {
    const force = options?.force === true;

    if (force) {
      // 暴力清栈：不触发生命周期，只移除节点
      while (this.__pageStack.length > 0) {
        const inst = this.__pageStack.pop()!;
        inst.node.removeFromParent();
      }

      // 聚焦上一层的顶层视图：Screen
      if (this.__screen) {
        this.__screen.controller.onViewFocus?.();
      }
    } else {
      // 正常清栈：执行完整的生命周期
      while (this.__pageStack.length > 0) {
        const inst = this.__pageStack.pop()!;
        inst.controller.onViewWillDisappear?.();
        inst.controller.onViewDidDisappear?.();
        inst.controller.onViewDisposed?.();
        inst.node.removeFromParent();
      }
    }
  }

  async clearPopup(options?: { force?: boolean }): Promise<void> {
    const force = options?.force === true;

    if (force) {
      // 暴力清栈：不触发生命周期，只移除节点
      while (this.__popupStack.length > 0) {
        const inst = this.__popupStack.pop()!;
        inst.node.removeFromParent();
      }

      // 聚焦上一层的顶层视图：Page 栈顶
      const topPage = this.__pageStack[this.__pageStack.length - 1];
      if (topPage) {
        topPage.controller.onViewFocus?.();
      }
    } else {
      // 正常清栈：执行完整的生命周期
      while (this.__popupStack.length > 0) {
        const inst = this.__popupStack.pop()!;
        inst.controller.onViewWillDisappear?.();
        inst.controller.onViewDidDisappear?.();
        inst.controller.onViewDisposed?.();
        inst.node.removeFromParent();
      }
    }

    this.__updatePopupMask();
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
