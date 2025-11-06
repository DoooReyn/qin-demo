import { Asset } from "cc";

import { time } from "../ability";
import ioc, { Injectable } from "../ioc";
import { Dependency } from "./dependency";
import { IReleasable, ReleasableAsset } from "./releasable.typings";

/**
 * 资源自动释放池
 */
@Injectable({ name: "Releasable" })
export class Releasable extends Dependency implements IReleasable {
  /** 资源自动释放池 */
  private readonly __container: Map<string, ReleasableAsset> = new Map();

  public lazyCleanup() {
    const now = time.now;
    for (const [_, asset] of this.__container) {
      if (asset.__expires__ != undefined && asset.__expires__ < now) {
        this.remove(asset);
      }
    }
  }

  public add(asset: ReleasableAsset, expires: number) {
    if (asset && asset.isValid) {
      this.__container.set(asset.uuid, asset);
      asset.__expires__ = time.now + expires;
    }
  }

  public del(asset: ReleasableAsset) {
    if (asset && asset.isValid) {
      this.__container.delete(asset.uuid);
    }
  }

  /**
   * 移除资源
   * @param asset 资源
   */
  protected remove(asset: Asset) {
    if (asset && asset.isValid) {
      const { refCount, uuid } = asset;
      asset.decRef(true);
      if (refCount <= 1) {
        this.__container.delete(uuid);
        ioc.logcat.res.df("资源过期，自动释放 uuid {0} url {1}", uuid, ioc.res.pathOf(uuid));
      }
    }
  }
}
