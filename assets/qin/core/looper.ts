import { director, System } from "cc";
import { ILooper } from "../typings/looper";
import { Dependency } from "../dependency/dependency";

/**
 * 循环系统
 * - @description 循环系统为框架提供应用级别的循环能力
 */
class LoopSystem extends System {
  /** 更新回调 */
  private __tick: (dt: number) => void;

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

/**
 * 应用循环系统
 * - @description 应用循环系统为框架提供应用级别的循环能力
 */
export class Looper extends Dependency implements ILooper {
  readonly name: string = "Looper";
  readonly description: string = "应用循环系统";

  /** 循环系统 */
  private __system: LoopSystem;

  onAttach(): void {
    super.onAttach();
    this.__system = new LoopSystem();
    director.registerSystem(this.name, this.__system, System.Priority.HIGH);
  }

  onDetach(): void {
    director.unregisterSystem(this.__system);
    this.__system = null;
    super.onDetach();
  }

  /**
   * 设置循环回调
   * @param fn 循环回调
   */
  set loop(fn: (dt: number) => void) {
    this.__system.loop = fn;
  }
}
