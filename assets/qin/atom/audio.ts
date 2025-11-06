import { AudioClip, AudioSource, Node } from "cc";

import { digit, might, mock, MightResultSync } from "../ability";
import { Triggers } from "../foundation";
import ioc from "../ioc";
import { Loader } from "./loader";

/**
 * 音频模块
 */
@mock.decorator.ccclass("Audio")
@mock.decorator.requireComponent(AudioSource)
export class AudioComponent extends Loader<Node, AudioClip> {
  /** 触发器#播放完成 */
  public readonly onFinish: Triggers = new Triggers();

  /** （暂停时）时间记录点#上次播放时间 */
  protected lastTime: number = 0;

  /** 循环次数 */
  protected _loopCount: number = 0;

  /** 音源 */
  protected get source() {
    return this.getComponent(AudioSource)!;
  }

  protected clearContent(): void {
    if (this.source.clip) {
      this.stop();
      this.source.clip = null;
      this.decRef();
    }
  }

  protected doDeactivate(): void {
    super.doDeactivate();
    this.onFinish.clear();
  }

  protected loadContent(url: string): Promise<AudioClip> {
    return new Promise<AudioClip>((resolve) => {
      const self = this;
      function Handle(res: MightResultSync<AudioClip | null, Error>) {
        const [clip, err] = res;
        if (err) {
          self.recycle();
        }
        resolve(clip as AudioClip);
      }
      if (url.startsWith("@")) {
        const path = url.slice(1);
        might.async(ioc.remote.loadAudio(path)).then(Handle);
      } else {
        const [ab, path] = url.split("@");
        might.async(ioc.res.loadAudio(path, ab)).then(Handle);
      }
    });
  }

  protected doLoadComplete(res: AudioClip): void {
    this.addRef();
    this._content = this.node;
    this._view = this.node;
    this.source.clip = res;
    this.play();
  }

  /** 是否可用 */
  public get available(): boolean {
    return !!this.source.clip && this.source.clip.isValid;
  }

  /** 是否循环 */
  public get loop() {
    return this.source.loop;
  }

  public set loop(v: boolean) {
    this.source.loop = v;
  }

  /** 音量 */
  public get volume() {
    return this.source.volume;
  }

  public set volume(v: number) {
    this.source.volume = v;
  }

  /** 循环次数 */
  public get loopCount() {
    return this._loopCount;
  }

  /** 是否播放中 */
  public get playing() {
    return this.source.playing;
  }

  /** 播放 */
  public play() {
    if (this.available && !this.source.playing) {
      this.source.play();
      this._loopCount = 0;
    }
  }

  /** 暂停 */
  public pause() {
    if (this.available) {
      this.lastTime = this.source.currentTime;
      this.source.pause();
    }
  }

  /** 恢复 */
  public resume() {
    if (this.available && !this.source.playing) {
      this.source.play();
      this.source.currentTime = this.lastTime;
    }
  }

  /** 停止 */
  public stop() {
    if (this.available) {
      this.recycle();
    }
  }

  /** 资源回收 */
  protected recycle() {
    this.lastTime = 0;
    this.source.stop();
    ioc.nodePool.recycle(this.node);
  }

  protected doUpdate(dt: number): void {
    super.doUpdate(dt);
    if (this.available && this.source.playing) {
      if (digit.equals(this.source.currentTime, this.source.duration, 0.02)) {
        this._loopCount++;
        this.onFinish.runWith(this._loopCount);
        if (!this.loop) {
          this.stop();
        }
      }
    }
  }
}
