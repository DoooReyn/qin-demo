import { Node } from "cc";
import { UILayerPlayEnter, UILayerPlayExit, UILayerCreateInstance } from "./ui-stack-layer-manager";
import { IUIViewInstance, UIConfig } from "./ui.typings";

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
