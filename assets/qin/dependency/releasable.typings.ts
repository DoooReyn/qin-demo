import { Asset } from "cc";

/**
 * 可释放的资源接口
 */
export interface ReleasableAsset extends Asset {
  __expires__: number;
}

/**
 * 资源自动释放池接口
 */
export interface IReleasable {
  /**
   * 懒清理
   */
  lazyCleanup(): void;
  /**
   * 添加资源
   * @param asset 资源
   * @param expires 过期时间
   */
  add(asset: ReleasableAsset, expires: number): void;
  /**
   * 删除资源
   * @param asset 资源
   */
  del(asset: ReleasableAsset): void;
}


