import { Pairs } from "../typings";
import { IDependency } from "./dependency.typings";

/** 表格结构 */
export interface ITableRecord {
  id: number;
  [key: string]: any;
}

/** 表格*/
export type ITable = Record<string, ITableRecord>;

/** 所有表格 */
export type Tables = Record<string, ITable>;

/** 查询量级类型 */
export type QueryAmountType = "one" | "many";

/** 查询匹配类型 */
export type QueryMatchType = "some" | "every";

/** 查询条件 */
export interface IQuery<T extends ITableRecord> {
  /** 查询字段 */
  fields?: Partial<T>;
  /** 查询过滤器 */
  filter?: (id: number, data: ITableRecord) => boolean;
  /** 是否缓存 */
  cache?: boolean;
  /** 查询量级类型 */
  amountType?: QueryAmountType;
  /** 查询匹配类型 */
  matchType?: QueryMatchType;
}

/**
 * 表格查询工具接口
 */
export interface ITableQueries extends IDependency {
  /**
   * 注册配置表
   * @param tableName 表名
   * @param table 表
   */
  register(tableName: string, table: ITable): void;

  /**
   * 批量注册配置表
   * @param tables 配置表数据
   */
  registerMany(tables: Tables): void;

  /**
   * 注销配置表
   * @param tableName 表名
   * @description 注销指定的配置表，如果未提供表名，则注销所有配置表
   */
  unregister(tableName?: string): void;

  /**
   * 是否存在配置表
   * @param tableName 表名
   * @returns
   */
  has(tableName: string): boolean;

  /**
   * 查询具有特定 ID 的条目
   * @param tableName 要查询的配置表名称，必须是 Tables 类型的键
   * @param id 要查询的条目的 ID，可以是数字或字符串
   * @returns 如果配置表已初始化且存在，返回具有指定 ID 的条目；否则返回 undefined
   */
  one<T extends ITableRecord>(tableName: string, id: string | number): T | undefined;

  /**
   * 高级查询
   * @param tableName 表名
   * @param query 查询条件
   * @description 支持多种查询方式
   * - 方式：字段匹配、过滤器
   * - 量级：一个、多个
   * - 匹配：符合所有条件、符合任意条件
   * @returns 查询结果数组
   */
  query<T extends ITableRecord>(tableName: string, query: IQuery<T>): T[];

  /**
   * 使指定缓存失效（如果不指定，则使所有缓存失效）
   * @param cacheKey 缓存键
   */
  invalidateCache(cacheKey?: string): void;
}
