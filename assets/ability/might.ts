import { IAbility } from "./ability";

/** 正常返回值类型 */
export type MightOk<Data> = Readonly<[Data, null]>;

/** 异常返回值类型 */
export type MightBad<Err> = Readonly<[null, Err]>;

/** 同步返回值类型 */
export type MightResultSync<Data, Err> = MightOk<Data> | MightBad<Err>;

/** 异步返回值类型 */
export type MightResultAsync<Data, Err> = Promise<
  MightOk<Data> | MightBad<Err>
>;

/**
 * 异常捕获能力接口
 * @description 提供同步和异步异常捕获能力
 */
export interface IMight extends IAbility {
  sync<D, E = Error>(
    task: (...args: any[]) => D,
    context?: any,
    ...args: any[]
  ): MightResultSync<D, E>;
  async<D, E = Error>(task: Promise<D>): MightResultAsync<D, E>;
}

/**
 * 异常捕获能力实现
 */
export const might: IMight = {
  name: "Might",
  description: "异常捕获能力",
  sync<D, E = Error>(
    task: (...args: any[]) => D,
    context?: any,
    ...args: any[]
  ): MightResultSync<D, E> {
    try {
      const res = task.apply(context || this.ctx, args);
      return [res, null];
    } catch (err) {
      return [null, err as E];
    }
  },
  async async<D, E = Error>(task: Promise<D>): MightResultAsync<D, E> {
    try {
      const res = await task;
      return [res, null];
    } catch (err) {
      return [null, err as E];
    }
  },
};
