import { gfx, warnID, ImageAsset, Rect, SpriteFrame, Texture2D } from "cc";

import { MaxRectsPacker } from "./max-rects-packer";
import { list } from "../ability";

/**
 * 动态纹理
 */
export class AutoTexture extends Texture2D {
  /**
   * 初始化
   * @param width 宽度
   * @param height 过渡
   * @param format 格式
   */
  public initWithSize(width: number, height: number, format: number = 35): void {
    this.reset({
      width,
      height,
      format,
    });
  }

  /**
   * 将指定的图片渲染到指定的位置上
   * @param image 图片
   * @param x X 坐标
   * @param y Y 坐标
   */
  public drawTextureAt(image: ImageAsset, x: number, y: number): void {
    const gfxTexture = this.getGFXTexture();
    if (!image || !gfxTexture) {
      return;
    }

    const gfxDevice = this._getGFXDevice();
    if (!gfxDevice) {
      warnID(16363);
      return;
    }

    const region = new gfx.BufferTextureCopy();
    region.texOffset.x = x;
    region.texOffset.y = y;
    region.texExtent.width = image.width;
    region.texExtent.height = image.height;
    gfxDevice.copyTexImagesToTexture([image.data as HTMLCanvasElement], gfxTexture, [region]);
  }
}

/**
 * 自动图集配置
 */
export interface IAutoAtlasOptions {
  width: number;
  height: number;
  smart: boolean;
  border: number;
  padding: number;
}

/**
 * 自动图集
 */
export class AutoAtlas {
  /** 分页列表 */
  private __pages: AutoTexture[];
  /** 图像与区域映射 */
  private __region: Map<string, [page: number, region: Rect]>;
  /** 图集打包器 */
  private __packer: MaxRectsPacker;
  /** 配置 */
  private __options: IAutoAtlasOptions;

  /**
   * 自动图集构造
   * @param flag 图集标识
   * @param options 配置
   */
  public constructor(public readonly flag: string, options: Partial<IAutoAtlasOptions>) {
    options = {
      width: 1024,
      height: 1024,
      smart: true,
      border: 1,
      padding: 2,
      ...options,
    };
    this.__pages = [];
    this.__region = new Map();
    this.__packer = new MaxRectsPacker(options.width, options.height, options.padding, {
      smart: options.smart,
      border: options.border,
    });
    this.__options = { ...options } as IAutoAtlasOptions;
  }

  /**
   * 添加分页
   * @returns
   */
  private __addPage() {
    const texture = new AutoTexture();
    texture.initWithSize(this.__options.width, this.__options.height);
    this.__pages.push(texture);
    return texture;
  }

  /**
   * 查询图像
   * @param uuid 标识
   * @returns
   */
  public has(uuid: string) {
    return this.__region.has(uuid);
  }

  /**
   * 获取可用图像
   * @param uuid 标识
   * @returns
   */
  public acquire(uuid: string) {
    if (this.has(uuid)) {
      const [pageId, region] = this.__region.get(uuid);
      const page = this.__pages[pageId];
      const frame = new SpriteFrame();
      frame.packable = false;
      frame.texture = page;
      frame.rect = region;
      return frame;
    }
    return null;
  }

  /**
   * 添加图像
   * @param uuid 标识
   * @param image 图像
   */
  public add(uuid: string, image: ImageAsset) {
    if (!this.has(uuid)) {
      const rect = this.__packer.add(image.width, image.height, image.uuid);
      const pageId = this.__packer.bins.length - 1;
      const region = new Rect(rect.x, rect.y, rect.width, rect.height);
      this.__region.set(uuid, [pageId, region]);
      const page = this.__pages[pageId] ?? this.__addPage();
      page.drawTextureAt(image, region.x, region.y);
    }
  }

  /**
   * 删除所有纹理
   * @warn 你必须很清楚自己在做什么
   */
  public destroy() {
    this.__region.clear();
    list.clear(this.__pages, (page) => page.destroy());
  }
}
