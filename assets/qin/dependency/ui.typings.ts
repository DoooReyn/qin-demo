import { Node } from "cc";

import { IDependency } from "./dependency.typings";
import { Constructor } from "../typings";

export type UIType = "Screen" | "Page" | "Popup" | "Overlay";
export type UIOverlaySubtype = "Toast" | "Drawer" | "Marquee" | "Guide";

export type UICachePolicy = "DestroyImmediately" | "LRU" | "Persistent";

export interface UIConfig {
  key: string;
  type: UIType;
  overlaySubtype?: UIOverlaySubtype;

  prefabPath: string;
  controller: Constructor<IUIView>;

  cachePolicy: UICachePolicy;
  cacheCapacity?: number;

  enterTweenLib?: string;
  exitTweenLib?: string;

  modal?: boolean;
  closeOnMaskClick?: boolean;
}

export interface IUIView {
  onViewCreated?(): void;
  onViewWillAppear?(params?: any): void;
  onViewDidAppear?(): void;
  onViewWillDisappear?(): void;
  onViewDidDisappear?(): void;
  onViewDisposed?(): void;
  onViewFocus?(): void;
}

export interface IUIViewInstance {
  node: Node;
  controller: IUIView;
  config: UIConfig;
}

export interface IUIRootLayers {
  root: Node;
  screenLayer: Node;
  pageLayer: Node;
  popupLayer: Node;
  overlayLayer: Node;
  popupMask: Node;
  toastOverlayRoot: Node;
  drawerOverlayRoot: Node;
  marqueeOverlayRoot: Node;
  guideOverlayRoot: Node;
}

export interface IUIManager extends IDependency {
  readonly layers: IUIRootLayers | null;

  /** 初始化或获取 UIRoot 及各层级节点 */
  ensureRoot(): IUIRootLayers;

  /** 打开一级 Screen */
  openScreen(keyOrClass: string | Constructor<IUIView>, params?: any): Promise<void>;

  /** 打开二级 Page */
  openPage(keyOrClass: string | Constructor<IUIView>, params?: any): Promise<void>;

  /** 打开弹窗 */
  openPopup(keyOrClass: string | Constructor<IUIView>, params?: any): Promise<void>;

  /** 关闭栈顶弹窗 */
  closeTopPopup(): Promise<void>;

  /** 关闭指定弹窗 */
  closePopup(keyOrClass: string | Constructor<IUIView>): Promise<void>;

  /** 显示 Overlay */
  showOverlay(keyOrClass: string | Constructor<IUIView>, params?: any): Promise<void>;

  /** 隐藏 Overlay */
  hideOverlay(keyOrClass: string | Constructor<IUIView>): Promise<void>;

  /** 通用后退：优先关闭 Popup，再考虑 Page 回退 */
  back(): Promise<void>;
}
