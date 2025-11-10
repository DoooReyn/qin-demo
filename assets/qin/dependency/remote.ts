import {
  assetManager,
  js,
  path,
  sp,
  sys,
  __private,
  Asset,
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

import { time } from "../ability";
import ioc, { Injectable } from "../ioc";
import { Dependency } from "./dependency";
import { IRemoteContainer } from "./remote.typings";
import { Constructor } from "../typings";

/**
 * 远程资源容器
 * @description 仅提供常用格式的加载，如有需要请自行扩展
 */
@Injectable({ name: "RemoteContainer" })
export class RemoteContainer extends Dependency implements IRemoteContainer {
  /** 资源服务器地址 */
  private __server: string = "";

  /** 携带参数 */
  private __params: Record<string, string> = Object.create(null);

  /** 资源缓存 */
  private __container: Map<string, Asset> = new Map();

  onAttach(): Promise<void> {
    this.__server = assetManager.downloader.remoteServerAddress;
    return super.onAttach();
  }

  onDetach(): Promise<void> {
    this.__container.clear();
    return super.onDetach();
  }

  /**
   * 创建图像资源
   * @param img 原始图像
   * @returns
   */
  public createImageAsset(
    img: __private._cocos_asset_assets_image_asset__ImageSource,
  ) {
    return img instanceof ImageAsset ? img : new ImageAsset(img);
  }

  /** 获取图集名称 */
  public getAtlasName(atlas: string) {
    const matches = atlas.match(/[\w\-_]+\.png/);
    if (matches) return matches[0];
    return "";
  }

  /** 解析矩形信息 TexturePacker */
  public parseRect(rect: string) {
    rect = rect.replace(/[\{\}]/g, "");
    const rectArr = rect.split(",").map(parseFloat);
    return new Rect(...rectArr);
  }

  /**
   * 添加参数
   * @param key 键
   * @param val 值
   */
  public appendParam(key: string, val: string) {
    this.__params[key] = val;
  }

  /**
   * 设置参数
   * @param params 参数
   */
  public setParams(params: Record<string, string>) {
    this.clearParams();
    Object.keys(params).forEach((k) => {
      this.__params[k] = params[k];
    });
  }

  /** 清空参数 */
  public clearParams() {
    Object.keys(this.__params).forEach((k) => {
      delete this.__params[k];
    });
  }

  /**
   * 加载资源
   * @param key 别名
   * @param urls 资源路径
   * @param parser 解析器
   * @returns
   */
  private __load<T extends Asset>(
    key: string,
    urls: string | string[],
    parser: (asset: any) => T,
  ) {
    return new Promise<T | null>((res) => {
      let asset: Asset | undefined | null = this.__container.get(key);
      if (asset) {
        if (asset.isValid) {
          // 缓存已存在
          return res(asset as T);
        } else {
          // 缓存已存在，但资源已被释放
          this.__container.delete(key);
          asset = null;
        }
      }
      if (!Array.isArray(urls)) urls = [urls];
      const ret = urls.map((v) => {
        return { url: this.makeUrl(v) };
      });
      assetManager.loadAny(ret, null, (err, data) => {
        if (err) {
          // 资源加载失败
          asset = null;
        } else {
          asset = parser(data!);
          if (asset) {
            // 资源解析成功
            this.__container.set(key, asset);
          } else {
            // 资源解析失败
            asset = null;
          }
        }
        return res(asset as T);
      });
    });
  }

  /**
   * 组织网址
   * @param raw 资源地址
   * @param timestamp 是否添加时间戳
   * @returns
   */
  public makeUrl(raw: string, timestamp: boolean = false) {
    const ret = [];
    const keys = Object.keys(this.__params);
    if (keys.length > 0) {
      keys.forEach((k) => {
        ret.push(`${k}=${this.__params[k]}`);
      });
    }
    if (timestamp) {
      ret.push(`t=${time.time()}`);
    }
    let url = path.join(this.__server, raw);
    if (ret.length) {
      url += "?" + ret.join("&");
    }
    return url;
  }

  /** 原始网址 */
  public nativeUrlOf(url: string) {
    return path.join(this.__server, url);
  }

  /**
   * 加载音频切片
   * @param url 资源路径
   * @returns
   */
  public loadAudio(url: string) {
    const urls = [url];
    return this.__load<AudioClip>(url, urls, (nativeAsset) => {
      const asset = new AudioClip();
      asset._nativeAsset = nativeAsset;
      asset._uuid = asset._nativeUrl = this.nativeUrlOf(urls[0]);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [],
        nativeDep: [nativeAsset],
      });
      return asset;
    });
  }

  /**
   * 加载二进制文件
   * @param url 资源路径
   * @returns
   */
  public loadBinary(url: string) {
    const urls = [url];
    return this.__load<BufferAsset>(url, urls, (nativeAsset) => {
      const asset = new BufferAsset();
      asset._nativeAsset = nativeAsset;
      asset._uuid = asset._nativeUrl = this.nativeUrlOf(urls[0]);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [],
        nativeDep: [nativeAsset],
      });
      return asset;
    });
  }

  /**
   * 加载 astc 图像
   * @param url 资源路径
   * @returns
   */
  public loadASTC(url: string) {
    const urls = [url];
    return this.__load<SpriteFrame>(url, urls, (nativeAsset) => {
      const info = sys.isBrowser ? nativeAsset : nativeAsset.file;
      const image = ioc.astc.createImageAsset(info);
      if (!image) return null as unknown as SpriteFrame;
      const asset = SpriteFrame.createWithImage(image);
      const uuid = this.nativeUrlOf(urls[0]);
      asset._nativeAsset = nativeAsset;
      image._uuid = uuid + "/image";
      asset._uuid = asset._nativeUrl = uuid;
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [],
        nativeDep: [nativeAsset],
      });
      return asset;
    });
  }

  /**
   * 加载 ttf 字体
   * @param url 资源路径
   * @returns
   */
  public loadTTFFont(url: string) {
    const urls = [url];
    return this.__load<TTFFont>(url, urls, (nativeAsset) => {
      const asset = new TTFFont();
      asset._nativeAsset = nativeAsset;
      asset._uuid = asset._nativeUrl = this.nativeUrlOf(urls[0]);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [],
        nativeDep: [nativeAsset],
      });
      return asset;
    });
  }

  /**
   * 加载位图字体
   * @param url 资源路径
   */
  public loadBitmapFont(url: string) {
    const ext = path.extname(url);
    const urls = [url, url.replace(ext, ".json")];
    return this.__load<BitmapFont>(url, urls, (natives) => {
      const [nImage, nJson] = natives;
      const image = this.createImageAsset(nImage);
      const frame = SpriteFrame.createWithImage(image);
      const asset = new BitmapFont();
      const uuid = this.nativeUrlOf(urls[0]);
      asset.fntConfig = nJson;
      asset.spriteFrame = frame;
      asset._nativeAsset = nImage;
      image._uuid = uuid + "/image";
      frame._uuid = uuid + "/spriteFrame";
      asset._uuid = asset._nativeUrl = uuid;
      assetManager.assets.add(image._uuid, image);
      assetManager.assets.add(frame._uuid, frame);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [frame._uuid, image._uuid],
        nativeDep: [nImage, nJson],
      });
      return asset;
    });
  }

  /**
   * 加载图片
   * @param url 资源路径
   * @returns
   */
  public loadImage(url: string) {
    const urls = [url];
    return this.__load<ImageAsset>(url, urls, (native) => {
      const asset = this.createImageAsset(native);
      asset._nativeAsset = native;
      asset._uuid = asset._nativeUrl = this.nativeUrlOf(urls[0]);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [],
        nativeDep: [native],
      });
      return asset;
    });
  }

  /**
   * 加载 JSON
   * @param url 资源路径
   * @returns
   */
  public loadJson(url: string) {
    const urls = [url];
    return this.__load<JsonAsset>(url, urls, (native) => {
      const asset = new JsonAsset();
      asset.json = native;
      asset._nativeAsset = native;
      asset._uuid = asset._nativeUrl = this.nativeUrlOf(urls[0]);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [],
        nativeDep: [native],
      });
      return asset;
    });
  }

  /**
   * 加载骨骼动画
   * @param url 资源路径
   * @returns
   */
  public loadSpine(url: string) {
    const ext = path.extname(url);
    const urls = [url, url.replace(ext, ".json"), url.replace(ext, ".atlas")];
    return this.__load<sp.SkeletonData>(url, urls, (natives) => {
      const [nImage, nAtlas, nJsonOrBin] = natives;
      const image = this.createImageAsset(nImage);
      const tex = new Texture2D();
      const asset = new sp.SkeletonData();
      const uuid = this.nativeUrlOf(urls[0]);
      tex.image = image;
      asset._nativeAsset = nJsonOrBin;
      if (ext == ".json") asset.skeletonJson = nJsonOrBin;
      asset.atlasText = nAtlas;
      asset.textures = [tex];
      asset.textureNames = [this.getAtlasName(nAtlas)];
      image._uuid = uuid + "/image";
      tex._uuid = uuid + "/texture";
      asset._uuid = asset._nativeUrl = uuid;
      assetManager.assets.add(image._uuid, image);
      assetManager.assets.add(tex._uuid, tex);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [tex._uuid, image._uuid],
        nativeDep: [nImage, nAtlas, nJsonOrBin],
      });
      return asset;
    });
  }

  /**
   * 加载图集
   * @param url 资源路径
   * @returns
   */
  public loadSpriteAtlas(url: string) {
    const ext = path.extname(url);
    const urls = [url, url.replace(ext, ".plist")];
    return this.__load<SpriteAtlas>(url, urls, (native) => {
      const [nImage, nPlist] = native;
      const image = this.createImageAsset(nImage);
      const tex = new Texture2D();
      const asset = new SpriteAtlas();
      const spriteFrames = [];
      const spriteFramesMap: Record<string, SpriteFrame> = {};
      const uuid = this.nativeUrlOf(urls[0]);
      tex.image = image;
      Object.keys(nPlist.frames).forEach((k) => {
        const frame = new SpriteFrame();
        const data = nPlist.frames[k];
        frame.texture = tex;
        if (data.textureRect) {
          frame.rect = this.parseRect(data.textureRect);
        } else if (data.frame) {
          frame.rect = new Rect(
            data.frame.x,
            data.frame.y,
            data.frame.w,
            data.frame.h,
          );
        } else {
          frame.rect = new Rect(data.x, data.y, data.w, data.h);
        }
        spriteFrames.push(frame);
        spriteFramesMap[k] = frame;
        frame._uuid = uuid + "/spriteFrame/" + k;
      });
      asset.spriteFrames = spriteFramesMap;
      asset._nativeAsset = nImage;
      image._uuid = uuid + "/image";
      tex._uuid = uuid + "/texture";
      asset._uuid = asset._nativeUrl = uuid;
      assetManager.assets.add(image._uuid, image);
      assetManager.assets.add(tex._uuid, tex);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [tex._uuid, image._uuid],
        nativeDep: [nImage, nPlist],
      });
      return asset;
    });
  }

  /**
   * 加载精灵
   * @param url 资源路径
   * @returns
   */
  public loadSpriteFrame(url: string) {
    const urls = [url];
    return this.__load<SpriteFrame>(url, urls, (native) => {
      const image = this.createImageAsset(native);
      const asset = SpriteFrame.createWithImage(image);
      const uuid = this.nativeUrlOf(urls[0]);
      asset._nativeAsset = native;
      image._uuid = uuid + "/image";
      asset._uuid = asset._nativeUrl = uuid;
      assetManager.assets.add(image._uuid, image);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [image.uuid],
        nativeDep: [native],
      });
      return asset;
    });
  }

  /**
   * 加载文本
   * @param url 资源路径
   * @returns
   */
  public loadText(url: string) {
    const urls = [url];
    return this.__load<TextAsset>(url, urls, (native) => {
      const asset = new TextAsset();
      asset.text = native;
      asset._nativeAsset = native;
      asset._uuid = asset._nativeUrl = this.nativeUrlOf(urls[0]);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [],
        nativeDep: [native],
      });
      return asset;
    });
  }

  /**
   * 加载纹理
   * @param url 资源路径
   * @returns
   */
  public loadTexture(url: string) {
    const urls = [url];
    return this.__load<Texture2D>(url, urls, (native) => {
      const image = this.createImageAsset(native);
      const asset = new Texture2D();
      const uuid = this.nativeUrlOf(urls[0]);
      asset.image = image;
      asset._nativeAsset = native;
      image._uuid = uuid + "/image";
      asset._uuid = asset._nativeUrl = uuid;
      assetManager.assets.add(image._uuid, image);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [image._uuid],
        nativeDep: [native],
      });
      return asset;
    });
  }

  /**
   * 加载视频切片
   * @param url 资源路径
   * @returns
   */
  public loadVideo(url: string) {
    const urls = [url];
    return this.__load<VideoClip>(url, urls, (native) => {
      const asset = new VideoClip();
      asset._nativeAsset = native;
      asset._uuid = asset._nativeUrl = this.nativeUrlOf(urls[0]);
      assetManager.dependUtil._depends.add(asset._uuid, {
        deps: [],
        nativeDep: [native],
      });
      return asset;
    });
  }

  /**
   * 加载远程资源
   * @param type 资源类型
   * @param path 资源路径
   * @returns 资源实例
   */
  async load<T extends Asset>(
    type: Constructor<T>,
    path: string,
  ): Promise<T | null> {
    const typeName = js.getClassName(type);
    // 根据类型调用对应的远程加载方法
    switch (typeName) {
      case "cc.ImageAsset":
        return (await ioc.remote.loadImage(path)) as unknown as T | null;
      case "cc.SpriteFrame":
        return (await ioc.remote.loadSpriteFrame(path)) as unknown as T | null;
      case "cc.SpriteAtlas":
        return (await ioc.remote.loadSpriteAtlas(path)) as unknown as T | null;
      case "cc.Texture2D":
        return (await ioc.remote.loadTexture(path)) as unknown as T | null;
      case "cc.TextAsset":
        return (await ioc.remote.loadText(path)) as unknown as T | null;
      case "cc.JsonAsset":
        return (await ioc.remote.loadJson(path)) as unknown as T | null;
      case "sp.SkeletonData":
        return (await ioc.remote.loadSpine(path)) as unknown as T | null;
      case "cc.TTFFont":
        return (await ioc.remote.loadTTFFont(path)) as unknown as T | null;
      case "cc.BitmapFont":
        return (await ioc.remote.loadBitmapFont(path)) as unknown as T | null;
      case "cc.AudioClip":
        return (await ioc.remote.loadAudio(path)) as unknown as T | null;
      case "cc.BufferAsset":
        return (await ioc.remote.loadBinary(path)) as unknown as T | null;
      case "cc.VideoClip":
        return (await ioc.remote.loadVideo(path)) as unknown as T | null;
      default:
        ioc.logcat.res.ef("资源加载器: 不支持的远程资源类型 {0}", typeName);
        return null;
    }
  }
}
