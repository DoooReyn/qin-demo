import { IAbility } from "./ability";

/** 字典类型 */
export interface IDictionary {
  [k: string | symbol]: any;
}

/** 字典键类型 */
export type IKey = string | symbol;

/**
 * 字典能力项接口
 * @description 提供对字典的操作方法
 */
export interface IDict extends IAbility {
  /** 冻结字典（防止修改） */
  freeze(d: IDictionary): Readonly<IDictionary>;
  /** 获取字典键列表 */
  keys(d: IDictionary): string[];
  /** 获取字典值列表 */
  values(d: IDictionary): any[];
  /** 遍历字典条目 */
  entries(d: IDictionary): [IKey, any][];
  /** 检查字典是否包含指定键 */
  own(d: IDictionary, k: IKey): boolean;
  /** 检查字典是否包含指定键 */
  exists(d: IDictionary, k: IKey): boolean;
  /** 设置字典值 */
  set(d: IDictionary, k: IKey, v: any): void;
  /** 删除字典值 */
  unset(d: IDictionary, k: IKey): void;
  /** 获取字典值 */
  get(d: IDictionary, k: IKey): any;
  /** 清空字典 */
  clear(d: IDictionary): void;
  /** 检查字典是否为空 */
  empty(d: IDictionary): boolean;
  /** 遍历字典 */
  each(d: IDictionary, visit: (k: IKey, v: any) => void): void;
  /** 映射字典值 */
  map(d: IDictionary, mapping: (k: IKey, v: any) => any): IDictionary;
  /** 创建一个新的字典 */
  create(d?: IDictionary): IDictionary;
  /** 从字典中提取指定键值对 */
  pick<K extends IKey[]>(d: IDictionary, keys: K): Pick<IDictionary, K[number]>;
  /** 从字典中排除指定键值对 */
  omit<K extends IKey[]>(
    d: IDictionary,
    keys: K,
    override?: boolean
  ): Omit<IDictionary, K[number]>;
  /** 浅拷贝 */
  shallowCopy(d: IDictionary): IDictionary;
  /** 有损拷贝（只适用于纯数据对象） */
  lossyCopy(d: IDictionary): IDictionary;
  /** 深拷贝（递归复制嵌套对象，支持数组和对象，不支持循环引用） */
  deepCopy(d: IDictionary): IDictionary;
  /** 合并字典（覆盖目标字典中的相同键） */
  merge(dst: IDictionary, src: IDictionary): void;
  /** 覆盖字典（仅覆盖目标字典中不存在的键） */
  override(dst: IDictionary, src: IDictionary): void;
}

/** 字典能力项 */
export const dict: IDict = {
  name: "Dict",
  description: "字典",
  freeze(d: IDictionary) {
    return Object.freeze(d);
  },
  keys(d: IDictionary) {
    return Object.keys(d);
  },
  values(d: IDictionary) {
    return Object.values(d);
  },
  entries(d: IDictionary) {
    return Object.entries(d);
  },
  each(d: IDictionary, visit: (k: IKey, v: any) => void) {
    dict.keys(d).forEach((k) => d.hasOwnProperty(k) && visit(k, d[k]));
  },
  own(d: IDictionary, k: IKey) {
    return d.hasOwnProperty(k);
  },
  exists(d: IDictionary, k: IKey) {
    return dict.own(d, k) || d[k] !== undefined;
  },
  set(d: IDictionary, k: IKey, v: any) {
    if (dict.own(d, k)) {
      d[k] = v;
    } else if (d[k] == undefined) {
      d[k] = v;
    }
  },
  unset(d: IDictionary, k: IKey) {
    if (dict.own(d, k)) {
      delete d[k];
    }
  },
  get(d: IDictionary, k: IKey) {
    return dict.own(d, k) ? d[k] : undefined;
  },
  clear(d: IDictionary) {
    for (const key in d) {
      if (d.hasOwnProperty(key)) {
        delete d[key];
      }
    }
  },
  empty(d: IDictionary) {
    return dict.keys(d).length === 0;
  },
  map(d: IDictionary, mapping: (k: IKey, v: any) => any) {
    return dict.keys(d).reduce((acc, key) => {
      acc[key] = mapping(key, d[key]);
      return acc;
    }, {} as IDictionary);
  },
  create(d?: IDictionary) {
    return d ? { ...d } : Object.create(null);
  },
  pick<K extends IKey[]>(
    d: IDictionary,
    keys: K
  ): Pick<IDictionary, K[number]> {
    return keys.reduce((acc, key) => {
      acc[key] = d[key];
      return acc;
    }, {} as Pick<IDictionary, K[number]>);
  },
  omit<K extends IKey[]>(
    d: IDictionary,
    keys: K,
    override: boolean = false
  ): Omit<IDictionary, K[number]> {
    if (override) {
      keys.forEach((key) => d.hasOwnProperty(key) && delete d[key]);
      return d as Omit<IDictionary, K[number]>;
    }
    return dict.keys(d).reduce((acc, key) => {
      if (keys.indexOf(key) === -1) {
        acc[key] = d[key];
      }
      return acc;
    }, {} as Omit<IDictionary, K[number]>);
  },
  shallowCopy(d: IDictionary) {
    return { ...d };
  },
  lossyCopy(d: IDictionary) {
    return JSON.parse(JSON.stringify(d));
  },
  deepCopy(d: IDictionary) {
    if (typeof d !== "object" || d == null || d == undefined) {
      return d;
    }
    return dict.keys(d).reduce((acc, key) => {
      if (Array.isArray(d[key])) {
        acc[key] = d[key].map((item) => dict.deepCopy(item));
      } else {
        acc[key] = dict.deepCopy(d[key]);
      }
      return acc;
    }, {} as IDictionary);
  },
  merge(dst: IDictionary, src: IDictionary) {
    for (let key in src) {
      dst[key] = src[key];
    }
  },
  override(dst: IDictionary, src: IDictionary) {
    for (let key in src) {
      if (dst[key] == undefined) {
        dst[key] = src[key];
      }
    }
  },
};
