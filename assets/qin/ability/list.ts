import { IAbility } from "./ability";
import { be } from "./be";
import { IDictionary } from "./dict";
import { random } from "./random";

/**
 * 列表操作能力
 * @description 提供对列表元素的操作方法，如随机打乱、交换元素、提取元素等
 */
export interface IList extends IAbility {
  /**
   * 随机打乱列表元素顺序(实现1)
   * @param arr 要打乱的列表
   * @returns 打乱后的列表
   */
  shuffle1(arr: any[]): any[];
  /**
   * 随机打乱列表元素顺序(实现2)
   * @param arr 要打乱的列表
   * @returns 打乱后的列表
   */
  shuffle2(arr: any[]): any[];
  /**
   * 交换数组中的两个元素
   * @param arr 数组
   * @param n1 索引 1
   * @param n2 索引 2
   */
  swap(arr: any[], n1: number, n2: number): any[];
  /**
   * 提取元素
   * @param arr 数组
   * @param target 目标元素
   * @param match 比较方法
   * @param sequence 是否按顺序输出（默认逆序）
   * @returns
   */
  pickValues(
    arr: any[],
    target: any,
    match: (a: any, b: any) => boolean,
    sequence?: boolean
  ): any[];
  /**
   * 提取元素索引
   * @param arr 数组
   * @param target 目标元素
   * @param compare 比较方法
   * @param sequence 是否按顺序输出（默认逆序）
   * @returns
   */
  pickIndices(
    arr: any[],
    target: any,
    compare: (a: any, b: any) => boolean,
    sequence?: boolean
  ): number[];
  /**
   * 删除指定索引范围内的所有元素
   * @param arr 数组
   * @param indexes 索引数组
   * @param sorted 是否排序过（需要逆向排序）
   */
  removeIndices(arr: any[], indexes: number[], sorted?: boolean): any[];
  /**
   * 数值数组排序
   * @param arr 数值数组
   * @param sequence 是否按顺序输出（默认正序）
   * @returns
   */
  sortIn(arr: number[], sequence?: boolean): number[];
  /**
   * 删除所有元素
   * @param arr 数组
   * @param after 删除回调
   */
  clear(arr: any[], after?: (item: any) => any): void;
  /**
   * 删除所有指定值的元素
   * @param arr 数组
   * @param val 目标值
   * @param reverse 是否逆向删除（默认正向）
   */
  removeOne(arr: any[], val: any, reverse: boolean): void;
  /**
   * 删除指定数量的元素
   * @param arr 数组
   * @param count 数量
   * @param after 删除回调
   */
  removeMany(arr: any[], count: number, after?: (item: any) => any): void;
  /**
   * 触发回调
   * @param trigger 回调触发器
   * @param args 入参
   */
  invoke(trigger: [context: any, callback: Function], ...args: any[]): void;
  /**
   * 保留最小的几个（从小到大排序）
   * @param arr 数组
   * @param count 保留数量
   * @param input 输入值
   */
  keepLeast(arr: number[], count: number, input: number): number[];
  /**
   * 遍历
   * @param arr 列表
   * @param handle 列表项处理方法
   * @param reverse 倒叙遍历
   */
  each<ItemType>(
    arr: ItemType[],
    handle: (v: ItemType, i?: number, l?: ItemType[]) => void,
    reverse?: boolean
  ): void;
  /**
   * 遍历，符合条件（true）时打断
   * @param arr 列表
   * @param handle 列表项处理方法
   * @param reverse 倒序遍历
   */
  until<ItemType>(
    arr: ItemType[],
    handle: (v: ItemType, i?: number, l?: ItemType[]) => boolean,
    reverse?: boolean
  ): void;
  /**
   * 删除所有符合条件的元素
   * @param arr 列表
   * @param match 列表项处理方法
   * @param reverse 倒序遍历
   */
  removeIf<ItemType>(
    arr: ItemType[],
    match: (v: ItemType, i?: number, l?: ItemType[]) => boolean,
    reverse?: boolean
  ): void;
  /**
   * 将列表拆分成多个子列表，每个子列表的最大元素数量为 maxGroupSize
   * @param arr 列表
   * @param maxGroupSize 每个子列表的最大元素数量
   * @returns 拆分后的子列表数组
   */
  split<T>(arr: T[], maxGroupSize?: number): T[][];
  /**
   * 删除列表中的重复元素
   * @param arr 列表
   * @param compare 比较方法
   * @returns 去重后的列表
   */
  removeDuplicates(arr: any[], compare?: (a: any, b: any) => boolean): any[];
  /**
   * 向列表中添加唯一元素
   * @param arr 列表
   * @param item 元素
   * @param compare 比较方法
   */
  addUnique<T>(arr: T[], item: T, compare?: (a: T, b: T) => boolean): void;
  /**
   * 获得指定范围内的数值数组
   * @param start 起始数值
   * @param ended 终止数值
   * @param step 增进步幅
   * @returns
   */
  range(start: number, ended: number, step?: number): number[];
  /**
   * 获得数组中的最小值
   * @param arr 数组
   * @returns 最小值
   */
  min(arr: number[]): number;
  /**
   * 获得数组中的最大值
   * @param arr 数组
   * @returns 最大值
   */
  max(arr: number[]): number;
  /**
   * 获得数组中的平均值
   * @param arr 数组
   * @returns 平均值
   */
  average(arr: number[]): number;
  /**
   * 获得数组中的总和
   * @param arr 数组
   * @returns 总和
   */
  sum(arr: number[]): number;
  /**
   * 获得数组中的乘积
   * @param arr 数组
   * @returns 乘积
   */
  product(arr: number[]): number;
  /**
   * 数组元素正向移动
   * @param arr 数组
   */
  forward(arr: any[]): void;
  /**
   * 数组元素反向移动
   * @param arr 数组
   */
  backward(arr: any[]): void;
  /**
   * 前进/后退 n 步
   * @param arr 数组
   * @param step 步数
   */
  advance(arr: any[], step: number): void;
  /**
   * 数组压缩
   * @param arrays 数组列表
   * @returns 压缩后的数组
   */
  zip(...arrays: any[]): any[];
  /**
   * 数组扁平化
   * @param array 目标数组
   */
  flatten(arr: any[]): any[];
  /**
   * 合并数组
   * @param arrays 数组列表
   * @returns 合并后的数组
   */
  merge(...arrays: any[][]): any[];
  /**
   * 根据给定字典的键值进行分组
   * @param arr 目标数组
   * @param key 键
   * @returns
   */
  groupBy(arr: IDictionary[], key: string): IDictionary;
  /**
   * 频次统计
   * @param arr 目标数组
   * @returns
   */
  frequency(arr: (number | string)[]): IDictionary;
  /**
   * 管道
   * @param fns 函数列表
   * @returns
   */
  pipe<I, F extends (i: I) => I>(...fns: F[]): (i: I) => I;
  /**
   * 反向管道
   * @param fns 函数列表
   * @returns
   */
  compose<I, F extends (i: I) => I>(...fns: F[]): (i: I) => I;
  /**
   * 随机权重
   * @param arr 目标数组
   * @param weighted 权重计算函数
   * @param key 键
   * @returns
   */
  randomWeight<T>(arr: T[], weighted?: (t: T) => number, key?: string): T;
}

