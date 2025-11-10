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
import { list } from "../ability";
import { BitmapFont } from "cc";
import { js } from "cc";

/**
 * 资源加载器
 * @description 统一管理本地和远程资源的加载，自动处理缓存
 */
@Injectable({ name: "AssetLoader" })
export class AssetLoader extends Dependency implements IAssetLoader {
  /**
   * 解析资源路径
   * @param path 资源路径
   * @returns [缓存key, 原始路径]
   */
  private __parsePath(path: string): [CacheSource, string, string] {
    let raw = path.slice(2);
    if (this.isLocal(path)) {
      raw = ioc.res.parsePath(raw).join("@");
      return [CacheSource.Local, "l:" + raw, raw];
    } else if (this.isRemote(path)) {
      return [CacheSource.Remote, path, raw];
    } else {
      return [CacheSource.Unknown, "", ""];
    }
  }

  public logEnabled: boolean = false;

  public defaultCacheExpires: number = PRESET.TIME.AUTO_RELEASE_MS;

  isRemote(path: string): boolean {
    return path.startsWith("r:");
  }

  isLocal(path: string) {
    return path.startsWith("l:");
  }

  loadBundle(bundle: string): Promise<AssetManager.Bundle | null> {
    return ioc.res.loadAB(bundle);
  }

  unloadBundle(bundle: string, releaseAll: boolean = false): void {
    // 清理该包的所有缓存
    const prefix = `l:${bundle}@`;
    const keys = ioc.cache.keys(CacheSource.Local);
    keys.forEach((key) => {
      if (key.startsWith(prefix)) {
        ioc.cache.delete(key, true);
      }
    });

    // 卸载资源包
    ioc.res.unloadAB(bundle, releaseAll);

    if (this.logEnabled) {
      ioc.logcat.res.df("资源加载器: 卸载资源包 {0}");
    }
  }

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
      // [路径, 类型(可选)]
      const [path, type = "resources"] = item;
      const loaded = await ioc.res.preloadRes(path, type);

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

  async load<T extends Asset>(
    type: Constructor<T>,
    options: ILoadOptions,
  ): Promise<T | null> {
    const { path, cacheExpires = this.defaultCacheExpires } = options;
    const [source, key, raw] = this.__parsePath(path);
    if (source == CacheSource.Unknown) {
      ioc.logcat.res.df("资源加载器: 跳过无效路径 {0}", path);
      return null;
    }

    // 检查缓存
    const cached = ioc.cache.get<T>(key);
    if (cached) {
      if (this.logEnabled) {
        ioc.logcat.res.df("资源加载器: 命中缓存 {0}", key);
      }
      return cached;
    }

    // 加载资源
    let asset: T | null = null;
    if (source == CacheSource.Remote) {
      asset = await ioc.remote.load<T>(type, raw);
    } else {
      asset = await ioc.res.loadRes<T>(type, raw);
    }

    // 缓存资源
    if (asset) {
      ioc.cache.set({
        key,
        asset,
        source,
        expires: cacheExpires,
        refCount: 0,
      });

      if (this.logEnabled) {
        ioc.logcat.res.df("资源加载器: 加载并缓存 {0}", key);
      }
    }

    return asset;
  }

  loadImage(path: string): Promise<ImageAsset | null> {
    return this.load(ImageAsset, { path });
  }

  loadSpriteFrame(path: string): Promise<SpriteFrame | null> {
    return this.load(SpriteFrame, { path });
  }

  loadAtlas(path: string): Promise<SpriteAtlas | null> {
    return this.load(SpriteAtlas, { path });
  }

  loadTexture(path: string): Promise<Texture2D | null> {
    return this.load(Texture2D, { path });
  }

  loadPrefab(path: string): Promise<Prefab | null> {
    return this.load(Prefab, { path });
  }

  loadText(path: string): Promise<TextAsset | null> {
    return this.load(TextAsset, { path });
  }

  loadJson(path: string): Promise<JsonAsset | null> {
    return this.load(JsonAsset, { path });
  }

  loadSpine(path: string): Promise<sp.SkeletonData | null> {
    return this.load(sp.SkeletonData, { path });
  }

  loadFont(path: string): Promise<Font | null> {
    return this.load(Font, { path });
  }

  loadBitmapFont(path: string): Promise<BitmapFont | null> {
    return this.load(BitmapFont, { path });
  }

  loadAudio(path: string): Promise<AudioClip | null> {
    return this.load(AudioClip, { path });
  }

  loadParticle(path: string): Promise<ParticleAsset | null> {
    return this.load(ParticleAsset, { path });
  }

