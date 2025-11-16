import { Node } from "cc";

import ioc, { Injectable } from "../ioc";
import { Dependency } from "./dependency";
import { IUIManager, IUIRootLayers, IUIView, UIConfig } from "./ui.typings";

/**
 * UI 管理系统依赖（骨架实现）
 */
@Injectable({ name: "UIManager", priority: 220 })
export class UIManager extends Dependency implements IUIManager {
  /** UIRoot 与各层级节点 */
  private __layers: IUIRootLayers | null = null;

  /** UI 配置表占位（后续可接配置表或代码注册） */
  private __registry: Map<string, UIConfig> = new Map();

  get layers(): IUIRootLayers | null {
    return this.__layers;
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

  // === 以下为导航与显示接口骨架，后续将根据设计文档补充具体逻辑 ===

  async openScreen(keyOrClass: string | (new (...args: any[]) => IUIView), params?: any): Promise<void> {
    this.ensureRoot();
    // TODO: 实现 Screen 打开逻辑（栈管理 + 生命周期 + 缓存策略）
  }

  async openPage(keyOrClass: string | (new (...args: any[]) => IUIView), params?: any): Promise<void> {
    this.ensureRoot();
    // TODO: 实现 Page 打开逻辑
  }

  async openPopup(keyOrClass: string | (new (...args: any[]) => IUIView), params?: any): Promise<void> {
    this.ensureRoot();
    // TODO: 实现 Popup 打开逻辑
  }

  async closeTopPopup(): Promise<void> {
    // TODO: 关闭栈顶弹窗
  }

  async closePopup(keyOrClass: string | (new (...args: any[]) => IUIView)): Promise<void> {
    // TODO: 关闭指定弹窗
  }

  async showOverlay(keyOrClass: string | (new (...args: any[]) => IUIView), params?: any): Promise<void> {
    this.ensureRoot();
    // TODO: 显示 Overlay
  }

  async hideOverlay(keyOrClass: string | (new (...args: any[]) => IUIView)): Promise<void> {
    // TODO: 隐藏 Overlay
  }

  async back(): Promise<void> {
    // TODO: 通用后退：优先关闭 Popup，再考虑 Page 回退
  }
}
