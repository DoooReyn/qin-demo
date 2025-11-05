import { _decorator } from "cc";
import { IAbility } from "./ability";
import { IKey } from "./dict";

/**
 * 装饰器能力接口
 */
export interface IMock extends IAbility {
  /** 向类注入原型成员 */
  member<C>(key: string | symbol, value: any): (target: C) => C;
  /** 获取类的原型成员 */
  memberOf<V>(target: any, key: IKey): V;
}

/**
 * 装饰器能力实现
 */
export const mock: IMock = {
  name: "Mock",
  description: "装饰器",
  ..._decorator,
  member(key: IKey, val: any) {
    return function (target: any) {
      target.prototype[key] = val;
      return target;
    };
  },
  memberOf<V>(target: any, key: IKey) {
    return target.prototype[key] as V;
  },
};
