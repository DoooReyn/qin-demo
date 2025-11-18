import { Node } from "cc";

import { IDependency } from "./dependency.typings";
import { Constructor } from "../typings";
import { ToastOptions, ToastService } from "./ui-toast-service";

/** UI 类型 */
export type UIType = "Screen" | "Page" | "Popup" | "Overlay";

/** Overlay 子类型 */
export type UIOverlaySubtype = "Toast" | "Drawer" | "Marquee" | "Guide";

/** UI 缓存策略 */
export type UICachePolicy = "DestroyImmediately" | "LRU" | "Persistent";

/** UI 配置 */
export interface UIConfig {
  /** UI 唯一标识 */
  key: string;
  /** UI 类型 */
  type: UIType;
  /** Overlay 子类型 */
  overlaySubtype?: UIOverlaySubtype;
  /** UI 预制体路径 */
  prefabPath: string;
  /** 视图控制脚本构造器 */
  controller: Constructor<any>;
  /** UI 缓存策略 */
  cachePolicy: UICachePolicy;
  /** 进入动画 */
  enterTweenLib?: string;
  /** 退出动画 */
  exitTweenLib?: string;
  /** 是否模态 */
  modal?: boolean;
  /** 是否点击遮罩关闭 */
  closeOnMaskClick?: boolean;
}

/** UI 视图接口 */
export interface IUIView {
  /** 视图创建回调 */
  onViewCreated?(): void;
  /** 视图将要出现回调 */
  onViewWillAppear?(params?: any): void;
  /** 视图已出现回调 */
  onViewDidAppear?(): void;
  /** 视图将要消失回调 */
  onViewWillDisappear?(): void;
  /** 视图已消失回调 */
  onViewDidDisappear?(): void;
  /** 视图销毁回调 */
  onViewDisposed?(): void;
  /** 视图获得焦点回调 */
  onViewFocus?(): void;
}

/** UI 实例 */
export interface IUIViewInstance {
  /** 视图节点 */
  node: Node;
  /** 视图控制器 */
  controller: IUIView;
  /** 视图配置 */
  config: UIConfig;
}

/** UIRoot 及各层级节点 */
export interface IUIRootLayers {
  /** 根节点 */
  root: Node;
  /** Screen 层级 */
  screenLayer: Node;
  /** Page 层级 */
  pageLayer: Node;
  /** Popup 层级 */
  popupLayer: Node;
  /** Overlay 层级 */
  overlayLayer: Node;
  /** Popup 遮罩 */
  popupMask: Node;
  /** Toast Overlay 根节点 */
  toastOverlayRoot: Node;
  /** Drawer Overlay 根节点 */
  drawerOverlayRoot: Node;
  /** Marquee Overlay 根节点 */
  marqueeOverlayRoot: Node;
  /** Guide Overlay 根节点 */
  guideOverlayRoot: Node;
}

/** UI 管理器接口 */
export interface IUIManager extends IDependency {
  /** UIRoot 及各层级节点 */
  readonly layers: IUIRootLayers | null;

  /** 初始化或获取 UIRoot 及各层级节点 */
  ensureRoot(): IUIRootLayers;

  /** 注册单个 UI 配置 */
  register(config: UIConfig): void;

  /** 批量注册 UI 配置 */
  registerMany(configs: UIConfig[]): void;

  /** 打开 Screen */
  openScreen(keyOrClass: string | Constructor<IUIView>, params?: any): Promise<void>;

  /** 关闭 Screen */
  closeScreen(): Promise<void>;

  /** 清空所有 Screen */
  clearScreen(): void;

  /** 打开 Page */
  openPage(keyOrClass: string | Constructor<IUIView>, params?: any): Promise<void>;

  /** 关闭指定 Page */
  closePage(keyOrClass: string | Constructor<IUIView>): Promise<void>;

  /** 关闭当前顶部 Page */
  closeTopPage(): Promise<void>;

  /** 清空所有 Page 栈 */
  clearPage(): void;

  /** 打开弹窗 */
  openPopup(keyOrClass: string | Constructor<IUIView>, params?: any): Promise<void>;

  /** 关闭指定弹窗 */
  closePopup(keyOrClass: string | Constructor<IUIView>): Promise<void>;

  /** 关闭栈顶弹窗 */
  closeTopPopup(): Promise<void>;

  /** 清空所有弹窗栈 */
  clearPopup(): void;

  /** Toast 子服务 */
  readonly toast: ToastService;

  /** 显示一条 Toast（语法糖，转发到 ToastService.enqueue） */
  showToast(message: string, options?: ToastOptions): void;

  /** 清空 Toast 队列并隐藏当前 Toast（语法糖，转发到 ToastService.clear） */
  clearToast(): void;

  /** 通用后退：优先关闭 Popup，再考虑 Page 回退 */
  back(): Promise<void>;

  /** 调试：打印当前 Screen / Page / Popup 栈信息 */
  debugLogStacks(tag?: string): void;

  /** 调试：打印当前 Page / Popup 缓存状态 */
  debugLogCaches(tag?: string): void;
}
