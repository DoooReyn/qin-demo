import {
  sp,
  AnimationClip,
  Asset,
  AssetManager,
  AudioClip,
  BufferAsset,
  Font,
  ImageAsset,
  JsonAsset,
  ParticleAsset,
  Prefab,
  SpriteAtlas,
  SpriteFrame,
  Texture2D,
  TextAsset,
  TiledMapAsset,
  VideoClip,
} from "cc";

import ioc, { Injectable } from "../ioc";
import { PRESET } from "../preset";
import { Constructor } from "../typings";
import { CacheSource } from "./cache.typings";
import { Dependency } from "./dependency";
import {
  IAssetLoader,
  ILoadOptions,
  LoadItem,
  PreloadItem,
  ILoadTask,
} from "./loader.typings";

/**
 * 资源加载器
 * @description 统一管理本地和远程资源的加载，自动处理缓存
 */
@Injectable({ name: "AssetLoader" })
export class AssetLoader extends Dependency implements IAssetLoader {
  /** 日志开关 */
  public logEnabled: boolean = false;

  /** 默认缓存过期时间（毫秒） */
  public defaultCacheExpires: number = PRESET.TIME.AUTO_RELEASE_MS;

  /**
   * 判断是否为远程资源
   * @param path 资源路径
   * @returns 是否为远程资源
   */
  isRemote(path: string): boolean {
    return (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("//")
    );
  }

  /**
   * 生成缓存键值
   * @param path 资源路径
   * @param bundle 资源包名称
   * @returns 缓存键值
   */
  private __makeCacheKey(path: string, bundle?: string): string {
    if (this.isRemote(path)) {
      return `remote:${path}`;
    }
    return `local:${bundle || "shared"}@${path}`;
  }

  /**
   * 加载资源包
   * @param bundle 包名称
   * @returns 资源包实例
   */
  loadBundle(bundle: string): Promise<AssetManager.Bundle | null> {
    return ioc.res.loadAB(bundle);
  }

  /**
   * 卸载资源包
   * @param bundle 包名称
   * @param releaseAll 是否释放所有资源
   */
  unloadBundle(bundle: string, releaseAll: boolean = false): void {
    // 清理该包的所有缓存
    const prefix = `local:${bundle}@`;
    const keys = ioc.cache.keys(CacheSource.Local);
    keys.forEach((key) => {
      if (key.startsWith(prefix)) {
        ioc.cache.delete(key, true);
      }
    });

    // 卸载资源包
    ioc.res.unloadAB(bundle, releaseAll);

    if (this.logEnabled) {
      ioc.logcat.res.df("资源加载器: 卸载资源包 {0}", bundle);
    }
  }

  /**
   * 通用资源加载方法
   * @param type 资源类型构造函数
   * @param options 加载选项
   * @returns 资源实例
   */
  async load<T extends Asset>(
    type: Constructor<T>,
    options: ILoadOptions,
  ): Promise<T | null> {
    const {
      path,
      bundle = "shared",
      useCache = true,
      cacheExpires = this.defaultCacheExpires,
      forceReload = false,
    } = options;

    const cacheKey = this.__makeCacheKey(path, bundle);

    // 检查缓存
    if (useCache && !forceReload) {
      const cached = ioc.cache.get<T>(cacheKey);
      if (cached) {
        if (this.logEnabled) {
          ioc.logcat.res.df("资源加载器: 命中缓存 {0}", cacheKey);
        }
        return cached;
      }
    }

    // 加载资源
    let asset: T | null = null;
    const isRemote = this.isRemote(path);

    if (isRemote) {
      // 远程资源加载
      asset = await this.__loadRemote<T>(path, type);
    } else {
      // 本地资源加载
      asset = await ioc.res.loadRes<T>(path, type, bundle);
    }

    // 缓存资源
    if (asset && useCache) {
      ioc.cache.set({
        key: cacheKey,
        asset,
        source: isRemote ? CacheSource.Remote : CacheSource.Local,
        expires: cacheExpires,
        refCount: 0,
      });

      if (this.logEnabled) {
        ioc.logcat.res.df("资源加载器: 加载并缓存 {0}", cacheKey);
      }
    }

    return asset;
  }

