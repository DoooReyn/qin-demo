import ioc from "../ioc";

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
  private __queue: ToastPayload[] = [];
  private __showing = false;

  constructor(
    /** Toast 对应的 UIConfig.key（来自 PRESET.UI.TOAST_CONFIG_KEY） */
    private readonly __toastConfigKey: string
  ) {}

  enqueue(message: string, options?: ToastOptions): void {
    this.__queue.push({ message, options });
    void this.__tryShowNext();
  }

  clear(): void {
    this.__queue.length = 0;
    // TODO: 隐藏当前 Toast UI（待接入具体 Overlay 视图后实现）
  }

  private async __tryShowNext(): Promise<void> {
    if (this.__showing) return;
    const next = this.__queue.shift();
    if (!next) return;

    this.__showing = true;
    try {
      // 演示实现：暂时使用日志 + 延时模拟 Toast 显示
      const duration = next.options?.duration ?? 2;
      ioc.logcat.ui.d(`[Toast:${this.__toastConfigKey}] ${next.message}`, {
        duration,
        level: next.options?.level ?? "info",
      });
      await this.__sleep(duration);
    } finally {
      this.__showing = false;
      if (this.__queue.length > 0) {
        void this.__tryShowNext();
      }
    }
  }

  private __sleep(seconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }
}
