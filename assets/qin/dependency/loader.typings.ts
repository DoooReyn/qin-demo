import {
  sp,
  AnimationClip,
  Asset,
  AssetManager,
  AudioClip,
  BufferAsset,
  BitmapFont,
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

import { Constructor } from "../typings";
import { IDependency } from "./dependency.typings";

/**
 * 预加载资源项(仅本地资源)
 * - [资源路径, 资源类型]
 *
 * 资源路径形式
 * 1. 本地 l:[bundle@]<path>
 * 2. 远程 r:<url>
 *
 * @example
 * ["img-hero", SpriteFrame]  // 使用默认 bundle (shared)
 * ["resources@img-hero", SpriteFrame]
 */
export type PreloadItem = [string, Constructor<Asset>];

/**
 * 加载资源项
 * - [资源类型, 资源加载选项]
 *
 * 资源路径形式
 * 1. 本地 l:[bundle@]<path>
 * 2. 远程 r:<url>
 *
 * @example
 * [SpriteFrame, { path: "l:img-hero" }] // 使用默认 bundle (shared)
 * [SpriteFrame, { path: "l:resources@img-hero" }] // 指定 bundle
 * [SpriteFrame, { path: "r:img-hero.png" }] // 使用远程资源
 */
export type LoadItem = [Constructor<Asset>, ILoadOptions];

/**
 * 资源加载选项
 */
export interface ILoadOptions {
  /** 资源路径 */
  path: string;
  /** 缓存过期时间（毫秒），0 表示永不过期 */
  cacheExpires?: number;
}

/**
 * 资源类型枚举
 */
export enum AssetType {
  /** 图片 */
  Image = "image",
  /** 精灵帧 */
  SpriteFrame = "spriteFrame",
  /** 图集 */
  Atlas = "atlas",
  /** 纹理 */
  Texture = "texture",
  /** 预制体 */
  Prefab = "prefab",
  /** 文本 */
  Text = "text",
  /** JSON */
  Json = "json",
  /** 骨骼动画 */
  Spine = "spine",
  /** 字体 */
  Font = "font",
  /** 音频 */
  Audio = "audio",
  /** 粒子 */
  Particle = "particle",
  /** 瓦片地图 */
  Tmx = "tmx",
  /** 二进制 */
  Binary = "binary",
  /** 视频 */
  Video = "video",
  /** 动画 */
  Animation = "animation",
}

/**
 * 资源加载器接口
 */
export interface IAssetLoader extends IDependency {
  /**
   * 日志开关
   */
  logEnabled: boolean;

  /**
   * 默认缓存过期时间（毫秒）
   */
  defaultCacheExpires: number;

  /**
   * 判断是否为远程资源
   * @param path 资源路径
   * @returns 是否为远程资源
   */
  isRemote(path: string): boolean;

  /**
   * 判断是否为本地资源
   * @param path 资源路径
   * @returns 是否为本地资源
   */
  isLocal(path: string): boolean;

  /**
   * 加载资源包
   * @param bundle 包名称
   * @returns 资源包实例
   */
  loadBundle(bundle: string): Promise<AssetManager.Bundle | null>;

  /**
   * 卸载资源包
   * @param bundle 包名称
   * @param releaseAll 是否释放所有资源
   */
  unloadBundle(bundle: string, releaseAll?: boolean): void;

  /**
   * 通用资源加载方法
   * @param type 资源类型构造函数
   * @param options 加载选项
   * @returns 资源实例
   */
  load<T extends Asset>(
    type: Constructor<T>,
    options: ILoadOptions,
  ): Promise<T | null>;

  /**
   * 加载图片资源
   * @param path 资源路径
   * @returns 图片资源实例
   */
  loadImage(path: string): Promise<ImageAsset | null>;

  /**
   * 加载精灵帧
   * @param path 资源路径
   * @returns 精灵帧实例
   */
  loadSpriteFrame(path: string): Promise<SpriteFrame | null>;

  /**
   * 加载图集
   * @param path 资源路径
   * @returns 图集实例
   */
  loadAtlas(path: string): Promise<SpriteAtlas | null>;

  /**
   * 加载纹理
   * @param path 资源路径
   * @returns 纹理实例
   */
  loadTexture(path: string): Promise<Texture2D | null>;

  /**
   * 加载预制体
   * @param path 资源路径
   * @returns 预制体实例
   */
  loadPrefab(path: string): Promise<Prefab | null>;

  /**
   * 加载文本
   * @param path 资源路径
   * @returns 文本资源实例
   */
  loadText(path: string): Promise<TextAsset | null>;

  /**
   * 加载 JSON
   * @param path 资源路径
   * @returns JSON 资源实例
   */
  loadJson(path: string): Promise<JsonAsset | null>;

  /**
   * 加载骨骼动画
   * @param path 资源路径
   * @returns 骨骼动画资源实例
   */
  loadSpine(path: string): Promise<sp.SkeletonData | null>;

  /**
   * 加载字体
   * @param path 资源路径
   * @returns 字体资源实例
   */
  loadFont(path: string): Promise<Font | null>;

  /**
   * 加载文图字体
   * @param path 资源路径
   * @returns 位图字体资源实例
   */
  loadBitmapFont(path: string): Promise<BitmapFont | null>;

  /**
   * 加载音频
   * @param path 资源路径
   * @returns 音频资源实例
   */
  loadAudio(path: string): Promise<AudioClip | null>;

  /**
   * 加载粒子
   * @param path 资源路径
   * @returns 粒子资源实例
   */
  loadParticle(path: string): Promise<ParticleAsset | null>;

  /**
   * 加载瓦片地图
   * @param path 资源路径
   * @returns 瓦片地图资源实例
   */
  loadTmx(path: string): Promise<TiledMapAsset | null>;

  /**
   * 加载二进制文件
   * @param path 资源路径
   * @returns 二进制资源实例
   */
  loadBinary(path: string): Promise<BufferAsset | null>;

  /**
   * 加载视频
   * @param path 资源路径
   * @returns 视频资源实例
   */
  loadVideo(path: string): Promise<VideoClip | null>;

  /**
   * 加载动画
   * @param path 资源路径
   * @returns 动画资源实例
   */
  loadAnimation(path: string): Promise<AnimationClip | null>;

  /**
   * 释放资源
   * @param path 资源路径
   */
  release(path: string): void;

  /**
   * 预加载资源列表
   * @param items 资源项列表 [路径, 类型, bundle(可选)]
   * @param onProgress 进度回调
   * @returns 加载结果
   * @example
   * // 使用默认 bundle (shared)
   * await ioc.loader.preload([
   *   ["l:img-hero", SpriteFrame],
   *   ["l:aud-bgm", AudioClip],
   * ]);
   *
   * // 指定不同的 bundle
   * await ioc.loader.preload([
   *   ["l:resources@img-logo", SpriteFrame],
   *   ["l:img-hero", SpriteFrame],
   *   ["l:shared@aud-bgm", AudioClip],
   * ]);
   */
  preload(
    items: PreloadItem[],
    onProgress?: (
      finished: number,
      total: number,
      path: string,
      loaded: boolean,
    ) => void,
  ): Promise<void>;

  /**
   * 批量加载资源
   * @param items 资源项列表
   * @param onProgress
   */
  loadMany(
    items: LoadItem[],
    onProgress?: (
      finished: number,
      total: number,
      path?: string,
      loaded?: boolean,
    ) => void,
  ): Promise<void>;

  /**
   * 顺序加载资源队列（串行）
   * @param items 资源项列表
   * @param onProgress 进度回调
   * @returns 队列ID和进度信息
   * @example
   * const abort = await ioc.loader.loadSequence([
   *   ["l:img-hero", SpriteFrame],
   *   ["l:pfb-dialog", Prefab],
   * ], (progress) => {
   *   console.log(`进度: ${(progress.progress * 100).toFixed(0)}%`);
   * });
   * setTimeout(abort, 5000);
   */
  loadSequence(
    tasks: LoadItem[],
    onProgress?: (
      finished: number,
      total: number,
      path: string,
      success: boolean,
    ) => void,
  ): () => void;
}

/**
 * 加载任务接口
 */
export interface ILoadTask {
  /** 资源类型 */
  type: Constructor<Asset>;
  /** 加载选项 */
  options: ILoadOptions;
  /** 完成回调 */
  oncomplete?: (asset: Asset | null) => void;
  /** 成功回调 */
  onsuccess?: (asset: Asset) => void;
  /** 失败回调 */
  onfail?: () => void;
  /** 任务是否已取消 */
  get aborted(): boolean;
  /** 任务是否加载中 */
  get loading(): boolean;
  /** 加载任务 */
  load(): void;
  /** 取消任务 */
  abort(): void;
}
