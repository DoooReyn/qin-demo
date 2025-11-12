import { dict } from "../ability";
import ioc, { Injectable } from "../ioc";
import { Dependency } from "./dependency";
import { Tables, ITable, ITableRecord, IQuery, ITableQueries } from "./table.typings";

/**
 * 表格查询工具
 */
@Injectable({ name: "TableQueries" })
export class TableQueries extends Dependency implements ITableQueries {
  /** 配置表原始数据 */
  private __tables: Tables = Object.create(null);

  /** 配置表查询缓存 */
  private __caches: Map<string, any> = new Map();

  onDetach(): Promise<void> {
    dict.clear(this.__tables);
    this.__caches.clear();
    return super.onDetach();
  }

  /**
   * 是否匹配字段
   * @param record 表格条目
   * @param query 查询条件
   * @returns
   */
  private __matchFields<T extends ITableRecord>(record: T, query: IQuery<T>) {
    if (query.amountType == "one") {
      return Object.entries(query.fields).every(([key, value]) => record[key] === value);
    } else {
      return Object.entries(query.fields).some(([key, value]) => record[key] === value);
    }
  }

  public register(tableName: string, table: ITable) {
    dict.set(this.__tables, tableName, table);
  }

  public registerMany(tables: Tables) {
    dict.each(tables, (name, table) => this.register(name as string, table));
  }

  public unregister(tableName?: string) {
    if (tableName) {
      dict.unset(this.__tables, tableName);
    } else {
      dict.clear(this.__tables);
    }
  }

  public has(tableName: string) {
    return dict.exists(this.__tables, tableName);
  }

  public one<T extends ITableRecord>(tableName: string, id: string | number): T | undefined {
    const table = this.__tables[tableName];
    if (!table) {
      ioc.logcat.qin.ef("配置表: 不存在 {0}", tableName);
      return undefined;
    }

    const cacheKey = `${tableName}-record-${id}`;
    if (this.__caches.has(cacheKey)) {
      return this.__caches.get(cacheKey) as T;
    }

    const result = table[id] as T | undefined;
    if (result) {
      this.__caches.set(cacheKey, dict.lossyCopy(result));
    }

    return result;
  }

  public query<T extends ITableRecord>(tableName: string, query: IQuery<T>) {
    const table = this.__tables[tableName];
    if (!table) {
      ioc.logcat.qin.ef("配置表: 不存在 {0}", tableName);
      return undefined;
    }

    query.matchType ??= "every";
    query.amountType ??= "one";
    const fetchOne = query.amountType === "one";

    const cacheKey = `${tableName}-${JSON.stringify(query)}`;
    if (this.__caches.has(cacheKey)) {
      return this.__caches.get(cacheKey) as T[];
    }

    const result = [];

    if (query.fields) {
      if (query.fields.id != undefined) {
        const record = table[query.fields.id];
        if (record) {
          if (this.__matchFields(record, query)) {
            result.push(this.one(tableName, query.fields.id));
          }
        }
      } else {
        for (const id in table) {
          const record = table[id];
          const matched = this.__matchFields(record, query);
          if (matched) {
            result.push(this.one(tableName, id));
            if (fetchOne) break;
          }
        }
      }
    } else if (query.filter) {
      for (const id in table) {
        const record = table[id];
        const matched = query.filter(+id, record);
        if (matched) {
          result.push(this.one(tableName, id));
          if (fetchOne) break;
        }
      }
    }

    if (query.cache && result.length) {
      this.__caches.set(cacheKey, result);
    }

    return result as T[];
  }

  public invalidateCache(cacheKey?: string) {
    if (cacheKey) {
      this.__caches.delete(cacheKey);
    } else {
      this.__caches.clear();
    }
  }
}
