import { game, screen, sys, EventTouch, Game, Input } from "cc";

import { digit } from "../ability";
import { Triggers } from "../foundation";
import ioc from "../ioc";
import { PRESET } from "../preset";
import { Atom } from "./atom";

/**
 * 应用入口
 */
export class MainAtom extends Atom {
  /** 触发器#回到前台 */
  public readonly onEnterFG = new Triggers();

  /** 触发器#进入后台 */
  public readonly onEnterBG = new Triggers();

  /** 触发器#进入后台 */
  public readonly onLowMemory = new Triggers();

  /** 触发器#屏幕尺寸变化 */
  public readonly onSizeChanged = new Triggers();

  /** 触发器#屏幕朝向变化 */
  public readonly onOrientationChanged = new Triggers();

  /** 触发器#屏幕点击 */
  public readonly onTapped = new Triggers();

  /** 时间记录点#回调前台 */
  private __timeEnterFG: number = 0;

  /** 时间记录点#进入后台 */
  private __timeEnterBG: number = 0;

  protected _doInit(): void {
    ioc.logcat.qin.d("应用: 初始化");
    game.on(Game.EVENT_SHOW, this._doEnterFG, this);
    game.on(Game.EVENT_HIDE, this._doEnterBG, this);
    game.on(Game.EVENT_LOW_MEMORY, this._doLowMemory, this);
    screen.on(PRESET.EVENT.SCREEN_SIZE_CHANGED, this._doScreenSizeChanged, this);
    screen.on(PRESET.EVENT.SCREEN_FULL_CHANGED, this._doScreenSizeChanged, this);
    screen.on(PRESET.EVENT.SCREEN_ORIENTATION_CHANGED, this._doScreenOrientationChanged, this);
    ioc.timer.shared.loop(PRESET.TIME.LAZY_CLEANUP_S, this._lazyCleanup, this);
    super._doInit();
  }

  /** 懒清理 */
  protected _lazyCleanup(): void {
    ioc.nodePool.lazyCleanup();
    ioc.objPool.lazyCleanup();
  }

  protected _doStart(): void {
    ioc.logcat.qin.d("应用: 启动");
    super._doStart();
  }

  protected _doActivate() {
    ioc.logcat.qin.d("应用: 使能");
    ioc.priorityInput.highest.on(Input.EventType.TOUCH_END, this._doScreenTapped, this);
    super._doActivate();
  }

  protected _doDeactivate() {
    ioc.logcat.qin.d("应用: 停用");
    ioc.priorityInput.highest.off(Input.EventType.TOUCH_END, this._doScreenTapped, this);
    super._doDeactivate();
  }

  protected _doEnd(): void {
    ioc.logcat.qin.d("应用: 中止");
    game.off(Game.EVENT_SHOW, this._doEnterFG, this);
    game.off(Game.EVENT_HIDE, this._doEnterBG, this);
    game.off(Game.EVENT_LOW_MEMORY, this._doLowMemory, this);
    screen.off(PRESET.EVENT.SCREEN_SIZE_CHANGED, this._doScreenSizeChanged, this);
    screen.off(PRESET.EVENT.SCREEN_FULL_CHANGED, this._doScreenSizeChanged, this);
    screen.off(PRESET.EVENT.SCREEN_ORIENTATION_CHANGED, this._doScreenOrientationChanged, this);
    super._doEnd();
  }

  /**
   * 获取从后台返回前台耗时
   * @description 开发者可以根据时长决定是否执行某些操作
   */
  public get Elapsed() {
    return this.__timeEnterFG - this.__timeEnterBG;
  }

  /**
   * 内置触发器#回到前台
   */
  protected _doEnterFG(): void {
    this.__timeEnterFG = sys.now();
    const diff = digit.keepBits((this.__timeEnterFG - this.__timeEnterBG) / 1000, 2);
    ioc.logcat.qin.df("应用: 回到前台，耗时: {0} 秒", diff);
    this.onEnterFG.run();
  }

  /**
   * 内置触发器#进入后台
   */
  protected _doEnterBG(): void {
    this.__timeEnterBG = sys.now();
    ioc.logcat.qin.d("应用: 进入后台");
    this.onEnterBG.run();
  }

  /**
   * 内置触发器#内存警告
   */
  protected _doLowMemory(): void {
    ioc.logcat.qin.d("应用: 内存不足");
    this.onLowMemory.run();
  }

  /**
   * 内置触发器#窗口尺寸变化
   */
  protected _doScreenSizeChanged(width: number, height: number): void {
    ioc.logcat.qin.d("应用: 屏幕尺寸改变", width, height);
    this.onSizeChanged.runWith(width, height);
  }

  /**
   * 内置触发器#屏幕朝向变化
   */
  protected _doScreenOrientationChanged(orientation: number): void {
    ioc.logcat.qin.d("应用: 屏幕方向改变", orientation);
    this.onOrientationChanged.runWith(orientation);
  }

  /**
   * 内置触发器#屏幕被点击
   * @param touch
   */
  protected _doScreenTapped(touch: EventTouch): void {
    ioc.logcat.qin.d("应用: 屏幕点击", touch);
    this.onTapped.runWith(touch);
  }
}
