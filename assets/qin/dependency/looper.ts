import { director, System } from "cc";

import { Dependency } from "../dependency/dependency";
import { ILooper } from "../typings/looper";
import { ServiceRegistry } from "./service-registry";

/**
 * 循环系统
 * @description 循环系统为框架提供应用级别的循环能力
 */
class LoopSystem extends System {
  /** 运行状态 */
  private __running: boolean = false;

  /** 运行状态 */
  get running() {
    return this.__running;
  }
  set running(r: boolean) {
    this.__running = r;
  }

  update(dt: number): void {
    super.update(dt);
    if (this.__running) {
      ServiceRegistry.Shared.update(dt);
    }
  }
}

/**
 * 应用循环系统
 * @description 应用循环系统为框架提供应用级别的循环能力
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

  start() {
    this.__system.running = true;
  }

  pause() {
    this.__system.running = false;
  }
}
