import { Asset, Component, Sprite, SpriteFrame } from "cc";

import { be, regexp } from "../ability";
import ioc from "../ioc";

/**
 * 资源引用策略
 * @description 统一资源加载、释放等操作
 */
export abstract class ReferBase<K extends Component, T extends Asset> {
  /** 资源 */
  protected _asset: T;

  /** 上次使用的资源路径 */
  protected _url: string;

  /**
   * 构造
   * @param container 容器
   */
  constructor(public readonly container: K) {}

  /** 容器是否有效 */
  protected get isContainerValid(): boolean {
    return this.container && this.container.isValid;
  }

  /** 资源是否有效 */
  get isAssetValid(): boolean {
    return this._asset && this._asset.isValid;
  }

  /** 容器、资源是否都有效 */
  get isValid(): boolean {
    return this.isAssetValid && this.isContainerValid;
  }

  /**
   * 加载资源
   * @param url 资源路径
   * @param fallback 保底资源
   */
  private async __load(url: string, fallback?: string) {
    let asset: T | null = null;

    // 选择加载策略
    if (regexp.isUrl(url)) {
      asset = await this._loadRemote(url);
    } else {
      asset = await this._loadLocal(url);
    }

    if (be.empty(asset)) {
      // 如果资源无效，尝试加载保底资源
      if (fallback) {
        return this.__load(fallback);
      }
    } else {
      // 如果资源有效，保存资源信息
      this._url = url;
      this._asset = asset;
    }

    return Promise.resolve();
  }

  /**
   * 加载远程资源
   * @param url 资源路径
   */
  protected abstract _loadRemote(url: string): Promise<T>;

  /**
   * 加载本地资源
   * @param url 资源路径
   */
  protected abstract _loadLocal(url: string): Promise<T>;

  /** 应用资源 */
  protected abstract _apply(): void;

  /** 撤销资源 */
  protected abstract _discard(): void;

  /**
   * 使用资源
   * @param url 资源路径
   * @param fallback 降级资源路径
   */
  load(url: string, fallback?: string) {
    if (this.isValid) {
      if (this._url == url) return;
      this.unload();
    }

    this.__load(url, fallback).then(() => {
      if (this.isValid) {
        this._asset.addRef();
        this._apply();
      }
    });
  }

  /** 解除资源 */
  unload() {
    this._discard();
    if (this.isAssetValid) {
      this._asset.decRef();
      this._asset = null;
    }
  }
}

/**
 * 图片资源引用
 */
export class ReferImage extends ReferBase<Sprite, SpriteFrame> {
  protected async _loadLocal(url: string): Promise<SpriteFrame> {
    return ioc.res.loadSpriteFrame(url);
  }

  protected _loadRemote(url: string): Promise<SpriteFrame> {
    return ioc.remote.loadSpriteFrame(url);
  }

  protected _apply(): void {
    this.container.spriteFrame = this._asset;
  }

  protected _discard(): void {
    this.container.spriteFrame = null;
  }
}
