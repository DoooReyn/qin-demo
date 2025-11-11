import { Component } from "cc";

import { mock } from "../ability";

/**
 * 原子组件
 */
@mock.decorator.ccclass("Atom")
export class Atom extends Component {
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
    this._doInit();
  }

  protected start(): void {
    this._doStart();
  }

  protected onEnable(): void {
    this._doActivate();
  }

  protected onDisable(): void {
    this._doDeactivate();
  }

  protected onDestroy(): void {
    this._doEnd();
  }

  protected update(dt: number): void {
    this._doUpdate(dt);
  }

  protected lateUpdate(dt: number): void {
    this._doLateUpdate(dt);
  }
}
