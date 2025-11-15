import { ImageAsset, SpriteFrame, Label, Node, Texture2D } from "cc";

import { be } from "../ability";
import ioc, { Injectable } from "../ioc";
import { AutoAtlas } from "../foundation/auto-atlas";
import { Dependency } from "./dependency";
import { IRichTextStyle } from "../atom/rich-text-atom";
import { IRichTextAtlas, RichTextAtlasLevel } from "./rich-text-atlas.typings";

/**
 * 富文本模板
 */
class RichTextTemplte extends Node {
  /** 文本组件 */
  private __renderer: Label;

  constructor() {
    super("rich-text-template");
    this.layer = 0;
    this.__renderer = this.addComponent(Label);
  }

  /**
   * 将文本和样式应用到渲染组件，并返回生成的图像资源
   */
  apply(ch: string, glyphKey: string, style: IRichTextStyle) {
    const renderer = this.__renderer;
    renderer.enabled = true;
    renderer.string = ch;
    renderer.fontFamily = style.fontFamily;
    renderer.fontSize = style.fontSize;
    renderer.color = style.color;
    renderer.isBold = style.bold;
    renderer.isItalic = style.italic;
    renderer.isUnderline = style.underline;
    if ((renderer.enableOutline = !!style.strokeColor)) {
      renderer.outlineColor = style.strokeColor;
      renderer.outlineWidth = style.strokeWidth;
    }
    if ((renderer.enableShadow = !!style.shadowColor)) {
      renderer.shadowColor = style.shadowColor;
      renderer.shadowOffset = style.shadowOffset;
      renderer.shadowBlur = style.shadowBlur;
    }
    renderer.updateRenderData(true);
    renderer.markForUpdateRenderData(false);

    const image = (renderer.ttfSpriteFrame!.texture as Texture2D).image;
    image._uuid = glyphKey;

    return image;
  }

  /**
   * 释放资源
   */
  dismiss() {
    // @ts-ignore
    this.__renderer?.destroyTtfSpriteFrame();
    this.__renderer.enabled = false;
  }
}

/**
 * 富文本图集条目
 */
interface IRichGlyphEntry {
  /** 引用的 SpriteFrame */
  frame: SpriteFrame;
  /** 最近一次被访问的时间戳，用于简单 LRU */
  lastUsed: number;
}

/**
 * 富文本图集信息
 */
interface IRichAtlasInfo {
  /** 自动图集 */
  atlas: AutoAtlas;
  /** glyphKey -> SpriteFrame */
  glyphs: Map<string, IRichGlyphEntry>;
  /** 引用计数，来自各个 RichText 组件 */
  refCount: number;
}

/**
 * 富文本图集依赖
 *
 * 封装 AutoAtlas，提供：
 * - glyph 级别的缓存和查找
 * - 引用计数
 * - 简单的 LRU 清理接口
 */
@Injectable({ name: "RichTextAtlas", priority: 220 })
export class RichTextAtlas extends Dependency implements IRichTextAtlas {
  /** atlasKey -> 图集信息 */
  private __atlases: Map<string, IRichAtlasInfo> = new Map();

  /** atlasKey -> 图集等级（控制 AutoAtlas 尺寸） */
  private __atlasLevels: Map<string, RichTextAtlasLevel> = new Map();

  /** 用于生成 glyph 的临时节点 */
  private __template: RichTextTemplte;

  initialize() {
    this.configureAtlas("richtext-default", RichTextAtlasLevel.XLarge);
    this.__template = new RichTextTemplte();
    ioc.launcher.root.insertChild(this.__template, 2);
  }

  public configureAtlas(atlasKey: string, level: RichTextAtlasLevel): void {
    if (this.__atlasLevels.has(atlasKey)) {
      const oldLevel = RichTextAtlasLevel[this.__atlasLevels.get(atlasKey)];
      ioc.logcat.qin.w(`富文本图集：${atlasKey} 已配置为 ${oldLevel}，请注意合理分配图集标识和等级`);
      return;
    }
    this.__atlasLevels.set(atlasKey, level);
  }

