import { Node } from "cc";

import ioc from "../ioc";
import { UIConfig } from "./ui.typings";
import { time } from "../ability";

export interface DrawerOptions {
  duration?: number;
  /**
   * 点击 Drawer 时的回调
   * - 支持同步或异步（返回 Promise）
   */
  onClick?: () => void | Promise<void>;
}

export interface DrawerService {
  enqueue(message: string, options?: DrawerOptions): void;
  clear(): void;
}

export interface DrawerPayload {
  message?: string;
  options?: DrawerOptions;
}

/**
 * Drawer 服务实现
 * - 全局样式、单实例显示
 * - 使用队列串行展示：当前 Drawer 完成关闭后再展示下一条
 */
export class DrawerServiceImpl implements DrawerService {
  private __queue: DrawerPayload[] = [];
  private __showing = false;
  private __config: UIConfig | null = null;

  constructor(private readonly __drawerConfigKey: string) {}

  enqueue(message: string, options?: DrawerOptions): void {
    this.__queue.push({ message, options: { duration: 2, ...(options ?? {}) } });
    void this.__tryShowNext();
  }

  clear(): void {
    this.__queue.length = 0;
    // 不强制关闭当前正在显示的 Drawer，由用户点击关闭
  }

  private async __tryShowNext(): Promise<void> {
    if (this.__showing) return;

    const payload = this.__queue.shift();
    if (!payload) return;

    if (!this.__config) {
      this.__config = ioc.ui.fetchConfig(this.__drawerConfigKey, "DrawerServiceImpl") ?? null;
      if (!this.__config) return;
    }

    this.__showing = true;
    try {
      const layers = ioc.ui.layers ?? ioc.ui.ensureRoot();
      const parent = layers.drawerOverlayRoot;

      const key = this.__config.prefabPath.slice(this.__config.prefabPath.lastIndexOf("/") + 1);
      const node = ioc.nodePool.acquire<Node>(key);
      if (!node) {
        ioc.logcat?.ui.wf("DrawerServiceImpl.__tryShowNext: Drawer 预制体未注册到节点池, key={0}", key);
        return;
      }

      parent.addChild(node);

      const controller = node.acquire(this.__config.controller);
      controller.onViewCreated?.();
      controller.onViewWillAppear?.(payload);
      if (this.__config.enterTweenLib) {
        await ioc.tweener.play(node, this.__config.enterTweenLib, { duration: 0.3 });
      }
      controller.onViewDidAppear?.();

      await this.__waitForClick(node, payload.options);

      controller.onViewWillDisappear?.();
      if (this.__config.exitTweenLib) {
        await ioc.tweener.play(node, this.__config.exitTweenLib, { duration: 0.3 });
      }
      controller.onViewDidDisappear?.();

      ioc.nodePool.recycle(node);
    } finally {
      this.__showing = false;
      if (this.__queue.length > 0) {
        void this.__tryShowNext();
      }
    }
  }

  private __waitForClick(node: Node, options?: DrawerOptions): Promise<void> {
    return new Promise((resolve) => {
      const ctx = this;

      const tid = setTimeout(function () {
        node.off(Node.EventType.TOUCH_END, handler, ctx);
        resolve();
      }, options.duration * 1000);

      const handler = function () {
        clearTimeout(tid);
        node.off(Node.EventType.TOUCH_END, handler, ctx);
        options?.onClick?.();
        resolve();
      };

      node.on(Node.EventType.TOUCH_END, handler, ctx);
    });
  }
}