  loadTmx(path: string): Promise<TiledMapAsset | null> {
    return this.load(TiledMapAsset, { path });
  }

  loadBinary(path: string): Promise<BufferAsset | null> {
    return this.load(BufferAsset, { path });
  }

  loadVideo(path: string): Promise<VideoClip | null> {
    return this.load(VideoClip, { path });
  }

  loadAnimation(path: string): Promise<AnimationClip | null> {
    return this.load(AnimationClip, { path });
  }

  release(path: string): void {
    const [source, key] = this.__parsePath(path);
    if (source !== CacheSource.Unknown) {
      ioc.cache.delete(key, true);
      if (this.logEnabled) {
        ioc.logcat.res.df("资源加载器: 释放资源 {0}", key);
      }
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

      const url = options.bundle + "@" + options.path;

      if (onProgress) {
        onProgress(finished, total, url, asset != null);
      }

      if (!asset && this.logEnabled) {
        ioc.logcat.res.ef("资源加载器: 加载失败 {0}", url);
      }
    }

    if (this.logEnabled) {
      ioc.logcat.res.df("资源加载器: 加载完成 {0}/{1}", finished, total);
    }
  }

  loadSequence(
    tasks: LoadItem[],
    onProgress?: (
      finished: number,
      total: number,
      path: string,
      success: boolean,
    ) => void,
  ): () => void {
    const total = tasks.length;
    let index = 0;
    let finished = 0;
    let aborted = false;
    let current: ILoadTask | undefined = undefined;

    const next = () => {
      if (aborted) {
        return;
      }

      if (index >= total) {
        return;
      }

      const task = tasks[index++];
      const [type, options] = task;
      current = new LoadTask(type, options, (asset) => {
        if (asset) {
          finished++;
        }

        const url = options.bundle + "@" + options.path;

        if (onProgress) {
          onProgress(finished, total, url, asset != null);
        }

        if (!asset && this.logEnabled) {
          ioc.logcat.res.ef("资源加载器: 加载失败 {0}", url);
        }

        next();
      });
      current.load();
    };

    next();

    return function abort() {
      if (!aborted) {
        aborted = true;
        current?.abort();
        current = undefined;
      }
    };
  }

  loadParallel(
    items: LoadItem[],
    onProgress?: (
      finished: number,
      total: number,
      path: string,
      success: boolean,
    ) => void,
    concurrency: number = 0,
  ) {
    let finished = 0;
    let total = items.length;
    let aborted = false;

    if (concurrency <= 0) {
      const tasks = items.map(
        (item) =>
          new LoadTask(...item, (asset) => {
            if (asset) {
              finished++;
            }

            const options = item[1];
            const url = options.bundle + "@" + options.path;

            if (onProgress) {
              onProgress(finished, total, url, asset != null);
            }

            if (!asset && this.logEnabled) {
              ioc.logcat.res.ef("资源加载器: 加载失败 {0}", url);
            }
          }),
      );
      tasks.forEach((task) => task.load());

      return function abort() {
        if (!aborted) {
          aborted = true;
          tasks.forEach((task) => task.abort());
        }
      };
    } else {
      const tasks = items.map(
        (item) =>
          new LoadTask(...item, (asset) => {
            if (asset) {
              finished++;
            }

            const options = item[1];
            const url = options.bundle + "@" + options.path;

            if (onProgress) {
              onProgress(finished, total, url, asset != null);
            }

            if (!asset && this.logEnabled) {
              ioc.logcat.res.ef("资源加载器: 加载失败 {0}", url);
            }
          }),
      );

      const queue = list.split(tasks, concurrency);
      const next = () => {
        if (aborted) return;
        const tasks = queue.shift();
        if (tasks) {
          tasks.forEach((v) => v.load());
        }
      };

      next();

      return function abort() {
        if (!aborted) {
          aborted = true;
          queue.forEach((tasks) => {
            tasks.forEach((task) => {
              task.abort();
            });
          });
        }
      };
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
    public readonly oncomplete?: (asset: T | null) => void,
    public readonly onsuccess?: (asset: T) => void,
    public readonly onfail?: () => void,
  ) {
    this.__loading = false;
    this.__aborted = false;
  }

  load() {
    if (!this.__loading) {
      this.__loading = true;

      ioc.loader.load(this.type, this.options).then((asset) => {
        this?.oncomplete?.(asset);
        if (asset && this.__aborted) {
          this?.onsuccess?.(asset);
        } else {
          this?.onfail?.();
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
