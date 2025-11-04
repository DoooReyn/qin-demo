import { IProxy, IProxyOptions } from "../../typings/proxy";

/**
 * （内部）深层代理
 * @description 提供递归代理嵌套对象的功能
 */
export class DeepProxy<T extends object> implements IProxy<T> {
  /** 代理缓存 */
  private __proxyCache = new WeakMap();
  /** 属性路径缓存 */
  private __pathCache = new WeakMap();
  /** 深层代理配置 */
  private readonly __options: Required<IProxyOptions>;

  /**
   * 深层代理构造
   * @param __target 被代理的对象
   * @param __handler 代理处理器
   * @param options 深层代理配置
   */
  constructor(
    private __target: T,
    private __handler: ProxyHandler<any>,
    options: IProxyOptions = {}
  ) {
    this.__options = {
      proxyArrays: false,
      proxyFunctions: false,
      maxDepth: 10,
      filter: () => true,
      ...options,
    };
  }

  /**
   * 生成深层代理
   * @returns
   */
  public create(): T {
    return this.makeDeepProxy(this.__target, []);
  }

  /**
   * 生成深层代理
   * @param obj 被代理的（属性）对象
   * @param path 属性路径
   * @returns
   */
  private makeDeepProxy(obj: any, path: string[]): any {
    // 检查深度限制
    if (path.length >= this.__options.maxDepth) {
      return obj;
    }

    // 基础类型检查
    if (!this.shouldProxy(obj, path)) {
      return obj;
    }

    // 缓存检查
    if (this.__proxyCache.has(obj)) {
      return this.__proxyCache.get(obj);
    }

    const proxy = new Proxy(obj, {
      get: (target: any, prop: string | symbol, receiver: any) => {
        const value = Reflect.get(target, prop, receiver);
        const newPath = [...path, String(prop)];

        // 递归代理嵌套对象
        if (this.shouldProxy(value, newPath)) {
          const proxiedValue = this.makeDeepProxy(value, newPath);
          this.__pathCache.set(proxiedValue, newPath);
          return proxiedValue;
        }

        // 调用用户处理器
        if (this.__handler.get) {
          return this.__handler.get(target, prop, receiver);
        }

        return value;
      },

      set: (target: any, prop: string | symbol, value: any, receiver: any) => {
        const newPath = [...path, String(prop)];

        // 代理新设置的对象
        if (this.shouldProxy(value, newPath) && !this.isProxied(value)) {
          const proxiedValue = this.makeDeepProxy(value, newPath);
          this.__pathCache.set(proxiedValue, newPath);
        }

        // 调用用户处理器
        if (this.__handler.set) {
          const result = this.__handler.set(target, prop, value, receiver);
          if (result) {
            Reflect.set(target, prop, value, receiver);
          }
          return result;
        }

        return Reflect.set(target, prop, value, receiver);
      },

      deleteProperty: (target: any, prop: string | symbol) => {
        const value = target[prop];
        if (this.__proxyCache.has(value)) {
          const proxiedValue = this.__proxyCache.get(value)!;
          this.__proxyCache.delete(value);
          this.__pathCache.delete(proxiedValue);
        }

        if (this.__handler.deleteProperty) {
          return this.__handler.deleteProperty(target, prop);
        }

        return Reflect.deleteProperty(target, prop);
      },

      // 传递其他处理器
      ...this.__handler,
    });

    // 缓存代理和路径
    this.__proxyCache.set(obj, proxy);
    this.__pathCache.set(proxy, path);

    return proxy;
  }

  /**
   * 检测对象是否需要代理
   * @param obj 对象（属性）
   * @param path 路径
   * @returns
   */
  private shouldProxy(obj: any, path: string[]): boolean {
    // 基础类型检查
    if (typeof obj !== "object" || obj === null) {
      return false;
    }

    // 数组检查
    if (Array.isArray(obj) && !this.__options.proxyArrays) {
      return false;
    }

    // 函数检查
    if (typeof obj === "function" && !this.__options.proxyFunctions) {
      return false;
    }

    // 自定义过滤器
    if (!this.__options.filter(obj, path)) {
      return false;
    }

    return true;
  }

  /** 获取对象在代理中的路径 */
  public getPath(obj: any): string[] | undefined {
    if (this.__proxyCache.has(obj)) {
      return this.__pathCache.get(this.__proxyCache.get(obj));
    }
    return undefined;
  }

  /** 检查对象是否被此深度代理管理 */
  public isProxied(obj: any): boolean {
    return this.__proxyCache.has(obj) || this.__pathCache.has(obj);
  }
}
