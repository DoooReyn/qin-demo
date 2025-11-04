import { Component, js } from "cc";
import { IAbility } from "./ability";

/**
 * 布尔判断能力接口
 * @description 布尔判断能力用于管理布尔值判断
 */
export interface IBe extends IAbility {
  /**
   * 判断值是否为 undefined
   * @param value 目标值
   * @returns 是否为 undefined
   */
  absent<T>(value: T | undefined): value is undefined;
  /**
   * 判断值是否不为 undefined
   * @param value 目标值
   * @returns 是否不为 undefined
   */
  present<T>(value: T | undefined): value is T;
  /**
   * 判断值是否为 null
   * @param value 目标值
   * @returns 是否为 null
   */
  none<T>(value: T | null): value is null;
  /**
   * 判断值是否不为 null
   * @param value 目标值
   * @returns 是否不为 null
   */
  some<T>(value: T | null): value is T;
  /**
   * 判断值是否为 undefined 或 null
   * @param value 目标值
   * @returns 是否为 undefined 或 null
   */
  valid<T>(value: T | undefined | null): value is undefined | null;
  /**
   * 判断值是否不为 undefined 且不为 null
   * @param value 目标值
   * @returns 是否不为 undefined 且不为 null
   */
  invalid<T>(value: T | undefined | null): value is T;
  /**
   * 判断值是否为空
   * @param value 目标值
   * @returns 是否为空
   */
  empty(value: any): boolean;
  /**
   * 判断值是否为 true
   * @param value 目标值
   * @returns 是否为 true
   */
  truly(value: boolean | string | number): boolean;
  /**
   * 判断值是否为 false
   * @param value 目标值
   * @returns 是否为 false
   */
  falsy(value: boolean | string | number): boolean;
  /**
   * 判断值是否为 true
   * @param value 目标值
   * @returns 是否为 true
   */
  yes(value: any): boolean;
  /**
   * 判断值是否为 false
   * @param value 目标值
   * @returns 是否为 false
   */
  nop(value: any): boolean;
  /**
   * 获取值的类型
   * @param value 目标值
   * @returns 值的类型
   */
  typeof(value: any): string;
  /**
   * 判断值是否为指定类型
   * @param value 目标值
   * @param type 类型
   * @returns 是否为指定类型
   */
  isTypeOf(value: any, type: string): boolean;
  /**
   * 判断值是否为 NaN
   * @param value 目标值
   * @returns 是否为 NaN
   */
  nan(value: number): boolean;
  /**
   * 判断值是否为数字
   * @param value 目标值
   * @returns 是否为数字
   */
  digit(value: any): boolean;
  /**
   * 判断值是否为字符串
   * @param value 目标值
   * @returns 是否为字符串
   */
  literal(value: any): boolean;
  /**
   * 判断值是否为函数
   * @param value 目标值
   * @returns 是否为函数
   */
  func(value: any): boolean;
  /**
   * 判断值是否为符号
   * @param value 目标值
   * @returns 是否为符号
   */
  symbol(value: any): boolean;
  /**
   * 判断值是否为对象
   * @param value 目标值
   * @returns 是否为对象
   */
  dict(value: any): boolean;
  /**
   * 判断值是否为普通对象
   * @param value 目标值
   * @returns 是否为普通对象
   */
  plainDict(value: any): boolean;
  /**
   * 判断值是否为数组
   * @param value 目标值
   * @returns 是否为数组
   */
  list(value: any): boolean;
  /**
   * 判断值是否为正则表达式
   * @param value 目标值
   * @returns 是否为正则表达式
   */
  regexp(value: any): boolean;
  /**
   * 判断值是否为映射
   * @param value 目标值
   * @returns 是否为映射
   */
  map(value: any): boolean;
  /**
   * 判断值是否为集合
   * @param value 目标值
   * @returns 是否为集合
   */
  set(value: any): boolean;
  /**
   * 判断值是否为弱映射
   * @param value 目标值
   * @returns 是否为弱映射
   */
  weakMap(value: any): boolean;
  /**
   * 判断值是否为弱集合
   * @param value 目标值
   * @returns 是否为弱集合
   */
  weakSet(value: any): boolean;
  /**
   * 判断值是否为日期
   * @param value 目标值
   * @returns 是否为日期
   */
  date(value: any): boolean;
  /**
   * 判断值是否为指定类型的实例
   * @param value 目标值
   * @param type 类型
   * @returns 是否为指定类型的实例
   */
  instanceof(value: any, type: any): boolean;
  /**
   * 判断值是否为节点
   * @param value 目标值
   * @returns 是否为节点
   */
  node(value: any): boolean;
  /**
   * 判断值是否为组件
   * @param value 目标值
   * @returns 是否为组件
   */
  component(value: any): boolean;
  /**
   * 获取值的 CC 类名
   * @param value 目标值
   * @returns 值的 CC 类名
   */
  ccclassOf<T extends new (...args: any) => any>(value: InstanceType<T>): string;
  /**
   * 判断值是否为指定 CC 类名的实例
   * @param value 目标值
   * @param type CC 类名
   * @returns 是否为指定 CC 类名的实例
   */
  isCCClassOf<T extends new (...args: any) => any>(
    value: InstanceType<T>,
    type: string
  ): boolean;
  /**
   * 判断值是否为 URL
   * @param value 目标值
   * @returns 是否为 URL
   */
  url(value: string): boolean;
  /**
   * 获取 URL 的协议部分
   * @param url 目标 URL
   * @returns URL 的协议部分
   */
  protocolOf(url: string): string;
  /**
   * 判断 URL 是否为指定协议
   * @param url 目标 URL
   * @param protocol 协议
   * @returns 是否为指定协议
   */
  isProtocolOf(url: string, protocol: string): boolean;
  /**
   * 判断 URL 是否为 WS 协议
   * @param url 目标 URL
   * @returns 是否为 WS 协议
   */
  ws(url: string): boolean;
  /**
   * 判断 URL 是否为 WSS 协议
   * @param url 目标 URL
   * @returns 是否为 WSS 协议
   */
  wss(url: string): boolean;
  /**
   * 判断 URL 是否为 HTTP 协议
   * @param url 目标 URL
   * @returns 是否为 HTTP 协议
   */
  http(url: string): boolean;
  /**
   * 判断 URL 是否为 HTTPS 协议
   * @param url 目标 URL
   * @returns 是否为 HTTPS 协议
   */
  https(url: string): boolean;
}

