import {
  assetManager, js, sp, AnimationClip, Asset, AssetManager, AudioClip, BufferAsset, Font,
  ImageAsset, JsonAsset, ParticleAsset, Prefab, SpriteAtlas, SpriteFrame, Texture2D, TextAsset,
  TiledMapAsset, VideoClip
} from "cc";

import ioc, { Injectable } from "../ioc";
import { Constructor } from "../typings";
import { Dependency } from "./dependency";
import { IResContainer } from "./res.typings";

/**
 * 资源容器
 */
@Injectable({ name: "ResContainer" })
export class ResContainer extends Dependency implements IResContainer {
  pathOf(uuid: string) {
    const bundles = assetManager.bundles;
    let path = "";
    bundles.find((ab) => {
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
    const bundles = assetManager.bundles;
    let uuid = "";
    bundles.find((bun) => {
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
    return assetManager.bundles.has(ab) || (<any>assetManager)._projectBundles.includes(ab);
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
      assetManager.removeBundle(bun);
    }
  }

  hasRes(raw: string, ab: string = "shared") {
    return new Promise<boolean>(async (resolve) => {
      if (raw.indexOf("@") > -1) {
        const [_ab, _raw] = raw.split("@");
        [raw, ab] = [_raw, _ab];
      }
      const bun = await this.loadAB(ab);
      if (bun) {
        const info = bun.getInfoWithPath(raw);
        resolve(info == null ? false : true);
      } else {
        resolve(false);
      }
    });
  }

  loadRes<T extends Asset>(raw: string, type: Constructor<T>, ab: string = "shared") {
    return new Promise<T | null>(async (resolve) => {
      if (raw.indexOf("@") > -1) {
        const [_ab, _raw] = raw.split("@");
        [raw, ab] = [_raw, _ab];
      }
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

  loadImage(raw: string, ab?: string) {
    return this.loadRes<ImageAsset>(raw, ImageAsset, ab);
  }

  loadTexture(raw: string, ab?: string) {
    return this.loadRes(raw, Texture2D, ab);
  }
  loadSpriteFrame(raw: string, ab?: string) {
    return this.loadRes(raw, SpriteFrame, ab);
  }

  loadAtlas(raw: string, ab?: string) {
    return this.loadRes(raw, SpriteAtlas, ab);
  }

  loadPrefab(raw: string, ab?: string) {
    return this.loadRes(raw, Prefab, ab);
  }

  loadText(raw: string, ab?: string) {
    return this.loadRes(raw, TextAsset, ab);
  }

  loadJson(raw: string, ab?: string) {
    return this.loadRes(raw, JsonAsset, ab);
  }

  loadSpine(raw: string, ab?: string) {
    return this.loadRes(raw, sp.SkeletonData, ab);
  }

  loadFont(raw: string, ab?: string) {
    return this.loadRes(raw, Font, ab);
  }

  loadAudio(raw: string, ab?: string) {
    return this.loadRes(raw, AudioClip, ab);
  }

  loadParticle(raw: string, ab?: string) {
    return this.loadRes(raw, ParticleAsset, ab);
  }

  loadTmx(raw: string, ab?: string) {
    return this.loadRes(raw, TiledMapAsset, ab);
  }

  loadBinary(raw: string, ab?: string) {
    return this.loadRes(raw, BufferAsset, ab);
  }

  loadVideo(raw: string, ab?: string) {
    return this.loadRes(raw, VideoClip, ab);
  }

  loadAnimation(raw: string, ab?: string) {
    return this.loadRes(raw, AnimationClip, ab);
  }
}
