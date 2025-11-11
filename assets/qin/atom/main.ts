import { game, screen, EventTouch, Game, Input } from "cc";

import { digit, time } from "../ability";
import ioc from "../ioc";
import { PRESET } from "../preset";
import { Atom } from "./atom";

/**
 * 应用入口
 */
export class MainAtom extends Atom {
  /** 时间记录点#回调前台 */
  private __timeEnterFG: number = 0;

  /** 时间记录点#进入后台 */
  private __timeEnterBG: number = 0;

  /** 定时器#清理 */
  private __timerForCleanup: number = -1;

  protected _doInit(): void {
    ioc.logcat.qin.d("应用: 初始化");
    game.on(Game.EVENT_SHOW, this._doEnterFG, this);
    game.on(Game.EVENT_HIDE, this._doEnterBG, this);
    game.on(Game.EVENT_LOW_MEMORY, this._doLowMemory, this);
    screen.on(PRESET.EVENT.APP_SCREEN_SIZE_CHANGED, this._doScreenSizeChanged, this);
    screen.on(PRESET.EVENT.APP_SCREEN_FULL_CHANGED, this._doScreenSizeChanged, this);
    screen.on(PRESET.EVENT.APP_SCREEN_ORIENTATION_CHANGED, this._doScreenOrientationChanged, this);
    super._doInit();
  }

  /** 懒清理 */
  protected _lazyCleanup(): void {
    ioc.nodePool.lazyCleanup();
    ioc.objPool.lazyCleanup();
  }

  protected _doActivate() {
    ioc.logcat.qin.d("应用: 使能");
    ioc.priorityInput.highest.on(Input.EventType.TOUCH_END, this._doScreenTapped, this);
    const timer = ioc.timer.shared.loop(PRESET.TIME.LAZY_CLEANUP_S, this._lazyCleanup, this);
    this.__timerForCleanup = timer.cid;
    super._doActivate();
  }

  protected _doDeactivate() {
    ioc.logcat.qin.d("应用: 停用");
    ioc.timer.shared.del(this.__timerForCleanup);
    ioc.priorityInput.highest.off(Input.EventType.TOUCH_END, this._doScreenTapped, this);
    this.__timerForCleanup = -1;
    super._doDeactivate();
  }

  protected _doEnd(): void {
    ioc.logcat.qin.d("应用: 中止");
    game.off(Game.EVENT_SHOW, this._doEnterFG, this);
    game.off(Game.EVENT_HIDE, this._doEnterBG, this);
    game.off(Game.EVENT_LOW_MEMORY, this._doLowMemory, this);
    screen.off(PRESET.EVENT.APP_SCREEN_SIZE_CHANGED, this._doScreenSizeChanged, this);
    screen.off(PRESET.EVENT.APP_SCREEN_FULL_CHANGED, this._doScreenSizeChanged, this);
    screen.off(PRESET.EVENT.APP_SCREEN_ORIENTATION_CHANGED, this._doScreenOrientationChanged, this);
    super._doEnd();
  }

  /**
   * 获取从后台返回前台耗时
   * @description 开发者可以根据时长决定是否执行某些操作
   */
  public get elapsed() {
    return this.__timeEnterFG - this.__timeEnterBG;
  }

  /**
   * 回到前台
   */
  protected _doEnterFG(): void {
    this.__timeEnterFG = time.now;
    const diff = digit.keepBits((this.__timeEnterFG - this.__timeEnterBG) / 1000, 2);
    ioc.logcat.qin.df("应用: 回到前台，耗时: {0} 秒", diff);
    ioc.eventBus.app.publish(PRESET.EVENT.APP_ENTER_FOREGROUND);
  }

  /**
   * 进入后台
   */
  protected _doEnterBG(): void {
    this.__timeEnterBG = time.now;
    ioc.logcat.qin.d("应用: 进入后台");
    ioc.eventBus.app.publish(PRESET.EVENT.APP_ENTER_BACKGROUND);
  }

  /**
   * 内存警告
   */
  protected _doLowMemory(): void {
    ioc.logcat.qin.d("应用: 内存不足");
    ioc.eventBus.app.publish(PRESET.EVENT.APP_LOW_MEMORY);
  }

  /**
   * 窗口尺寸变化
   */
  protected _doScreenSizeChanged(width: number, height: number): void {
    ioc.logcat.qin.d("应用: 屏幕尺寸改变", width, height);
    ioc.eventBus.gui.publish(PRESET.EVENT.APP_SCREEN_SIZE_CHANGED, width, height);
  }

  /**
   * 屏幕朝向变化
   */
  protected _doScreenOrientationChanged(orientation: number): void {
    ioc.logcat.qin.d("应用: 屏幕方向改变", orientation);
    ioc.eventBus.app.publish(PRESET.EVENT.APP_SCREEN_ORIENTATION_CHANGED, orientation);
  }

  /**
   * 屏幕被点击
   * @param touch
   */
  protected _doScreenTapped(touch: EventTouch): void {
    ioc.logcat.qin.d("应用: 屏幕点击", touch);
    ioc.eventBus.app.publish(PRESET.EVENT.APP_SCREEN_TAPPED, touch);
  }
}
