import {
  assetManager,
  js,
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
import { Constructor } from "../typings";
import { Dependency } from "./dependency";
import { IResContainer } from "./res.typings";
import { BitmapFont } from "cc";

/**
 * 资源容器
 */
@Injectable({ name: "ResContainer" })
export class ResContainer extends Dependency implements IResContainer {
  parsePath(path: string): [string, string] {
    const arr = path.split("@");
    if (arr.length == 1) {
      return ["resources", arr[0]];
    } else {
      arr[0] ||= "resources";
      return arr as [string, string];
    }
  }

  pathOf(uuid: string) {
    let path = "";
    assetManager.bundles.find((ab) => {
      // @ts-ignore
      return ab.config.assetInfos.find((cfg: any) => {
        if (cfg.uuid === uuid) {
          path = cfg.path;
          return true;
        }
        return false;
      });
    });
    return path;
  }

  uuidOf(path: string) {
    let uuid = "";
    assetManager.bundles.find((bun) => {
      // @ts-ignore
      return bun.config.assetInfos.find((cfg: any) => {
        if (cfg.path === path) {
          uuid = cfg.uuid;
          return true;
        }
        return false;
      });
    });
    return uuid;
  }

  hasAB(ab: string): boolean {
    return (
      assetManager.bundles.has(ab) ||
      (<any>assetManager)._projectBundles.includes(ab)
    );
  }

  loadAB(ab: string) {
    return new Promise<AssetManager.Bundle | null>((resolve) => {
      if (!this.hasAB(ab)) {
        ioc.logcat.res.ef("资源: AB 包不存在 {0}", ab);
        resolve(null);
      } else {
        const bun = assetManager.getBundle(ab);
        if (bun) {
          resolve(bun);
        } else {
          assetManager.loadBundle(ab, (err, bun) => {
            if (err) {
              ioc.logcat.res.ef("资源: AB 包加载失败 {0}", err);
              resolve(null);
            } else {
              resolve(bun);
            }
          });
        }
      }
    });
  }

  unloadAB(ab: string, releaseAll: boolean = false) {
    const bun = assetManager.getBundle(ab);
    if (bun) {
      if (releaseAll) {
        bun.releaseAll();
      }
    }
  }

  hasRes(path: string) {
    return new Promise<boolean>(async (resolve) => {
      const [ab, raw] = this.parsePath(path);
      const bun = await this.loadAB(ab);
      if (bun) {
        const info = bun.getInfoWithPath(raw);
        resolve(info == null ? false : true);
      } else {
        resolve(false);
      }
    });
  }

  preloadRes<T extends Asset>(type: Constructor<T>, path: string) {
    return new Promise<boolean>(async (resolve) => {
      const [ab, raw] = this.parsePath(path);
      const bun = await this.loadAB(ab);
      if (bun) {
        let url = raw;
        const typeName = js.getClassName(type);
        if (typeName === "cc.SpriteFrame") {
          url += "/spriteFrame";
        } else if (typeName === "cc.Texture2D") {
          url += "/texture";
        }
        const info = bun.getInfoWithPath(url, type);
        if (info) {
          bun.preload(url, type, (err, data) => {
            resolve(err ? false : true);
          });
        }
      }
    });
  }

  loadRes<T extends Asset>(type: Constructor<T>, path: string) {
    return new Promise<T | null>(async (resolve) => {
      const [ab, raw] = this.parsePath(path);
      const bun = await this.loadAB(ab);
      if (bun) {
        let url = raw;
        const typeName = js.getClassName(type);
        if (typeName === "cc.SpriteFrame") {
          url += "/spriteFrame";
        } else if (typeName === "cc.Texture2D") {
          url += "/texture";
        }
        const info = bun.getInfoWithPath(url, type);
        if (info) {
          bun.load(url, type, (err, res) => {
            if (err) {
              ioc.logcat.res.ef("资源: 加载失败 {0}@{1}", ab, url);
              resolve(null);
            } else {
              resolve(res);
            }
          });
        } else {
          ioc.logcat.res.ef("资源: 加载失败 {0}@{1}", ab, url);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  }

  loadImage(path: string) {
    return this.loadRes<ImageAsset>(ImageAsset, path);
  }

  loadTexture(path: string) {
    return this.loadRes(Texture2D, path);
  }

  loadSpriteFrame(path: string) {
    return this.loadRes(SpriteFrame, path);
  }

  loadAtlas(path: string) {
    return this.loadRes(SpriteAtlas, path);
  }

  loadPrefab(path: string) {
    return this.loadRes(Prefab, path);
  }

  loadText(path: string) {
    return this.loadRes(TextAsset, path);
  }

  loadJson(path: string) {
    return this.loadRes(JsonAsset, path);
  }

  loadSpine(path: string) {
    return this.loadRes(sp.SkeletonData, path);
  }

  loadFont(path: string) {
    return this.loadRes(Font, path);
  }

  loadBitmapFont(path: string) {
    return this.loadRes(BitmapFont, path);
  }

  loadAudio(path: string) {
    return this.loadRes(AudioClip, path);
  }

  loadParticle(path: string) {
    return this.loadRes(ParticleAsset, path);
  }

  loadTmx(path: string) {
    return this.loadRes(TiledMapAsset, path);
  }

  loadBinary(path: string) {
    return this.loadRes(BufferAsset, path);
  }

  loadVideo(path: string) {
    return this.loadRes(VideoClip, path);
  }

  loadAnimation(path: string) {
    return this.loadRes(AnimationClip, path);
  }
}
