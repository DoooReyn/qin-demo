import { AudioClip } from "cc";

import { ITriggers } from "../foundation";
import { IDependency } from "./dependency.typings";

/**
 * 音频条目接口
 */
export interface IAudioEntry {
  /** 触发器#播放完成 */
  readonly onFinished: ITriggers;
  /** 资源地址 */
  url: string;
  /** 音频条目 ID */
  aid: number;
  /** 音频是否正在播放 */
  get playing(): boolean;
  /** 音频总时长 */
  get duration(): number;
  /** 初始化 */
  init(): void;
  /**
   * 调整音量倍数
   * @param vs 倍数
   */
  zoom(vs: number): void;
  /**
   * 比较两个音频资源切片是否相同
   * @param clip 音频资源切片
   * @returns
   */
  equals(clip: AudioClip): boolean;
  /**
   * 播放音频
   * @param clip 音频资源切片
   * @param volume 音量
   * @param targetVolume 目标音量
   * @param loop 是否循环
   */
  play(clip: AudioClip, volume: number, targetVolume: number, loop?: boolean): void;
  /** 暂停音频 */
  pause(): void;
  /** 恢复音频 */
  resume(): void;
  /** 停止音频 */
  stop(): void;
}

/**
 * 音频条目容器接口
 */
export interface IAudioContainer {
  /** 音量缩放系数 */
  vs: number;
  /**
   * 播放音频
   * @param path 资源路径
   * @param volume 音量
   * @param loop 是否循环
   */
  play(path: string, volume?: number, loop?: boolean): void;
  /**
   * 获取音频播放条目
   * @param id 音频条目 ID
   * @returns
   */
  get(id: number): IAudioEntry;
  /**
   * 是否存在音频播放条目
   * @param id 音频条目 ID
   * @returns
   */
  has(id: number): boolean;
  /**
   * 暂停音频条目
   * @param id 音频条目 ID
   */
  pause(id: number): void;
  /**
   * 恢复音频条目
   * @param id 音频条目 ID
   */
  resume(id: number): void;
  /**
   * 停止音频条目
   * @param id 音频条目 ID
   */
  stop(id: number): void;
  /** 暂停使用音频条目 */
  pauseAll(): void;
  /** 恢复使用音频条目 */
  resumeAll(): void;
  /** 停止使用音频条目 */
  stopAll(): void;
}

/**
 * 音频播放器接口
 */
export interface IAudioPlayer extends IDependency {
  /** 音频条目容器 */
  sound: IAudioContainer;
  /** 音乐条目容器 */
  music: IAudioContainer;

  /** 初始化 */
  start(): void;

  /**
   * 暂停所有音频播放
   */
  pause(): void;

  /** 暂停所有音乐播放 */
  pauseMusic(): void;

  /** 暂停所有音效播放 */
  pauseSound(): void;

  /**
   * 恢复所有音频播放
   */
  resume(): void;

  /** 恢复所有音乐播放 */
  resumeMusic(): void;

  /** 恢复所有音效播放 */
  resumeSound(): void;

  /**
   * 停止所有音频播放
   */
  stop(): void;

  /** 停止所有音乐播放 */
  stopMusic(): void;

  /** 停止所有音效播放 */
  stopSound(): void;
}