/**
 * 布尔判断能力实现
 */
export const be: IBe = {
  name: "Be",
  description: "布尔判断能力",
  absent<T>(value: T | undefined): value is undefined {
    return value === undefined;
  },
  present<T>(value: T | undefined): value is T {
    return value !== undefined;
  },
  none<T>(value: T | null): value is null {
    return value === null;
  },
  some<T>(value: T | null): value is T {
    return value !== null;
  },
  valid<T>(value: T | undefined | null): value is undefined | null {
    return be.absent(value) || be.none(value);
  },
  invalid<T>(value: T | undefined | null): value is T {
    return be.present(value) && be.some(value);
  },
  empty(value: any): boolean {
    return (
      value === null ||
      value === undefined ||
      value === 0 ||
      value === false ||
      value === "" ||
      value === "false"
    );
  },
  truly(value: boolean | string | number): boolean {
    return value === true || value === 1 || value === "true";
  },
  falsy(value: boolean | string | number): boolean {
    return value === false || value === 0 || value === "false";
  },
  yes(value: any) {
    return Boolean(value);
  },
  nop(value: any) {
    return !be.yes(value);
  },
  typeof(value: any): string {
    return Object.prototype.toString.call(value).slice(8, -1);
  },
  isTypeOf(value: any, type: string): boolean {
    return be.typeof(value) === type;
  },
  nan(value: number) {
    return isNaN(value);
  },
  digit(value: any) {
    return be.isTypeOf(value, "Number") && !isNaN(value);
  },
  literal(value: any) {
    return be.isTypeOf(value, "String");
  },
  func(value: any) {
    return be.isTypeOf(value, "Function");
  },
  symbol(value: any) {
    return be.isTypeOf(value, "Symbol");
  },
  dict(value: any) {
    return be.isTypeOf(value, "Object");
  },
  plainDict(value: any) {
    if (typeof value !== "object" || value === null) {
      return false;
    }
    const proto = Object.getPrototypeOf(value);
    return proto === null || proto === Object.prototype;
  },
  list(value: any) {
    return be.isTypeOf(value, "Array") || Array.isArray(value);
  },
  regexp(value: any) {
    return be.isTypeOf(value, "RegExp");
  },
  map(value: any) {
    return be.isTypeOf(value, "Map");
  },
  set(value: any) {
    return be.isTypeOf(value, "Set");
  },
  weakMap(value: any) {
    return be.isTypeOf(value, "WeakMap");
  },
  weakSet(value: any) {
    return be.isTypeOf(value, "WeakSet");
  },
  date(value: any) {
    return be.isTypeOf(value, "Date");
  },
  instanceof(value: any, type: any) {
    return value instanceof type;
  },
  node(value: any) {
    return be.instanceof(value, Node);
  },
  component(value: any) {
    return be.instanceof(value, Component);
  },
  ccclassOf<T extends new (...args: any) => any>(value: InstanceType<T>) {
    return js.getClassName(value);
  },
  isCCClassOf<T extends new (...args: any) => any>(
    value: InstanceType<T>,
    type: string
  ) {
    return be.ccclassOf(value) === type;
  },
  url(value: string) {
    return value.indexOf("://") > -1;
  },
  protocolOf(url: string) {
    return url.split("://")[0].trim().toLowerCase();
  },
  isProtocolOf(url: string, protocol: string) {
    return be.protocolOf(url) === protocol;
  },
  ws(url: string) {
    return be.isProtocolOf(url, "ws");
  },
  wss(url: string) {
    return be.isProtocolOf(url, "wss");
  },
  http(url: string) {
    return be.isProtocolOf(url, "http");
  },
  https(url: string) {
    return be.isProtocolOf(url, "https");
  },
};