  onDetach(): Promise<void> {
    this.__template.destroy();
    this.__template = null;
    this.shrinkAll();
    return super.onDetach();
  }

  /**
   * 获取或创建图集信息
   * @param atlasKey 图集标识
   */
  private __getOrCreateAtlas(atlasKey: string): IRichAtlasInfo {
    let info = this.__atlases.get(atlasKey);
    if (!info) {
      const level = this.__atlasLevels.get(atlasKey) ?? RichTextAtlasLevel.Medium;
      const size = level as number;
      const atlas = new AutoAtlas(atlasKey, {
        width: size,
        height: size,
        smart: true,
        border: 1,
        padding: 2,
      });
      info = {
        atlas,
        glyphs: new Map(),
        refCount: 0,
      };
      this.__atlases.set(atlasKey, info);
    }
    return info;
  }

  public measureGlyphMetrics(atlasKey: string, glyphKey: string) {
    const info = this.__getOrCreateAtlas(atlasKey);

    const cached = info.glyphs.get(glyphKey);
    if (cached && cached.frame && cached.frame.isValid) {
      return {
        width: cached.frame.rect.width,
        height: cached.frame.rect.height,
      };
    }

    return null;
  }

  public addRef(atlasKey: string): void {
    const info = this.__getOrCreateAtlas(atlasKey);
    info.refCount++;
  }

  public decRef(atlasKey: string): void {
    const info = this.__atlases.get(atlasKey);
    if (!info) {
      return;
    }
    info.refCount--;
    if (info.refCount <= 0) {
      // 延迟实际清理交给 shrink / clearUnused
      info.refCount = 0;
    }
  }

  public acquireGlyph(atlasKey: string, glyphKey: string, ch: string, style: IRichTextStyle): SpriteFrame | null {
    const info = this.__getOrCreateAtlas(atlasKey);

    const cached = info.glyphs.get(glyphKey);
    if (cached && cached.frame && cached.frame.isValid) {
      cached.lastUsed = Date.now();
      return cached.frame;
    }

    const image = this.createGlyphImage(ch, glyphKey, style);
    if (!info.atlas.has(glyphKey)) {
      info.atlas.add(glyphKey, image);
      this.__template.dismiss();
    }

    const frame = info.atlas.acquire(glyphKey);
    if (!frame) {
      return null;
    }

    info.glyphs.set(glyphKey, {
      frame,
      lastUsed: Date.now(),
    });

    return frame;
  }

  public createGlyphImage(ch: string, glyphKey: string, style: IRichTextStyle): ImageAsset {
    return this.__template.apply(ch, glyphKey, style);
  }

  public clearUnused(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.__atlases.forEach((info, key) => {
      if (info.refCount > 0) {
        return;
      }
      // 简单策略：如果 30 秒内未被访问过，则销毁
      let latest = 0;
      info.glyphs.forEach((entry) => {
        if (entry.lastUsed > latest) {
          latest = entry.lastUsed;
        }
      });
      if (be.empty(info.glyphs) || now - latest > 30_000) {
        info.atlas.destroy();
        info.glyphs.clear();
        toDelete.push(key);
      }
    });

    toDelete.forEach((key) => this.__atlases.delete(key));
  }

  public shrinkAll(): void {
    this.clearUnused();
  }

  public getUsage() {
    const atlases: {
      atlasKey: string;
      width: number;
      height: number;
      memoryBytes: number;
      glyphCount: number;
      refCount: number;
    }[] = [];

    let totalMemoryBytes = 0;

    this.__atlases.forEach((info, key) => {
      const level = this.__atlasLevels.get(key) ?? RichTextAtlasLevel.Medium;
      const size = level as number;
      const width = size;
      const height = size;
      const memoryBytes = width * height * 4; // RGBA8888 4 字节/像素
      const glyphCount = info.glyphs.size;

      totalMemoryBytes += memoryBytes;

      atlases.push({
        atlasKey: key,
        width,
        height,
        memoryBytes,
        glyphCount,
        refCount: info.refCount,
      });
    });

    return {
      atlasCount: atlases.length,
      totalMemoryBytes,
      atlases,
    };
  }
}
