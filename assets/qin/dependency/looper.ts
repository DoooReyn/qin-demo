import { director, System } from "cc";

import { Dependency } from "../dependency";
import { ioc, Injectable } from "../ioc";
import { ILooper } from "./looper.typings";

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
      ioc.timer.update(dt);
    }
  }
}

/**
 * 应用循环系统
 * @description 应用循环系统为框架提供应用级别的循环能力
 */
@Injectable({ name: "Looper" })
export class Looper extends Dependency implements ILooper {
  /** 循环系统 */
  private __system: LoopSystem;

  onAttach() {
    this.__system = new LoopSystem();
    director.registerSystem(this.meta.name, this.__system, System.Priority.HIGH);
    return super.onAttach();
  }

  onDetach() {
    director.unregisterSystem(this.__system);
    this.__system = null;
    return super.onDetach();
  }

  start() {
    this.__system.running = true;
  }

  pause() {
    this.__system.running = false;
  }
}
