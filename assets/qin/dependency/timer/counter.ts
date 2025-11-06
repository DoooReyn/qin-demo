import { ObjectEntry, pool, Triggers } from "../../ability";
import { ICounter } from "../../typings";

/**
 * 计数器
 */
@pool.obEntryOutline("Counter")
export class Counter extends ObjectEntry implements ICounter {
  /** 设定#计次间隔 */
  protected _interval: number = 0;
  /** 设定#计次总数 */
  protected _total: number = 1;
  /** 计时#累计时间 */
  protected _accumulated: number = 0;
  /** 计时#剩余时间 */
  protected _rest: number = 0;
  /** 计时#累计次数 */
  protected _count: number = 0;
  /** 计时#是否完成 */
  protected _done: boolean = false;
  /** 触发器#计次 */
  public onCount: Triggers = new Triggers();
  /** 触发器#按帧计次 */
  public onTick: Triggers = new Triggers();
  /** 触发器#按固定频率计次 */
  public onFixedTick: Triggers = new Triggers();
  /** 触发器#完成 */
  public onDone: Triggers = new Triggers();

  /** 计时#累计次数 */
  public get count() {
    return this._count;
  }

  /** 计时#是否完成 */
  public get done() {
    return this._done;
  }

  /** 设定#计次总数 */
  public get total() {
    return this._total;
  }

  /** 设定#计次间隔 */
  public get interval() {
    return this._interval;
  }

  /** 计时#累计时间 */
  public get accumulated() {
    return this._accumulated;
  }

  public get capacity() {
    return 32;
  }

  public get expires() {
    return 600_000;
  }

  protected _onStart(interval: number = 0, total: number = 1): void {
    this._interval = interval;
    this._total = total;
    this._accumulated = 0;
    this._rest = 0;
    this._count = 0;
    this._done = false;
  }

  protected _onEnded(): void {
    this.onCount.clear();
    this.onTick.clear();
    this.onFixedTick.clear();
    this.onDone.clear();
  }

  /**
   * 累加时间片
   * @param dt 时间片
   */
  public update(dt: number) {
    if (!this._done) {
      this._accumulated += dt;
      this._rest += dt;
      this.onTick.runWith(dt);
      if (this._rest >= this._interval) {
        this._rest -= this._interval;
        this._count++;
        this.onFixedTick.runWith(this._interval);
        this.onCount.runWith(this._count, this._total);
        if (this._total > 0 && this._count >= this._total) {
          this.onDone.run();
          this.recycle();
          this._done = true;
        }
      }
    }
  }
}
