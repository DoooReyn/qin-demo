import { Dependency } from "./dependency";
import { IService } from "../typings/service";
import { IServiceRegistry } from "../typings/service-registry";
import { logcat } from "../ability";

/**
 * 服务注册器
 * @description 服务注册器用于管理和注册应用程序中的服务
 */
export class ServiceRegistry extends Dependency implements IServiceRegistry {
  readonly name: string = "ServiceRegistry";
  readonly description: string = "服务注册管理";

  onDetach(): void {
    this.destroy()
      .then(() => {
        this.__container.clear();
      })
      .catch((err) => {
        logcat.qin.e("服务注销失败：", err);
      });
    super.onDetach();
  }

  /** 服务容器 */
  private __container: Map<string, IService> = new Map();

  /** 服务注册时回调 */
  private __onRegistered: (svr: IService) => void;

  /** 设置服务注册时回调 */
  set onRegistered(callback: (svr: IService) => void) {
    this.__onRegistered = callback;
  }

  /**
   * 注册服务
   * @param svr 服务
   */
  register(svr: IService): void {
    if (this.__container.has(svr.name)) {
      throw new Error(`服务 ${svr.name} 已注册.`);
    }
    this.__container.set(svr.name, svr);
    this.__onRegistered?.(svr);
  }

  /**
   * 注销服务
   * @param svr 服务
   */
  async unregister(svr: IService | string): Promise<void> {
    if (typeof svr === "string") {
      svr = this.__container.get(svr) as IService;
    }
    if (svr && this.__container.has(svr.name)) {
      await svr.uninstall();
      this.__container.delete(svr.name);
    }
  }

  /**
   * 是否存在服务
   * @param name 服务名称
   * @returns 是否存在
   */
  has(name: string): boolean {
    return this.__container.has(name);
  }

  /**
   * 获取服务
   * @param name 服务名称
   * @returns 服务实例
   */
  resolve<T extends IService>(name: string): T | undefined {
    return this.__container.get(name) as T;
  }

  /**
   * 初始化所有服务
   */
  async init() {
    for (let [_, svr] of this.__container) {
      await svr.install();
    }
  }

  /**
   * 注销所有服务
   */
  async destroy() {
    // 反向注销服务，确保先注册的后注销
    const services = Array.from(this.__container.entries()).reverse();
    for (let [_, svr] of services) {
      await svr.uninstall();
    }
  }

  /**
   * 更新所有服务
   * @param dt 时间间隔
   */
  update(dt: number): void {
    for (let [_, svr] of this.__container) {
      svr.update(dt);
    }
  }
}
