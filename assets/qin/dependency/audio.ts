import { AudioClip, AudioSource, Node } from "cc";

import { digit, regexp } from "../ability";
import { Triggers } from "../foundation";
import ioc, { Injectable } from "../ioc";
import { IAudioPlayer } from "./audio.typings";
import { Dependency } from "./dependency";

abstract class AudioContainer extends Node {
  protected _container: Map<number, AudioEntry> = new Map();

  private __vs: number = 1.0;
  public get vs(): number {
    return this.__vs;
  }
  public set vs(v: number) {
    v = digit.clamp01(v);
    if (v == this.__vs) {
      this.__vs = v;
      this._container.forEach((entry) => entry.zoom(v));
    }
  }

  play(path: string, volume?: number, loop?: boolean) {
    ioc.loader.load(AudioClip, { path }).then((clip) => {
      if (clip) {
        ioc.cache.addRef(path);
        const id = this._play(clip, volume, loop);
        this.get(id)!.url = path;
      }
    });
  }

  protected abstract _play(
    clip: AudioClip,
    volume?: number,
    loop?: boolean,
  ): number;

  get(id: number) {
    return this._container.get(id);
  }

  has(id: number) {
    return this._container.has(id);
  }

  pause(id: number) {
    this.get(id)?.pause();
  }

  resume(id: number) {
    this.get(id)?.resume();
  }

  stop(id: number) {
    this.get(id)?.stop();
    this._container.delete(id);
  }

  pauseAll() {
    this._container.forEach((atom) => atom.isValid && atom.pause());
  }

  resumeAll() {
    this._container.forEach((atom) => atom.isValid && atom.resume());
  }

  stopAll() {
    this._container.forEach((atom) => atom.isValid && atom.stop());
    this._container.clear();
  }
}

class SoundContainer extends AudioContainer {
  protected _play(clip: AudioClip, volume?: number, loop?: boolean): number {
    // 播放音效时，始终获取一个新的音频实例
    volume ??= 1.0;
    const id = ioc.incremental.next("sound");
    const inst = ioc.nodePool.acquire<AudioEntry>("audio-entry");
    inst.aid = id;
    this._container.set(id, inst);
    this.insertChild(inst, 0);
    inst.init();
    inst.play(clip, volume, volume * this.vs, loop);

    return id;
  }
}

class MusicContainer extends AudioContainer {
  private __last: number;

  protected _play(clip: AudioClip, volume?: number): number {
    // 播放音乐时，需要检查上一个音频实例
    if (this.__last != undefined) {
      const last = this.get(this.__last);
      if (last.equals(clip)) {
        // 如果是同一首音乐，直接返回上次的ID
        return last.aid;
      } else {
        // 停止上次播放的音乐
        last.stop();
      }
    }

    // 播放新音乐
    volume ??= 1.0;
    const id = ioc.incremental.next("music");
    const inst = ioc.nodePool.acquire<AudioEntry>("audio-entry");
    inst.aid = id;
    this._container.set(id, inst);
    this.insertChild(inst, 0);
    inst.init();
    inst.play(clip, volume, volume * this.vs, true);
    this.__last = id;

    return id;
  }
}

class AudioEntry extends Node {
  private __source: AudioSource;
  private __pauseAt: number = 0;
  private __aid: number = 0;
  private __loopCount: number = 0;
  private __volume: number = 1.0;
  private __url: string;
  public readonly onFinished: Triggers = new Triggers();

  constructor() {
    super();
    this.__source = this.addComponent(AudioSource);
  }

  get url() {
    return this.__url;
  }

  set url(value: string) {
    this.__url = value;
  }

  init() {
    this.__pauseAt = 0;
    this.__loopCount = 0;
    this.__volume = 1.0;
    this.__source.schedule(this._onUpdate.bind(this));
  }

  zoom(vs: number) {
    this.__volume *= vs;
    this.__source.volume = this.__volume;
  }

  equals(clip: AudioClip) {
    return (
      this.__source && this.__source.isValid && this.__source.clip === clip
    );
  }

  get aid() {
    return this.__aid;
  }

  set aid(v: number) {
    this.__aid = v;
  }

  get playing() {
    return this.__source.playing;
  }

  get duration() {
    return this.__source.duration;
  }

  play(
    clip: AudioClip,
    volume: number,
    targetVolume: number,
    loop: boolean = false,
  ) {
    this.__volume = volume;
    this.__source.clip = clip;
    this.__source.volume = targetVolume;
    this.__source.loop = loop;
    this.__source.play();
  }

  pause() {
    this.__source.pause();
    this.__pauseAt = this.__source.currentTime;
  }

  resume() {
    if (this.__pauseAt > 0) {
      this.__source.currentTime = this.__pauseAt;
      this.__pauseAt = 0;
    }
    this.__source.play();
  }

  stop() {
    this.__aid = 0;
    this.__pauseAt = 0;
    this.__loopCount = 0;
    ioc.cache.decRef(this.url);
    this.__url = "";
    this.__source.stop();
    this.__source.unscheduleAllCallbacks();
    this.onFinished.clear();
    ioc.nodePool.recycle(this);
  }

  protected _onUpdate() {
    if (this.__source.playing) {
      if (
        digit.equals(this.__source.currentTime, this.__source.duration, 0.02)
      ) {
        this.__loopCount++;
        this.onFinished.runWith(this.__loopCount);
        if (!this.__source.loop) {
          this.stop();
        }
      }
    }
  }
}

/**
 * 音频播放器
 */
@Injectable({ name: "AudioPlayer" })
export class AudioPlayer extends Dependency implements IAudioPlayer {
  public sound: SoundContainer;
  public music: MusicContainer;

  start() {
    ioc.nodePool.registerByNodeConstructor("audio-entry", AudioEntry);
    this.sound = new SoundContainer();
    this.music = new MusicContainer();
    this.sound.name = "sound-player";
    this.music.name = "music-player";
    ioc.launcher.root.insertChild(this.sound, 0);
    ioc.launcher.root.insertChild(this.music, 0);
  }

  /** 暂停所有音频播放 */
  public pause() {
    this.pauseSound();
    this.pauseMusic();
  }

  /** 暂停所有音乐播放 */
  public pauseMusic() {
    this.music.pauseAll();
  }

  /** 暂停所有音效播放 */
  public pauseSound() {
    this.sound.pauseAll();
  }

  /** 恢复所有音频播放 */
  public resume() {
    this.resumeSound();
    this.resumeMusic();
  }

  /** 恢复所有音乐播放 */
  public resumeMusic() {
    this.music.resumeAll();
  }

  /** 恢复所有音效播放 */
  public resumeSound() {
    this.sound.resumeAll();
  }

  /** 停止所有音频播放 */
  public stop() {
    this.stopSound();
    this.stopMusic();
  }

  /** 停止所有音乐播放 */
  public stopMusic() {
    this.music.stopAll();
  }

  /** 停止所有音效播放 */
  public stopSound() {
    this.sound.stopAll();
  }
}
