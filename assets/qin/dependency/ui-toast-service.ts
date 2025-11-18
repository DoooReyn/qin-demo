import { Label, Node } from "cc";

import ioc from "../ioc";
import { UIConfig } from "./ui.typings";
import { list } from "../ability";

export interface ToastOptions {
  duration?: number;
  level?: "info" | "warn" | "error";
}

export interface ToastPayload {
  message: string;
  options?: ToastOptions;
}

export interface ToastService {
  enqueue(message: string, options?: ToastOptions): void;
  clear(): void;
}

/**
 * Toast 服务实现
 * - 目前只实现队列与清空逻辑
 * - 具体的 UI 展示（Overlay / 节点）后续接入
 */
export class ToastServiceImpl implements ToastService {
  private __config: UIConfig;

  constructor(
    /** Toast 对应的 UIConfig.key（来自 PRESET.UI.TOAST_CONFIG_KEY） */
    private readonly __toastConfigKey: string
  ) {}

  enqueue(message: string, options?: ToastOptions): void {
    const payload: ToastPayload = { message, options: { duration: 2, ...(options ?? {}) } };
    this.__showToast(payload);
  }

  clear(): void {
    const layers = ioc.ui.layers;
    const parent = layers?.toastOverlayRoot;
    if (!parent) {
      return;
    }
    list.each(
      parent.children,
      (child) => {
        const controller = child.acquire(this.__config.controller);
        controller.onViewWillDisappear?.();
        controller.onViewDidDisappear?.();
      },
      true
    );
  }

  private async __showToast(payload: ToastPayload): Promise<void> {
    if (!this.__config) {
      this.__config = ioc.ui.fetchConfig(this.__toastConfigKey, "ToastServiceImpl");
      if (!this.__config) return;
    }

    // 1. 获取停留时间
    const duration = payload.options?.duration ?? 2;

    // 2. 获取 Overlay 层级
    const layers = ioc.ui.layers ?? ioc.ui.ensureRoot();
    const parent = layers.toastOverlayRoot;

    // 3. 从节点池获取 Toast 节点
    const key = this.__config.prefabPath.slice(this.__config.prefabPath.lastIndexOf("/") + 1);
    const node = ioc.nodePool.acquire<Node>(key);
    if (!node) {
      ioc.logcat?.ui.wf("ToastServiceImpl.__showToast: Toast 预制体未注册到节点池, key={0}", key);
      return;
    }

    // 4. 挂载到 ToastOverlayRoot 下
    parent.addChild(node);

    // 5. 挂载控制器并触发生命周期
    const controller = node.acquire(this.__config.controller);
    controller.onViewCreated?.();
    controller.onViewWillAppear?.(payload);
    if (this.__config.enterTweenLib) {
      await ioc.tweener.play(node, this.__config.enterTweenLib, { duration: 0.3 });
    }
    controller.onViewDidAppear?.();

    // 6. 停留一段时间
    await this.__sleep(duration);

    // 7. 播放退出动画
    controller.onViewWillDisappear?.();
    if (this.__config.exitTweenLib) {
      await ioc.tweener.play(node, this.__config.exitTweenLib, { duration: 0.3 });
    }
    controller.onViewDidDisappear?.();

    // 8. 回收节点
    ioc.nodePool.recycle(node);
  }

  private __sleep(seconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }
}
