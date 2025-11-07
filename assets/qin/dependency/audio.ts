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
    const mod = audio.acquire(AudioAtom)!;
    mod.volume = this.volumeScale * volume;
    mod.loop = loop;
    mod.url = url;
    mod.type = "sound";
    return mod;
  }
}

/**
 * 音乐播放器
 */
class Music extends Sound {
  /** 上一个背景音乐 */
  private __last: AudioAtom | null = null;

  /**
   * 播放音频
   * @param url 地址
   * @param volume 音量
   * @returns 音频模块
   */
  public override play(url: string, volume: number = 1.0) {
    if (this.__last && this.__last.available && this.__last.url === url) {
      // 已经在播放了
      if (!this.__last.playing) {
        // 已经在播放，但是暂停了，可以恢复播放
        this.__last.resume();
      }
      return this.__last;
    }

    if (this.__last && this.__last.available) {
      // 停止上一个背景音乐
      this.__last.stop();
    }

    this.__last = super.play(url, volume, true);
    this.__last.type = "music";

    return this.__last;
  }
}

/**
 * 音频播放器
 */
@Injectable({ name: "AudioPlayer" })
export class AudioPlayer extends Dependency implements IAudioPlayer {
  /** 音效播放器 */
  public readonly sfx: Sound = new Sound();

  /** 音乐播放器 */
  public readonly bgm: Music = new Music();

  /** 挂载容器 */
  private __container: Node;

  start() {
    this.__container = new Node("AudioPlayer");
    ioc.launcher.root.insertChild(this.__container, 0);

    const [ab, path] = PRESET.PREFAB.AUDIO.split("@");
    might.async(ioc.res.loadPrefab(path, ab)).then((res) => {
      const prefab = res[0];
      if (prefab) {
        ioc.nodePool.register(prefab, 0);
      }
    });
  }

  /**
   * 获取一个新的音频模块
   * @returns
   */
  public acquire() {
    const inst = ioc.nodePool.acquire(PRESET.ITEM_POOL.AUDIO);
    this.__container.addChild(inst!);
    return inst;
  }

  /** 所有音频 */
  private get audioList() {
    return this.__container.listed(AudioAtom, true);
  }

  /** 所有音乐 */
  private get music() {
    return this.audioList.filter((item) => item.type === "music");
  }

  /** 所有音效 */
  private get sound() {
    return this.audioList.filter((item) => item.type === "sound");
  }

  /** 暂停所有音频播放 */
  public pauseAll() {
    this.audioList.forEach((atom) => atom.available && atom.pause());
  }
  /** 暂停所有音乐播放 */
  public pauseMusic() {
    this.music.forEach((atom) => atom.available && atom.pause());
  }

  /** 暂停所有音效播放 */
  public pauseSound() {
    this.sound.forEach((atom) => atom.available && atom.pause());
  }

  /** 恢复所有音频播放 */
  public resumeAll() {
    this.audioList.forEach((atom) => atom.available && atom.resume());
  }

  /** 恢复所有音乐播放 */
  public resumeMusic() {
    this.music.forEach((atom) => atom.available && atom.resume());
  }

  /** 恢复所有音效播放 */
  public resumeSound() {
    this.sound.forEach((atom) => atom.available && atom.resume());
  }

  /** 停止所有音频播放 */
  public stopAll() {
    this.audioList.forEach((atom) => atom.available && atom.stop());
  }

  /** 停止所有音乐播放 */
  public stopMusic() {
    this.music.forEach((atom) => atom.available && atom.stop());
  }

  /** 停止所有音效播放 */
  public stopSound() {
    this.sound.forEach((atom) => atom.available && atom.stop());
  }
}
