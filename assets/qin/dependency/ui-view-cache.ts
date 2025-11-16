import { IUIViewInstance, UIConfig } from "./ui.typings";

/**
 * 通用视图缓存：支持 DestroyImmediately / LRU / Persistent
 */
export class UIViewCache {
  private readonly __map = new Map<string, IUIViewInstance>();
  private __lru: string[] = [];

  constructor(private readonly __capacity: number) {}

  /** 将实例放入缓存，或根据策略直接销毁 */
  put(inst: IUIViewInstance): void {
    const { config } = inst;

    if (config.cachePolicy === "DestroyImmediately") {
      inst.controller.onViewDisposed?.();
      inst.node.destroy();
      return;
    }

    const key = config.key;
    this.__map.set(key, inst);

    // 更新 LRU 顺序：移除旧位置，再推入队尾
    this.__lru = this.__lru.filter((k) => k !== key);
    this.__lru.push(key);

    if (config.cachePolicy === "LRU") {
      while (this.__lru.length > this.__capacity) {
        const evictKey = this.__lru.shift();
        if (!evictKey) break;
        const evicted = this.__map.get(evictKey);
        if (evicted) {
          evicted.controller.onViewDisposed?.();
          evicted.node.destroy();
          this.__map.delete(evictKey);
        }
      }
    }
    // Persistent: 不做淘汰，由 clear 统一清理
  }

  /** 从缓存中取出实例（若存在），同时从缓存移除 */
  take(config: UIConfig): IUIViewInstance | null {
    const key = config.key;
    const inst = this.__map.get(key) ?? null;
    if (!inst) return null;

    this.__map.delete(key);
    this.__lru = this.__lru.filter((k) => k !== key);
    return inst;
  }

  /** 清空缓存（用于 onDetach 等场景） */
  clear(): void {
    this.__map.forEach((inst) => {
      inst.controller.onViewDisposed?.();
      inst.node.destroy();
    });
    this.__map.clear();
    this.__lru = [];
  }
}
