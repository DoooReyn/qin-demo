import { Component } from "cc";

import { mock } from "../ability";
import { Triggers } from "../foundation";

/**
 * 原子组件
 */
@mock.decorator.ccclass("Atom")
export class Atom extends Component {
  /** 触发器#开始 */
  public readonly onStart = new Triggers();
  /** 触发器#激活 */
  public readonly onActivate = new Triggers();
  /** 触发器#使能 */
  public readonly onDeactivate = new Triggers();
  /** 触发器#中止 */
  public readonly onEnd = new Triggers();
  /** 触发器#更新 */
  public readonly onUpdate = new Triggers();
  /** 触发器#懒更新 */
  public readonly onLateUpdate = new Triggers();

  /** 注册事件 */
  protected doEventOn(): void {}

  /** 注销事件 */
  protected doEventOff(): void {}

  /** 就绪 */
  protected doReady(): void {}

  /**
   * 内置触发器#初始化
   */
  protected doInit(): void {}

  /**
   * 内置触发器#开始
   */
  protected doStart(): void {}

  /**
   * 内置触发器#使能
   */
  protected doActivate(): void {
    this.doEventOn();
    this.doReady();
  }

  /**
   * 内置触发器#停用
   */
  protected doDeactivate(): void {
    this.doEventOff();
  }

  /**
   * 内置触发器#中止
   */
  protected doEnd(): void {}

  /**
   * 内置触发器#更新
   */
  protected doUpdate(dt: number): void {}

  /**
   * 内置触发器#懒更新
   */
  protected doLateUpdate(dt: number): void {}

  protected onLoad(): void {
    this.onStart.add(this.doStart, this, false);
    this.onActivate.add(this.doActivate, this, false);
    this.onDeactivate.add(this.doDeactivate, this, false);
    this.onEnd.add(this.doEnd, this, true);
    this.onUpdate.add(this.doUpdate, this, false);
    this.onLateUpdate.add(this.doLateUpdate, this, false);
    this.doInit();
  }

  protected start(): void {
    this.onStart.run();
  }

  protected onEnable(): void {
    this.onActivate.run();
  }

  protected onDisable(): void {
    this.onDeactivate.run();
  }

  protected onDestroy(): void {
    this.onEnd.run();
    this.onStart.clear();
    this.onActivate.clear();
    this.onDeactivate.clear();
    this.onUpdate.clear();
    this.onLateUpdate.clear();
    this.onEnd.clear();
  }

  protected update(dt: number): void {
    this.onUpdate.runWith(dt);
  }

  protected lateUpdate(dt: number): void {
    this.onLateUpdate.runWith(dt);
  }
}
