import { Asset } from "cc";

import { time } from "../ability";
import ioc, { Injectable } from "../ioc";
import { Dependency } from "./dependency";
import { IReleasableContainer, ReleasableAsset } from "./releasable.typings";

/**
 * 资源自动释放池
 */
@Injectable({ name: "ReleasableContainer" })
export class ReleasableContainer extends Dependency implements IReleasableContainer {
  /** 资源自动释放池 */
  private readonly __container: Map<string, ReleasableAsset> = new Map();

  onDetach(): Promise<void> {
    for (const [_, asset] of this.__container) {
      this._remove(asset);
    }
    this.__container.clear();
    return super.onDetach();
  }

  public lazyCleanup() {
    const now = time.now;
    for (const [_, asset] of this.__container) {
      if (asset.__expires__ != undefined && asset.__expires__ < now) {
        this._remove(asset);
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
  protected _remove(asset: Asset) {
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
