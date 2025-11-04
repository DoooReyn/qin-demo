import { IAbility } from "./ability";

/** 
 * 数字能力接口
 * @description 提供对数字进行校验、计算和操作的方法
 */
export interface IDigit extends IAbility {
  /** 校验数字是否有效 */
  valid(d: number): boolean;
  /** 校验数字是否为有限大 */
  finite(d: number): boolean;
  /** 校验数字是否为无限大 */
  infinite(d: number): boolean;
  /** 校验数字是否为负数 */
  negative(d: number): boolean;
  /** 校验数字是否为非负数 */
  positive(d: number): boolean;
  /** 四舍五入取整 */
  round(d: number): number;
  /** 向下取整 */
  floor(d: number): number;
  /** 向上取整 */
  ceil(d: number): number;
  /** 取绝对值 */
  abs(d: number): number;
  /** 校验数字是否为整数 */
  integer(d: number): boolean;
  /** 获取数字的小数部分 */
  decimal(d: number): number;
  /** 计算数字的乘方 */
  pow(d: number, p: number): number;
  /** 计算数字的平方根 */
  sqrt(d: number): number;
  /** 限制数字在指定范围内 */
  clamp(d: number, min: number, max: number): number;
  /** 校验数字是否近似等于另一个数字 */
  equals(d: number, e: number, tolerance?: number): boolean;
  /** 获取数字的符号 */
  sign(d: number): number;
  /** 计算数字的和 */
  sum(...arr: number[]): number;
  /** 计算数字的平均值 */
  average(...arr: number[]): number;
  /** 计算数字的乘积 */
  product(...arr: number[]): number;
  /** 保留数字的指定小数位数 */
  keepBits(d: number, bits: number): number;
  /** 计算两点之间的距离 */
  distance(x1: number, y1: number, x2: number, y2: number): number;
  /** 角度转换为弧度 */
  angle2rad(angle: number): number;
  /** 弧度转换为角度 */
  rad2angle(rad: number): number;
  /** 计算两点之间的角度 */
  angle(x1: number, y1: number, x2: number, y2: number): number;
  /** 校验两个圆是否相交 */
  circleCross(
    x1: number,
    y1: number,
    r1: number,
    x2: number,
    y2: number,
    r2: number
  ): boolean;
  /** 计算二次贝塞尔曲线在指定参数值下的点 */
  quadraticBezier(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    cx: number,
    cy: number,
    t: number
  ): [number, number];
  /** 计算三次贝塞尔曲线在指定参数值下的点 */
  cubicBezier(
    t: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    cx1: number,
    cy1: number,
    cx2: number,
    cy2: number,
  ): [number, number];
}

/** 数字能力实现 */
export const digit: IDigit = {
  name: "Digit",
  description: "数字",
  valid(d: number): boolean {
    return !isNaN(d);
  },
  finite(d: number): boolean {
    return isFinite(d);
  },
  infinite(d: number): boolean {
    return !isFinite(d);
  },
  negative(d: number): boolean {
    return d < 0;
  },
  positive(d: number): boolean {
    return d >= 0;
  },
  round(d: number): number {
    return Math.round(d);
  },
  floor(d: number): number {
    return Math.floor(d);
  },
  ceil(d: number): number {
    return Math.ceil(d);
  },
  abs(d: number): number {
    return Math.abs(d);
  },
  integer(d: number): boolean {
    return Number.isInteger(d);
  },
  decimal(d: number): number {
    return d - Math.floor(d);
  },
  pow(d: number, p: number): number {
    return Math.pow(d, p);
  },
  sqrt(d: number): number {
    return Math.sqrt(d);
  },
  clamp(d: number, min: number, max: number): number {
    return Math.min(Math.max(d, min), max);
  },
  equals(d: number, e: number, tolerance: number = Number.EPSILON): boolean {
    return d === e || Math.abs(d - e) <= tolerance;
  },
  sign(d: number): number {
    return d === 0 ? 0 : d < 0 ? -1 : 1;
  },
  sum(...arr: number[]): number {
    return arr.reduce((acc, cur) => acc + cur, 0);
  },
  average(...arr: number[]): number {
    return this.sum(...arr) / arr.length;
  },
  product(...arr: number[]): number {
    return arr.reduce((acc, cur) => acc * cur, 1);
  },
  keepBits(d: number, bits: number): number {
    return Number(d.toFixed(bits));
  },
  distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  },
  angle2rad(angle: number): number {
    return (angle * Math.PI) / 180;
  },
  rad2angle(rad: number): number {
    return (rad * 180) / Math.PI;
  },
  angle(x1: number, y1: number, x2: number, y2: number): number {
    return this.rad2angle(Math.atan2(y2 - y1, x2 - x1));
  },
  circleCross(
    x1: number,
    y1: number,
    r1: number,
    x2: number,
    y2: number,
    r2: number
  ): boolean {
    return this.distance(x1, y1, x2, y2) <= r1 + r2;
  },
  quadraticBezier(
    t: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    cx: number,
    cy: number
  ): [number, number] {
    const x = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t ** 2 * x2;
    const y = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t ** 2 * y2;
    return [x, y];
  },
  cubicBezier(
    t: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    cx1: number,
    cy1: number,
    cx2: number,
    cy2: number
  ): [number, number] {
    const x =
      (1 - t) ** 3 * x1 +
      3 * (1 - t) ** 2 * t * cx1 +
      3 * (1 - t) * t ** 2 * cx2 +
      t ** 3 * x2;
    const y =
      (1 - t) ** 3 * y1 +
      3 * (1 - t) ** 2 * t * cy1 +
      3 * (1 - t) * t ** 2 * cy2 +
      t ** 3 * y2;
    return [x, y];
  },
};
