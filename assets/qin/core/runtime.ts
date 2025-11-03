import { director, System } from "cc";
import { IDependency } from "../typings/dependency";

/**
 * 应用运行时系统
 * - @description 应用运行时系统为框架提供应用级别的运行时能力
 */
export class Runtime extends System implements IDependency {
  readonly name: string = "Runtime";
  readonly description: string = "应用运行时系统";

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
   * 设置更新回调
   * @param fn 更新回调
   */
  set tick(fn: (dt: number) => void) {
    this.__tick = fn;
  }

  update(dt: number): void {
    super.update(dt);
    this?.__tick?.(dt);
  }
}
