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

import { Constructor } from "../typings";
import { IDependency } from "./dependency.typings";
import { BitmapFont } from "cc";

/**
 * 资源容器接口
 */
export interface IResContainer extends IDependency {
  /**
   * 解析资源本地路径
   * @param path 资源本地路径
   * @returns
   */
  parsePath(path: string): [string, string];

  /**
   * 项目内是否包含指定包（不论是否已加载）
   * @param ab 包名称
   * @returns
   */
  hasAB(ab: string): boolean;

  /**
   * 根据 uuid 获取资源路径
   * @param uuid 资源 uuid
   * @returns
   */
  pathOf(uuid: string): string;

  /**
   * 根据路径获取资源 uuid
   * @param path 资源路径
   * @returns
   */
  uuidOf(path: string): string;

  /**
   * 加载项目内部包
   * @param ab 包名称
   * @returns
   */
  loadAB(ab: string): Promise<AssetManager.Bundle | null>;

  /**
   * 卸载项目内部包
   * @param ab 包名称
   * @param releaseAll 是否卸载包内资源
   */
  unloadAB(ab: string, releaseAll?: boolean): void;

  /**
   * 包内是否包含指定资源
   * @param path 资源路径
   * @returns
   */
  hasRes(path: string): Promise<boolean>;

  /**
   * 预加载包内指定资源
   * @param path 资源路径
   * @param type 资源类型
   * @returns
   */
  preloadRes<T extends Asset>(
    type: Constructor<T>,
    path: string,
  ): Promise<boolean>;

  /**
   * 加载包内指定资源
   * @param path 资源路径
   * @param type 资源类型
   * @returns
   */
  loadRes<T extends Asset>(
    type: Constructor<T>,
    path: string,
  ): Promise<T | null>;

  /**
   * 加载原始图片
   * @param path 资源路径
   * @returns
   */
  loadImage(path: string): Promise<ImageAsset | null>;

  /**
   * 加载精灵
   * @param path 资源路径
   * @returns
   */
  loadSpriteFrame(path: string): Promise<SpriteFrame | null>;

  /**
   * 加载图集
   * @param path 资源路径
   * @returns
   */
  loadAtlas(path: string): Promise<SpriteAtlas | null>;

  /**
   * 加载纹理
   * @param path 资源路径
   * @returns
   */
  loadTexture(path: string): Promise<Texture2D | null>;

  /**
   * 加载预制体
   * @param path 资源路径
   * @returns
   */
  loadPrefab(path: string): Promise<Prefab | null>;

  /**
   * 加载文本
   * @param path 资源路径
   * @returns
   */
  loadText(path: string): Promise<TextAsset | null>;

  /**
   * 加载 JSON
   * @param path 资源路径
   * @returns
   */
  loadJson(path: string): Promise<JsonAsset | null>;

  /**
   * 加载骨骼动画
   * @param path 资源路径
   * @returns
   */
  loadSpine(path: string): Promise<sp.SkeletonData | null>;

  /**
   * 加载字体
   * @param path 资源路径
   * @returns
   */
  loadFont(path: string): Promise<Font | null>;

  /**
   * 加载位图字体
   * @param path 资源路径
   * @returns
   */
  loadBitmapFont(path: string): Promise<BitmapFont | null>;

  /**
   * 加载音频切片
   * @param path 资源路径
   * @returns
   */
  loadAudio(path: string): Promise<AudioClip | null>;

  /**
   * 加载粒子
   * @param path 资源路径
   * @returns
   */
  loadParticle(path: string): Promise<ParticleAsset>;

  /**
   * 加载瓦片地图
   * @param path 资源路径
   * @returns
   */
  loadTmx(path: string): Promise<TiledMapAsset | null>;

  /**
   * 加载二进制文件
   * @param path 资源路径
   * @returns
   */
  loadBinary(path: string): Promise<BufferAsset | null>;

  /**
   * 加载视频切片
   * @param path 资源路径
   * @returns
   */
  loadVideo(path: string): Promise<VideoClip | null>;

  /**
   * 加载动画切片
   * @param path 资源路径
   * @returns
   */
  loadAnimation(path: string): Promise<AnimationClip | null>;
}
