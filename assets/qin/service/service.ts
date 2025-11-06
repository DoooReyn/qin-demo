

/**
 * 服务项基类
 */
export class Service {
  /** 运行状态 */
  protected _running: boolean = true;

  /** 运行状态 */
  get running(): boolean {
    return this._running;
  }
  set running(r: boolean) {
    this._running = r;
  }

  /**
   * 安装服务项
   * @returns
   */
  onAttach(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * 卸载服务项
   * @returns
   */
  onDetach(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * 服务更新
   * @param ms 时间切片
   */
  update(ms: number): void {}
}
