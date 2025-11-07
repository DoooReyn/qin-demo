import {
  sp, AnimationClip, Asset, AssetManager, AudioClip, BufferAsset, Font, ImageAsset, JsonAsset,
  ParticleAsset, Prefab, SpriteAtlas, SpriteFrame, Texture2D, TextAsset, TiledMapAsset, VideoClip
} from "cc";

import { Constructor } from "../typings";
import { IDependency } from "./dependency.typings";

/**
 * 资源容器接口
 */
export interface IResContainer extends IDependency {
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
   * @param raw 资源路径
   * @param ab 包名称
   * @returns
   */
  hasRes(raw: string, ab?: string): Promise<boolean>;

  /**
   * 加载包内指定资源
   * @param raw 资源路径
   * @param type 资源类型
   * @param ab 包名称
   * @returns
   */
  loadRes<T extends Asset>(raw: string, type: Constructor<T>, ab?: string): Promise<T | null>;

  /**
   * 加载原始图片
   * @param raw 资源路径
   * @param ab 包名称
   * @returns
   */
  loadImage(raw: string, ab?: string): Promise<ImageAsset | null>;

  /**
   * 加载精灵
   * @param raw 资源路径
   * @param ab 包名称
   * @returns
   */
  loadSpriteFrame(raw: string, ab?: string): Promise<SpriteFrame | null>;

  /**
   * 加载图集
   * @param raw 资源路径
   * @param ab 包名称
   * @returns
   */
  loadAtlas(raw: string, ab?: string): Promise<SpriteAtlas | null>;

  /**
   * 加载纹理
   * @param raw 资源路径
   * @param ab 包名称
   * @returns
   */
  loadTexture(raw: string, ab?: string): Promise<Texture2D | null>;

  /**
   * 加载预制体
   * @param raw 资源路径
   * @param ab 包名称
   * @returns
   */
  loadPrefab(raw: string, ab?: string): Promise<Prefab | null>;

  /**
   * 加载文本
   * @param raw 资源路径
   * @param ab 包名称
   * @returns
   */
  loadText(raw: string, ab?: string): Promise<TextAsset | null>;

  /**
   * 加载 JSON
   * @param raw 资源路径
   * @param ab 包名称
   * @returns
   */
  loadJson(raw: string, ab?: string): Promise<JsonAsset | null>;

  /**
   * 加载骨骼动画
   * @param raw 资源路径
   * @param ab 包名称
   * @returns
   */
  loadSpine(raw: string, ab?: string): Promise<sp.SkeletonData | null>;

  /**
   * 加载字体
   * @param raw 资源路径
   * @param ab 包名称
   * @returns
   */
  loadFont(raw: string, ab?: string): Promise<Font | null>;

  /**
   * 加载音频切片
   * @param raw 资源路径
   * @param ab 包名称
   * @returns
   */
  loadAudio(raw: string, ab?: string): Promise<AudioClip | null>;

  /**
   * 加载粒子
   * @param raw 资源路径
   * @param ab 包名称
   * @returns
   */
  loadParticle(raw: string, ab?: string): Promise<ParticleAsset>;

  /**
   * 加载瓦片地图
   * @param raw 资源路径
   * @param ab 包名称
   * @returns
   */
  loadTmx(raw: string, ab?: string): Promise<TiledMapAsset | null>;

  /**
   * 加载二进制文件
   * @param raw 资源路径
   * @param ab 包名称
   * @returns
   */
  loadBinary(raw: string, ab?: string): Promise<BufferAsset | null>;

  /**
   * 加载视频切片
   * @param raw 资源路径
   * @param ab 包名称
   * @returns
   */
  loadVideo(raw: string, ab?: string): Promise<VideoClip | null>;

  /**
   * 加载动画切片
   * @param raw 资源路径
   * @param ab 包名称
   * @returns
   */
  loadAnimation(raw: string, ab?: string): Promise<AnimationClip | null>;
}
