import { IProxy, IProxyDependency, IProxyOptions } from "../../typings/proxy";
import { DeepProxy } from "./deep-proxy";

/**
 * （外部）深层代理
 * @description 提供创建代理的方法
 */
export class ProxyDependency implements IProxyDependency {
  readonly name: string = "ProxyDependency";
  readonly description: string = "深层代理";
  onAttach(): void {}
  onDetach(): void {}

  public create<T extends object>(
    target: T,
    handler?: ProxyHandler<T>,
    options?: IProxyOptions
  ): {
    proxy: IProxy<T>;
    proxied: T;
  } {
    const proxy = new DeepProxy<T>(target, handler || {}, options);
    const proxied = proxy.create();
    return { proxy, proxied };
  }
}
