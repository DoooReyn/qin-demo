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
  /**
   * 视图控制脚本构造器
   * 实际上应为继承自 Component 且实现 IUIView 的脚本，这里使用宽松类型，具体由调用方保证
   */
  controller: Constructor<any>;

  cachePolicy: UICachePolicy;

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

  /** 注册单个 UI 配置 */
  register(config: UIConfig): void;

  /** 批量注册 UI 配置 */
  registerMany(configs: UIConfig[]): void;

  /** 打开一级 Screen */
  openScreen(keyOrClass: string | Constructor<IUIView>, params?: any): Promise<void>;

  /** 打开二级 Page */
  openPage(keyOrClass: string | Constructor<IUIView>, params?: any): Promise<void>;

  /** 关闭当前顶部 Page */
  closeTopPage(): Promise<void>;

  /** 清空所有 Page 栈 */
  clearPage(): Promise<void>;

  /** 打开弹窗 */
  openPopup(keyOrClass: string | Constructor<IUIView>, params?: any): Promise<void>;

  /** 关闭栈顶弹窗 */
  closeTopPopup(): Promise<void>;

  /** 关闭指定弹窗 */
  closePopup(keyOrClass: string | Constructor<IUIView>): Promise<void>;

  /** 清空所有弹窗栈 */
  clearPopup(): Promise<void>;

  /** 显示 Overlay */
  showOverlay(keyOrClass: string | Constructor<IUIView>, params?: any): Promise<void>;

  /** 隐藏 Overlay */
  hideOverlay(keyOrClass: string | Constructor<IUIView>): Promise<void>;

  /** 通用后退：优先关闭 Popup，再考虑 Page 回退 */
  back(): Promise<void>;
}
