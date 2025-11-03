import { director, System } from "cc";
import { ILooper } from "../typings/looper";

/**
 * 应用循环系统
 * - @description 应用循环系统为框架提供应用级别的循环能力
 */
export class Looper extends System implements ILooper {
  readonly name: string = "Looper";
  readonly description: string = "应用循环系统";

  /** 更新回调 */
  private __tick: (dt: number) => void;

  onAttach(): void {
    this.__tick = null;
    director.registerSystem(this.name, this, System.Priority.HIGH);
  }

  onDetach(): void {
    this.__tick = null;
    director.unregisterSystem(this);
  }

  /**
   * 设置循环回调
   * @param fn 循环回调
   */
  set loop(fn: (dt: number) => void) {
    this.__tick = fn;
  }

  update(dt: number): void {
    super.update(dt);
    this?.__tick?.(dt);
  }
}
