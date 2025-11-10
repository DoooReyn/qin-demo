import {
  sp,
  __private,
  AudioClip,
  BitmapFont,
  BufferAsset,
  ImageAsset,
  JsonAsset,
  Rect,
  SpriteAtlas,
  SpriteFrame,
  Texture2D,
  TextAsset,
  TTFFont,
  VideoClip,
} from "cc";

import { IDependency } from "./dependency.typings";
import { Asset } from "cc";
import { Constructor } from "../typings";

/**
 * 远程资源容器接口
 */
export interface IRemoteContainer extends IDependency {
  /**
   * 创建图像资源
   * @param img 原始图像
   * @returns
   */
  createImageAsset(
    img: __private._cocos_asset_assets_image_asset__ImageSource,
  ): ImageAsset;
  /** 获取图集名称 */
  getAtlasName(atlas: string): string;
  /** 解析矩形信息 TexturePacker */
  parseRect(rect: string): Rect;
  /**
   * 添加参数
   * @param key 键
   * @param val 值
   */
  appendParam(key: string, val: string): void;
  /**
   * 设置参数
   * @param params 参数
   */
  setParams(params: Record<string, string>): void;
  /** 清空参数 */
  clearParams(): void;
  /**
   * 组织网址
   * @param raw 资源地址
   * @param timestamp 是否添加时间戳
   * @returns
   */
  makeUrl(raw: string, timestamp: boolean): string;
  /** 原始网址 */
  nativeUrlOf(url: string): string;
  /**
   * 加载音频切片
   * @param url 资源路径
   * @returns
   */
  loadAudio(url: string): Promise<AudioClip | null>;
  /**
   * 加载二进制文件
   * @param url 资源路径
   * @returns
   */
  loadBinary(url: string): Promise<BufferAsset | null>;
  /**
   * 加载 astc 图像
   * @param url 资源路径
   * @returns
   */
  loadASTC(url: string): Promise<SpriteFrame | null>;
  /**
   * 加载 ttf 字体
   * @param url 资源路径
   * @returns
   */
  loadTTFFont(url: string): Promise<TTFFont | null>;
  /**
   * 加载位图字体
   * @param url 资源路径
   */
  loadBitmapFont(url: string): Promise<BitmapFont | null>;
  /**
   * 加载图片
   * @param url 资源路径
   * @returns
   */
  loadImage(url: string): Promise<ImageAsset | null>;
  /**
   * 加载 JSON
   * @param url 资源路径
   * @returns
   */
  loadJson(url: string): Promise<JsonAsset | null>;
  /**
   * 加载骨骼动画
   * @param url 资源路径
   * @returns
   */
  loadSpine(url: string): Promise<sp.SkeletonData | null>;
  /**
   * 加载图集
   * @param url 资源路径
   * @returns
   */
  loadSpriteAtlas(url: string): Promise<SpriteAtlas | null>;
  /**
   * 加载精灵
   * @param url 资源路径
   * @returns
   */
  loadSpriteFrame(url: string): Promise<SpriteFrame | null>;
  /**
   * 加载纹理
   * @param url 资源路径
   * @returns
   */
  loadTexture(url: string): Promise<Texture2D | null>;
  /**
   * 加载文本
   * @param url 资源路径
   * @returns
   */
  loadText(url: string): Promise<TextAsset | null>;
  /**
   * 加载视频
   * @param url 资源路径
   * @returns
   */
  loadVideo(url: string): Promise<VideoClip | null>;
  /**
   * 加载远程资源
   * @param type 资源类型
   * @param path 资源路径
   * @returns 资源实例
   */
  load<T extends Asset>(type: Constructor<T>, path: string): Promise<T | null>;
}
