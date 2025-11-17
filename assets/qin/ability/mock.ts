import { _decorator } from "cc";

import { IAbility } from "./ability";
import { IKey } from "./dict";

/**
 * 装饰器能力接口
 */
export interface IMock extends IAbility {
  /** ccc 装饰器集合 */
  decorator: typeof _decorator;
  /** 向类注入原型成员 */
  member<C>(key: string | symbol, value: any): (target: C) => C;
  /** 获取类的原型成员 */
  memberOf<V>(target: any, key: IKey): V;
  /** 记录方法执行耗时 */
  logExecutionTime(tag: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
}

/**
 * 装饰器能力实现
 */
export const mock: IMock = {
  name: "Mock",
  description: "装饰器",
  decorator: _decorator,
  member(key: IKey, val: any) {
    return function (target: any) {
      target.prototype[key] = val;
      return target;
    };
  },
  memberOf<V>(target: any, key: IKey) {
    return target.prototype[key] as V;
  },
  // 装饰器工厂函数 - 接收参数并返回真正的装饰器
  logExecutionTime(tag: string) {
    // 返回实际的方法装饰器
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = function (...args: any[]) {
        const start = performance.now();

        try {
          const result = originalMethod.apply(this, args);

          if (result instanceof Promise) {
            return result.then((data) => {
              const end = performance.now();
              console.log(`[${tag}] 异步方法执行耗时: ${(end - start).toFixed(3)}ms`);
              return data;
            });
          } else {
            const end = performance.now();
            console.log(`[${tag}] 同步方法执行耗时: ${(end - start).toFixed(3)}ms`);
            return result;
          }
        } catch (error) {
          console.error(`[${tag}] 方法执行出错:`, error);
          throw error;
        }
      };

      return descriptor;
    };
  },
};