  /**
   * 加载远程资源
   * @param path 资源路径
   * @param type 资源类型
   * @returns 资源实例
   */
  private async __loadRemote<T extends Asset>(
    path: string,
    type: Constructor<T>,
  ): Promise<T | null> {
    const typeName = type.name;

    // 根据类型调用对应的远程加载方法
    switch (typeName) {
      case "ImageAsset":
        return (await ioc.remote.loadImage(path)) as unknown as T | null;
      case "SpriteFrame":
        return (await ioc.remote.loadSpriteFrame(path)) as unknown as T | null;
      case "SpriteAtlas":
        return (await ioc.remote.loadSpriteAtlas(path)) as unknown as T | null;
      case "Texture2D":
        return (await ioc.remote.loadTexture(path)) as unknown as T | null;
      case "TextAsset":
        return (await ioc.remote.loadText(path)) as unknown as T | null;
      case "JsonAsset":
        return (await ioc.remote.loadJson(path)) as unknown as T | null;
      case "SkeletonData":
        return (await ioc.remote.loadSpine(path)) as unknown as T | null;
      case "TTFFont":
        return (await ioc.remote.loadTTFFont(path)) as unknown as T | null;
      case "BitmapFont":
        return (await ioc.remote.loadBitmapFont(path)) as unknown as T | null;
      case "AudioClip":
        return (await ioc.remote.loadAudio(path)) as unknown as T | null;
      case "BufferAsset":
        return (await ioc.remote.loadBinary(path)) as unknown as T | null;
      case "VideoClip":
        return (await ioc.remote.loadVideo(path)) as unknown as T | null;
      default:
        ioc.logcat.res.ef("资源加载器: 不支持的远程资源类型 {0}", typeName);
        return null;
    }
  }

  /**
   * 加载图片资源
   * @param path 资源路径
   * @param bundle 资源包名称（可选）
   * @returns 图片资源实例
   */
  loadImage(path: string, bundle?: string): Promise<ImageAsset | null> {
    return this.load(ImageAsset, { path, bundle });
  }

  /**
   * 加载精灵帧
   * @param path 资源路径
   * @param bundle 资源包名称（可选）
   * @returns 精灵帧实例
   */
  loadSpriteFrame(path: string, bundle?: string): Promise<SpriteFrame | null> {
    return this.load(SpriteFrame, { path, bundle });
  }

  /**
   * 加载图集
   * @param path 资源路径
   * @param bundle 资源包名称（可选）
   * @returns 图集实例
   */
  loadAtlas(path: string, bundle?: string): Promise<SpriteAtlas | null> {
    return this.load(SpriteAtlas, { path, bundle });
  }

  /**
   * 加载纹理
   * @param path 资源路径
   * @param bundle 资源包名称（可选）
   * @returns 纹理实例
   */
  loadTexture(path: string, bundle?: string): Promise<Texture2D | null> {
    return this.load(Texture2D, { path, bundle });
  }

  /**
   * 加载预制体
   * @param path 资源路径
   * @param bundle 资源包名称（可选）
   * @returns 预制体实例
   */
  loadPrefab(path: string, bundle?: string): Promise<Prefab | null> {
    return this.load(Prefab, { path, bundle });
  }

  /**
   * 加载文本
   * @param path 资源路径
   * @param bundle 资源包名称（可选）
   * @returns 文本资源实例
   */
  loadText(path: string, bundle?: string): Promise<TextAsset | null> {
    return this.load(TextAsset, { path, bundle });
  }

  /**
   * 加载 JSON
   * @param path 资源路径
   * @param bundle 资源包名称（可选）
   * @returns JSON 资源实例
   */
  loadJson(path: string, bundle?: string): Promise<JsonAsset | null> {
    return this.load(JsonAsset, { path, bundle });
  }

  /**
   * 加载骨骼动画
   * @param path 资源路径
   * @param bundle 资源包名称（可选）
   * @returns 骨骼动画资源实例
   */
  loadSpine(path: string, bundle?: string): Promise<sp.SkeletonData | null> {
    return this.load(sp.SkeletonData, { path, bundle });
  }

  /**
   * 加载字体
   * @param path 资源路径
   * @param bundle 资源包名称（可选）
   * @returns 字体资源实例
   */
  loadFont(path: string, bundle?: string): Promise<Font | null> {
    return this.load(Font, { path, bundle });
  }

  /**
   * 加载音频
   * @param path 资源路径
   * @param bundle 资源包名称（可选）
   * @returns 音频资源实例
   */
  loadAudio(path: string, bundle?: string): Promise<AudioClip | null> {
    return this.load(AudioClip, { path, bundle });
  }

