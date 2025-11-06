import { Dependency } from "../dependency";
import { ITimer } from "../../typings";
import { Tick } from "./tick";

/**
 * 定时器服务
 * @description 定时器服务类实现了定时器服务接口，提供了定时器的安装、卸载和更新功能
 */
export class Timer extends Dependency implements ITimer {
  readonly name: string = "Timer";
  readonly description: string = "定时器服务";

  /** 定时器容器 */
  private readonly __container: Map<string, Tick> = new Map();

  onDetach(): Promise<void> {
    this.stop();
    return super.onDetach();
  }

  /**
   * 获取定时器
   * @param key 定时器标识
   */
  public acquire(key: string) {
    let tick = this.__container.get(key);
    if (!tick) {
      tick = new Tick();
      this.__container.set(key, tick);
    }
    return tick;
  }

  /**
   * 获取应用级定时器
   * - 一般的，不应对此定时器调速
   */
  public get app() {
    return this.acquire("app");
  }

  /**
   * 获取共享定时器
   * - 一般的，不应对此定时器调速
   */
  public get shared() {
    return this.acquire("shared");
  }

  /**
   * 获取通用可变速定时器
   * - 一般的，此定时器用于需要变速的环境
   */
  public get varying() {
    return this.acquire("varying");
  }

  /**
   * 暂停所有定时器（不包括 Director）
   */
  public pause() {
    this.__container.forEach((tick) => tick.pause());
  }

  /**
   * 恢复所有定时器（不包括 Director）
   */
  public resume() {
    this.__container.forEach((tick) => tick.run());
  }

  /**
   * 停止（清除）所有定时器
   */
  public stop() {
    this.pause();
    this.__container.forEach((tick) => tick.stop());
    this.__container.clear();
  }

  /**
   * 更新所有定时器
   * @param dt 时间片
   */
  public update(dt: number) {
    this.__container.forEach((tick) => tick.update(dt));
  }
}
