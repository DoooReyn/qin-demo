import { IAbility } from "./ability";

/**
 * 全局环境能力接口
 * @description 全局环境能力用于管理全局变量
 * - 提供注入、设置、取消设置、查询和获取全局变量的方法
 */
export interface IGlobal extends IAbility {
  /** 全局环境列表 */
  env: Record<string, any>[];
  /** 注入全局环境 */
  inject(env: Record<string, any>): void;
  /** 移除全局环境 */
  eject(env: Record<string, any>): void;
  /** 设置全局变量 */
  set(name: string, value: any, at?: number): void;
  /** 取消设置全局变量 */
  unset(name: string, at?: number): void;
  /** 检查全局变量是否存在 */
  exists(name: string, at?: number): boolean;
  /** 获取全局变量 */
  acquire<T>(key: string): T | undefined;
}

/** 全局环境能力 */
export const gg: IGlobal = {
  name: "Global",
  description: "全局环境",
  env: [{}, globalThis || window || self || frames || {}],
  inject(env: Record<string, any>) {
    gg.env.push(env);
  },
  eject(env: Record<string, any>) {
    const index = gg.env.indexOf(env);
    if (index !== -1) {
      gg.env.splice(index, 1);
    }
  },
  set(name: string, value: any, at: number = 0) {
    if (gg.env[at] != undefined) {
      gg.env[at][name] = value;
    }
  },
  unset(name: string, at: number = 0) {
    if (gg.env[at] != undefined) {
      delete gg.env[at][name];
    }
  },
  exists(name: string, at?: number) {
    if (at == undefined) {
      return gg.env.findIndex((env) => env[name] !== undefined) !== -1;
    } else {
      return gg.env[at] != undefined && gg.env[at][name] !== undefined;
    }
  },
  acquire<T>(key: string): T | undefined {
    for (let i = gg.env.length; i >= 0; i--) {
      if (gg.env[i][key] !== undefined) {
        return gg.env[i][key] as T;
      }
    }
    return undefined;
  },
};