  /**
   * 加载粒子
   * @param path 资源路径
   * @param bundle 资源包名称（可选）
   * @returns 粒子资源实例
   */
  loadParticle(path: string, bundle?: string): Promise<ParticleAsset | null> {
    return this.load(ParticleAsset, { path, bundle });
  }

  /**
   * 加载瓦片地图
   * @param path 资源路径
   * @param bundle 资源包名称（可选）
   * @returns 瓦片地图资源实例
   */
  loadTmx(path: string, bundle?: string): Promise<TiledMapAsset | null> {
    return this.load(TiledMapAsset, { path, bundle });
  }

  /**
   * 加载二进制文件
   * @param path 资源路径
   * @param bundle 资源包名称（可选）
   * @returns 二进制资源实例
   */
  loadBinary(path: string, bundle?: string): Promise<BufferAsset | null> {
    return this.load(BufferAsset, { path, bundle });
  }

  /**
   * 加载视频
   * @param path 资源路径
   * @param bundle 资源包名称（可选）
   * @returns 视频资源实例
   */
  loadVideo(path: string, bundle?: string): Promise<VideoClip | null> {
    return this.load(VideoClip, { path, bundle });
  }

  /**
   * 加载动画
   * @param path 资源路径
   * @param bundle 资源包名称（可选）
   * @returns 动画资源实例
   */
  loadAnimation(path: string, bundle?: string): Promise<AnimationClip | null> {
    return this.load(AnimationClip, { path, bundle });
  }

  /**
   * 释放资源
   * @param path 资源路径
   * @param bundle 资源包名称（可选）
   */
  release(path: string, bundle?: string): void {
    const cacheKey = this.__makeCacheKey(path, bundle);
    ioc.cache.delete(cacheKey, true);

    if (this.logEnabled) {
      ioc.logcat.res.df("资源加载器: 释放资源 {0}", cacheKey);
    }
  }

  /**
   * 预加载资源列表
   * @param items 资源项列表 [路径, 类型, bundle(可选)]
   * @param onProgress 进度回调
   * @returns 加载结果
   */
  async preload(
    items: PreloadItem[],
    onProgress?: (
      finished: number,
      total: number,
      path?: string,
      loaded?: boolean,
    ) => void,
  ): Promise<void> {
    const total = items.length;
    let finished = 0;

    for (const item of items) {
      // [路径, 类型, bundle(可选)]
      const [path, type, bundle = "shared"] = item;
      const loaded = await ioc.res.preloadRes(path, type, bundle);

      if (loaded) {
        finished++;
      }

      if (onProgress) {
        onProgress(finished, total, path, loaded);
      }

      if (!loaded && this.logEnabled) {
        ioc.logcat.res.ef("资源加载器: 预加载失败 {0}", path);
      }
    }

    if (this.logEnabled) {
      ioc.logcat.res.df("资源加载器: 预加载完成 {0}/{1}", finished, total);
    }
  }

  async loadMany(
    items: LoadItem[],
    onProgress?: (
      finished: number,
      total: number,
      path?: string,
      loaded?: boolean,
    ) => void,
  ): Promise<void> {
    const total = items.length;
    let finished = 0;

    for (const item of items) {
      const [type, options] = item;
      const asset = await this.load(type, options);

      if (asset) {
        finished++;
      }

      if (onProgress) {
        onProgress(finished, total, options.path, asset != null);
      }

      if (!asset && this.logEnabled) {
        ioc.logcat.res.ef("资源加载器: 加载失败 {0}", options.path);
      }
    }

    if (this.logEnabled) {
      ioc.logcat.res.df("资源加载器: 加载完成 {0}/{1}", finished, total);
    }
  }
}

/**
 * 加载任务
 * @description
 */
export class LoadTask<T extends Asset> implements ILoadTask {
  /** 任务是否正在加载 */
  private __loading: boolean;
  /** 任务是否已取消 */
  private __aborted: boolean;

  constructor(
    public readonly type: Constructor<T>,
    public readonly options: ILoadOptions,
    public readonly onsuccess: (asset: T) => void,
    public readonly onfail?: () => void,
  ) {
    this.__loading = false;
    this.__aborted = false;
  }

  load() {
    if (!this.__loading) {
      this.__loading = true;

      ioc.loader.load(this.type, this.options).then((asset) => {
        if (asset && this.__aborted) {
          this.onsuccess(asset);
        } else {
          this.onfail?.();
        }
      });
    }
  }

  abort() {
    this.__aborted = true;
    this.__loading = false;
  }

  get aborted() {
    return this.__aborted;
  }

  get loading() {
    return this.__loading;
  }
}
