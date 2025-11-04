import { IAbility } from "./ability";

/** 随机区间类型 */
export enum Range {
  /** 左右全开 */
  L0R0,
  /** 左开右闭 */
  L0R1,
  /** 左闭右开 */
  L1R0,
  /** 左右全闭 */
  L1R1,
}

/**
 * 随机数能力接口
 * @description 提供随机数相关的能力，包括设置种子、获取种子、获取随机数等
 */
export interface IRandom extends IAbility {
  /** 随机种子 */
  randomSeed(): string;
  /**
   * 设置随机数种子
   * @param seed 种子
   */
  setSeed(seed: string): void;
  /**
   * 获取当前随机数种子
   * @returns
   */
  getSeed(): string;
  /**
   * 获取随机数(0~1之间)
   * @returns 随机数
   */
  random(): number;
  /**
   * 获取随机数(-1~1之间)
   * @returns 随机数
   */
  randomOp(): number;
  /**
   * 随机真假
   * @returns 真假
   */
  randomIf(): boolean;
  /**
   * 随机 0 或 1
   * @returns 0 | 1
   */
  random01(): number;
  /**
   * 随机范围
   * @param min 最小值
   * @param max 最大值
   * @returns 随机数
   */
  randomRange(min: number, max: number): number;
  /**
   * 随机整数
   * @param min 最小值
   * @param max 最大值
   * @param range 随机区间类型
   * @returns 随机整数
   */
  randomInteger(min: number, max: number, range?: Range): number;
  /**
   * 随机点在矩形内
   * @param x 矩形左边界
   * @param y 矩形上边界
   * @param w 矩形宽度
   * @param h 矩形高度
   * @returns 随机点坐标
   */
  randomOnRect(
    x: number,
    y: number,
    w: number,
    h: number
  ): { x: number; y: number };
  /**
   * 随机点在矩形内
   * @param x 矩形左边界
   * @param y 矩形上边界
   * @param w 矩形宽度
   * @param h 矩形高度
   * @returns 随机点坐标
   */
  randomInRect(
    x: number,
    y: number,
    w: number,
    h: number
  ): { x: number; y: number };
  /**
   * 随机点在圆内
   * @param x 圆心 x 坐标
   * @param y 圆心 y 坐标
   * @param r 圆半径
   * @returns 随机点坐标
   */
  randomInCircle(x: number, y: number, r: number): { x: number; y: number };
  /**
   * 随机点在圆上
   * @param x 圆心 x 坐标
   * @param y 圆心 y 坐标
   * @param r 圆半径
   * @returns 随机点坐标
   */
  randomOnCircle(x: number, y: number, r: number): { x: number; y: number };
  /**
   * 随机点在圆环内
   * @param x 圆心 x 坐标
   * @param y 圆心 y 坐标
   * @param r1 圆环内半径
   * @param r2 圆环外半径
   * @returns 随机点坐标
   */
  randomInRing(
    x: number,
    y: number,
    r1: number,
    r2: number
  ): { x: number; y: number };

  /**
   * 随机一个圆弧内的点
   * @param x 圆心坐标 X
   * @param y 圆心坐标 Y
   * @param startRad 起始弧度
   * @param endRad 结束弧度
   * @param r 半径
   * @returns 随机点坐标
   */
  randomInRad(
    x: number,
    y: number,
    startRad: number,
    endRad: number,
    r: number
  ): { x: number; y: number };

  /**
   * 随机一个圆弧上的点
   * @param x 圆心坐标 X
   * @param y 圆心坐标 Y
   * @param startRad 起始弧度
   * @param endRad 结束弧度
   * @param r 半径
   * @returns 随机点坐标
   */
  randomOnRad(
    x: number,
    y: number,
    startRad: number,
    endRad: number,
    r: number
  ): { x: number; y: number };
}

/**
 * 将字符串转换为数字的哈希值
 * @param str 输入字符串
 * @returns 哈希值
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/** 随机种子 */
let __seed: string = "";
/** 上个随机数 */
let __rand: number = 0;
/** 随机数字符集 */
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * 随机数能力实现
 */
export const random: IRandom = {
  name: "Random",
  description: "随机数生成",
  randomSeed() {
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  setSeed(seed: string) {
    __seed = seed;
    __rand = hashString(seed);
  },
  getSeed() {
    return __seed;
  },
  random() {
    __rand = (__rand * 9301 + 49297) % 233280;
    return __rand / 233280;
  },
  randomOp() {
    return random.random() * 2 - 1;
  },
  randomIf() {
    return random.random() > 0.5;
  },
  random01() {
    return random.randomIf() ? 1 : 0;
  },
  randomRange(min: number, max: number): number {
    return min + random.random() * (max - min);
  },
  randomInteger(min: number, max: number, style: Range = Range.L1R0) {
    let v: number = min;
    switch (style) {
      case Range.L1R0:
        v = Math.floor(random.randomRange(min, max));
        break;
      case Range.L0R1:
        v = Math.ceil(random.randomRange(min, max));
        break;
      case Range.L1R1:
        v = Math.floor(random.randomRange(min, max + 1));
        break;
      case Range.L0R0:
        v = Math.floor(random.randomRange(min + 1, max));
        break;
    }
    return v;
  },
  randomInCircle(x: number, y: number, r: number) {
    const rad = random.randomRange(0, Math.PI * 2);
    const r2 = random.randomRange(0, r);
    x += r2 * Math.cos(rad);
    y += r2 * Math.sin(rad);
    return { x, y };
  },
  randomOnCircle(x: number, y: number, r: number) {
    const rad = random.randomRange(0, 2 * Math.PI);
    x += Math.cos(rad) * r;
    y += Math.sin(rad) * r;
    return { x, y };
  },
  randomInRad(
    x: number,
    y: number,
    startRad: number,
    endRad: number,
    r: number
  ) {
    const rad = random.randomRange(startRad, endRad);
    const r2 = random.randomRange(0, r);
    x += Math.cos(rad) * r2;
    y += Math.sin(rad) * r2;
    return { x, y };
  },
  randomOnRad(
    x: number,
    y: number,
    startRad: number,
    endRad: number,
    r: number
  ) {
    const rad = random.randomRange(startRad, endRad);
    x += Math.cos(rad) * r;
    y += Math.sin(rad) * r;
    return { x, y };
  },
  randomInRect(x: number, y: number, w: number, h: number) {
    x += random.randomRange(0, w);
    y += random.randomRange(0, h);
    return { x, y };
  },
  randomOnRect(x: number, y: number, w: number, h: number) {
    const edge = random.randomInteger(0, 4);
    switch (edge) {
      case 0:
        // 左边
        y += random.randomRange(0, h);
        break;
      case 1:
        // 上边
        x += random.randomRange(0, w);
        y += h;
        break;
      case 2:
        // 右边
        x += w;
        y += random.randomRange(0, h);
        break;
      case 3:
        // 下边
        x += random.randomRange(0, w);
        break;
    }
    return { x, y };
  },
  randomInRing(x: number, y: number, r1: number, r2: number) {
    const rad = random.randomRange(0, 2 * Math.PI);
    const r = random.randomRange(r1, r2);
    x += Math.cos(rad) * r;
    y += Math.sin(rad) * r;
    return { x, y };
  },
};
