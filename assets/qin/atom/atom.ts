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
  protected _doEventOn(): void {}

  /** 注销事件 */
  protected _doEventOff(): void {}

  /** 就绪 */
  protected _doReady(): void {}

  /**
   * 内置触发器#初始化
   */
  protected _doInit(): void {}

  /**
   * 内置触发器#开始
   */
  protected _doStart(): void {}

  /**
   * 内置触发器#使能
   */
  protected _doActivate(): void {
    this._doEventOn();
    this._doReady();
  }

  /**
   * 内置触发器#停用
   */
  protected _doDeactivate(): void {
    this._doEventOff();
  }

  /**
   * 内置触发器#中止
   */
  protected _doEnd(): void {}

  /**
   * 内置触发器#更新
   */
  protected _doUpdate(dt: number): void {}

  /**
   * 内置触发器#懒更新
   */
  protected _doLateUpdate(dt: number): void {}

  protected onLoad(): void {
    this.onStart.add(this._doStart, this, false);
    this.onActivate.add(this._doActivate, this, false);
    this.onDeactivate.add(this._doDeactivate, this, false);
    this.onEnd.add(this._doEnd, this, true);
    this.onUpdate.add(this._doUpdate, this, false);
    this.onLateUpdate.add(this._doLateUpdate, this, false);
    this._doInit();
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