/**
 * 列表操作能力实现
 */
export const list: IList = {
  name: "List",
  description: "列表操作能力",
  shuffle1(arr: any[]) {
    let pid = -1;
    let nid = 0;
    let length = arr.length;
    while (++pid < length) {
      nid = random.randomInteger(pid, length);
      [arr[nid], arr[pid]] = [arr[pid], arr[nid]];
    }
    return arr;
  },
  shuffle2(arr: any[]) {
    return arr.sort(() => random.randomOp());
  },
  swap(arr: any[], pid: number, nid: number) {
    [arr[nid], arr[pid]] = [arr[pid], arr[nid]];
    return arr;
  },
  pickValues(
    arr: any[],
    target: any,
    match: (target: any, item: any) => boolean,
    sequence: boolean = false
  ) {
    const ret: any[] = [];
    arr.forEach((v) => {
      if (match(target, v)) {
        sequence ? ret.push(v) : ret.unshift(v);
      }
    });
    return ret;
  },
  pickIndices(
    arr: any[],
    target: any,
    match: (target: any, item: any) => boolean,
    sequence: boolean = false
  ) {
    const ret: number[] = [];
    arr.forEach((v, i) => {
      if (match(target, v)) {
        sequence ? ret.push(i) : ret.unshift(i);
      }
    });
    return ret;
  },
  sortIn(arr: number[], sequence: boolean = true) {
    return arr.sort((a, b) => (sequence ? a - b : b - a));
  },
  removeIndices(arr: any[], indices: number[]) {
    indices = list.sortIn(indices, false);
    indices.forEach((i) => {
      arr.splice(i, 1);
    });
    return arr;
  },
  clear(arr: any[], after?: (item: any) => any) {
    if (after) {
      for (let i = arr.length - 1; i >= 0; i--) {
        after(arr[i]);
        arr.splice(i, 1);
      }
    } else {
      arr.length = 0;
    }
  },
  removeOne(arr: any[], val: any, reverse: boolean = false) {
    const index = reverse ? arr.lastIndexOf(val) : arr.indexOf(val);
    if (index > -1) {
      arr.splice(index, 1);
    }
  },
  removeMany(arr: any[], count: number, after?: (item: any) => any) {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (--count < 0) {
        break;
      }
      after?.(arr[i]);
      arr.splice(i, 1);
    }
  },
  invoke(trigger: [caller: any, callback: Function], ...args: any[]) {
    if (trigger && trigger.length >= 2 && trigger[0] && trigger[1]) {
      trigger[1].apply(trigger[0], args);
    }
  },
  keepLeast(arr: number[], count: number, input: number) {
    if (arr.length < count) {
      arr.push(input);
    } else {
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i] > input) {
          arr[i] = input;
          break;
        }
      }
    }
    return arr.sort((a, b) => a - b).slice(0, count);
  },
  each<ItemType>(
    arr: ItemType[],
    handle: (v: ItemType, i?: number, l?: ItemType[]) => void,
    reverse?: boolean
  ): void {
    const l = arr.length;
    if (l == 0) return;
    reverse ??= false;
    if (reverse) {
      for (let i = l - 1; i >= 0; i--) handle(arr[i], i, arr);
    } else {
      for (let i = 0; i < l; i++) handle(arr[i], i, arr);
    }
  },
  until<ItemType>(
    arr: ItemType[],
    handle: (v: ItemType, i?: number, l?: ItemType[]) => boolean,
    reverse?: boolean
  ): void {
    const l = arr.length;
    if (l == 0) return;
    reverse ??= false;
    if (reverse) {
      for (let i = l - 1; i >= 0; i--)
        if (handle(arr[i], i, arr) === true) break;
    } else {
      for (let i = 0; i < l; i++) if (handle(arr[i], i, arr) === true) break;
    }
  },
  removeIf<ItemType>(
    arr: ItemType[],
    handle: (v: ItemType, i?: number, l?: ItemType[]) => boolean,
    reverse?: boolean
  ): void {
    let l = arr.length;
    if (l == 0) return;
    reverse ??= false;
    if (reverse) {
      for (let i = l - 1; i >= 0; i--)
        if (handle(arr[i], i, arr) === true) arr.splice(i, 1);
    } else {
      for (let i = 0; i < l; i++)
        if (handle(arr[i], i, arr) === true) {
          arr.splice(i, 1);
          i--;
          l--;
        }
    }
  },
  split<T>(arr: T[], maxGroupSize: number = 3): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += maxGroupSize) {
      result.push(arr.slice(i, i + maxGroupSize));
    }
    return result;
  },
  removeDuplicates(arr: any[]): any[] {
    return arr.filter((v, i, a) => a.indexOf(v) === i);
  },
  addUnique(arr: any[], item: any, compare?: (a: any, b: any) => boolean) {
    if (compare) {
      if (arr.findIndex((v) => compare(v, item)) > -1) {
        arr.push(item);
      }
    } else {
      if (arr.indexOf(item) === -1) {
        arr.push(item);
      }
    }
  },
  range(start: number, ended: number, step: number = 1) {
    start = start | 0;
    ended = ended | 0;
    step = step | 0;
    let ret = [];
    if (step > 0) {
      [start, ended] = ended > start ? [start, ended] : [ended, start];
      for (let i = start; i <= ended; i += step) {
        ret.push(i);
      }
    } else if (step === 0) {
      ret.push(start, ended);
    } else {
      [start, ended] = ended > start ? [start, ended] : [ended, start];
      for (let i = ended; i >= start; i += step) {
        ret.push(i);
      }
    }
    return ret;
  },
  min(arr: number[]) {
    return arr.reduce((a, b) => Math.min(a, b), Infinity);
  },
  max(arr: number[]) {
    return arr.reduce((a, b) => Math.max(a, b), -Infinity);
  },
  sum(arr: number[]) {
    return arr.reduce((a, b) => a + b, 0);
  },
  product(arr: number[]) {
    return arr.reduce((a, b) => a * b, 1);
  },
  average(arr: number[]) {
    return list.sum(arr) / arr.length;
  },
  advance(arr: number[], step: number = 1) {
    step = step | 0;
    if (step !== 0 && arr.length > 1) {
      if (step > 0) {
        arr.unshift(...arr.splice(arr.length - step, step));
      } else {
        arr.push(...arr.splice(0, step));
      }
    }
    return arr;
  },
  forward(arr: number[]) {
    return list.advance(arr, 1);
  },
  backward(arr: number[]) {
    return list.advance(arr, -1);
  },
  zip(...arrays: any[][]): any[][] {
    return Array.apply(null, Array(arrays[0].length)).map(function (
      _: any,
      i: number
    ) {
      return arrays.map(function (array) {
        return array[i];
      });
    });
  },
  flatten(arrays: any[][]): any[] {
    return arrays.reduce(
      (a, v) => (Array.isArray(v) ? a.concat(list.flatten(v)) : a.concat(v)),
      []
    );
  },
  merge(...arrays: any[][]): any[] {
    return arrays.reduce((a, v) => a.concat(v), []);
  },
  groupBy(arr: any[], key: string) {
    return arr.reduce((a, v) => {
      (a[v[key]] ||= []).push(v);
      return a;
    }, {});
  },
  frequency(arr: any[]) {
    return arr.reduce((a, v) => {
      a[v] = (a[v] || 0) + 1;
      return a;
    }, {});
  },
  pipe<I, F extends (i: I) => I>(...fns: F[]) {
    return (i: I) => fns.reduce((v, f) => f(v), i);
  },
  compose<I, F extends (i: I) => I>(...fns: F[]) {
    return (i: I) => fns.reduceRight((v, f) => f(v), i);
  },
  randomWeight<T extends IDictionary>(
    arr: T[],
    weighted?: (t: T) => number,
    key: string = "weight"
  ) {
    // 默认权重函数
    weighted ??= (t: T) => (be.dict(t) ? t[key] : 0);
    // 获取权重和
    let total = arr.reduce((a, b) => a + weighted(b), 0);
    const rate = random.random() * total;
    for (let i = 0; i < arr.length; i++) {
      total -= weighted(arr[i]);
      if (total <= rate) {
        return arr[i];
      }
    }
    // 保底
    return arr[arr.length - 1];
  },
};
