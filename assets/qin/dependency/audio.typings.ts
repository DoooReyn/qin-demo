

import { AudioAtom } from "../atom";
import { IDependency } from "./dependency.typings";
import { IPoolNode } from "./pool.typings";

export interface ISound {
  /** 音量缩放系数 */
  volumeScale: number;
  /**
   * 播放音频
   * @param url 地址
   * @param volume 音量
   * @param loop 是否循环
   * @returns 音频模块
   */
  play(url: string, volume?: number, loop?: boolean): AudioAtom;
}

export interface IMusic extends ISound {
  /**
   * 播放音频
   * @param url 地址
   * @param volume 音量
   * @returns 音频模块
   */
  play(url: string, volume?: number): AudioAtom;
}

/**
 * 音频播放器接口
 */
export interface IAudioPlayer extends IDependency {
  /** 音效播放器 */
  readonly sfx: ISound;

  /** 音乐播放器 */
  readonly bgm: IMusic;

  /** 初始化 */
  initialize(): void;
  /**
   * 添加音频模块
   * @description 音频模块停止播放后会自动移除
   * @param mod 音频模块
   */
  add(mod: AudioAtom): void;

  /**
   * 获取一个新的音频模块
   * @returns
   */
  acquire(): IPoolNode;
  /**
   * 暂停所有音频播放
   */
  pauseAll(): void;

  /**
   * 恢复所有音频播放
   */
  resumeAll(): void;

  /**
   * 停止所有音频播放
   */
  stopAll(): void;
}
