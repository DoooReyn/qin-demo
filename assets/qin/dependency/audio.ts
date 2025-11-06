import { Injectable } from "../ioc";
import { IAudioPlayer } from "./audio.typings";
import { Dependency } from "./dependency";

/**
 * 音频播放器
 */
@Injectable({ name: "AudioPlayer" })
export class AudioPlayer extends Dependency implements IAudioPlayer {}
