import { Node } from "cc";

import { might } from "../ability";
import { AudioAtom } from "../atom";
import ioc, { Injectable } from "../ioc";
import { PRESET } from "../preset";
import { IAudioPlayer, ISound } from "./audio.typings";
import { Dependency } from "./dependency";

/**
 * 音效播放器
 */
class Sound implements ISound {
  /** 音量缩放系数 */
  private _volumeScale: number = 1;
  /** 音量缩放系数 */
  public get volumeScale() {
    return this._volumeScale;
  }
  public set volumeScale(v: number) {
    this._volumeScale = v;
  }

  /**
   * 播放音频
   * @param url 地址
   * @param volume 音量
   * @param loop 是否循环
   * @returns 音频模块
   */
  public play(url: string, volume: number = 1.0, loop: boolean = false) {
    const audio = ioc.audio.acquire()!;
    ioc.root.addChild(audio);
    const mod = audio.acquire(AudioAtom)!;
    mod.volume = this.volumeScale * volume;
    mod.loop = loop;
    mod.url = url;
    ioc.audio.add(mod);
    return mod;
  }
}

/**
 * 音乐播放器
 */
class Music extends Sound {
  /** 上一个背景音乐 */
  private last: AudioAtom | null = null;

  /**
   * 播放音频
   * @param url 地址
   * @param volume 音量
   * @returns 音频模块
   */
  public override play(url: string, volume: number = 1.0) {
    if (this.last && this.last.available && this.last.url === url) {
      // 已经在播放了
      if (!this.last.playing) {
        // 已经在播放，但是暂停了，可以恢复播放
        this.last.resume();
      }
      return this.last;
    }

    if (this.last && this.last.available) {
      // 停止上一个背景音乐
      this.last.stop();
    }

    this.last = super.play(url, volume, true);

    return this.last;
  }
}

/**
 * 音频播放器
 */
@Injectable({ name: "AudioPlayer" })
export class AudioPlayer extends Dependency implements IAudioPlayer {
  /** 音频模块列表 */
  private readonly __container: AudioAtom[] = [];

  /** 音效播放器 */
  public readonly sfx: Sound = new Sound();

  /** 音乐播放器 */
  public readonly bgm: Music = new Music();

  initialize() {
    const [ab, path] = PRESET.PREFAB.AUDIO.split("@");
    might.async(ioc.res.loadPrefab(path, ab)).then((res) => {
      const prefab = res[0];
      if (prefab) {
        ioc.nodePool.register(prefab, 0);
      }
    });
    ioc.root.on(
      Node.EventType.CHILD_REMOVED,
      (item: Node) => {
        if (item.listed(AudioAtom, false).length > 0) {
          const mod = item.acquire(AudioAtom)!;
          const index = this.__container.indexOf(mod);
          if (index >= 0) {
            this.__container.splice(index, 1);
          }
        }
      },
      this
    );
  }

  /**
   * 添加音频模块
   * @description 音频模块停止播放后会自动移除
   * @param mod 音频模块
   */
  public add(mod: AudioAtom) {
    if (this.__container.indexOf(mod) < 0) {
      this.__container.push(mod);
    }
  }

  /**
   * 获取一个新的音频模块
   * @returns
   */
  public acquire() {
    return ioc.nodePool.acquire(PRESET.ITEM_POOL.AUDIO);
  }

  /**
   * 暂停所有音频播放
   */
  public pauseAll() {
    this.__container.forEach((item) => {
      if (item.available) {
        item.pause();
      }
    });
  }

  /**
   * 恢复所有音频播放
   */
  public resumeAll() {
    this.__container.forEach((item) => {
      if (item.available) {
        item.resume();
      }
    });
  }

  /**
   * 停止所有音频播放
   */
  public stopAll() {
    this.__container.forEach((item) => {
      if (item.available) {
        item.stop();
      }
    });
  }
}
