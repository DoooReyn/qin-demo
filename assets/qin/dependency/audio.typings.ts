

import { IDependency } from "./dependency.typings";

export interface ISound {
  /** 音量缩放系数 */
  volumeScale: number;
}

export interface IMusic extends ISound {
}

/**
 * 音频播放器接口
 */
export interface IAudioPlayer extends IDependency {
  /** 初始化 */
  start(): void;
  
  /**
   * 暂停所有音频播放
   */
  pause(): void;

  /**
   * 恢复所有音频播放
   */
  resume(): void;

  /**
   * 停止所有音频播放
   */
  stop(): void;
}
