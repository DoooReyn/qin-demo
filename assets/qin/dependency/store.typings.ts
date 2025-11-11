import { IDictionary } from "../ability";
import { ITriggers } from "../foundation";
import { IDependency } from "./dependency.typings";

/**
 * 本地存储项接口
 */
export interface IStoreItem<T extends IDictionary> {
  /** 存储项别名 */
  readonly alias: string;
  /** 存储项模板 */
  readonly template: T;
  /** (代理的)存储数据 */
  data: T;
  /** 存储数据变更触发器 */
  onDataChanged: ITriggers;
  /** 存储项唯一标识 */
  get key(): string;
  /** 加载存储项数据 */
  load(): void;
  /** 保存存储项数据 */
  save(): void;
}

/**
 * 本地存储容器
 */
export interface IStoreContainer extends IDependency {
  /**
   * 注册数据模板
   * @param alias 别名
   * @param template 模板
   */
  register<T extends IDictionary>(alias: string, template: T): void;

  /**
   * 注销数据模板
   * @param alias 别名
   */
  unregister(alias: string): void;

  /**
   * 保存存储项数据
   * @param alias 别名
   * @description 不传入 alias 时，保存所有存储项数据
   */
  save(alias?: string): void;

  /**
   * 加载存储项数据
   * @param alias 别名
   * @description 不传入 alias 时，加载所有存储项数据
   */
  load(alias?: string): void;

  /**
   * 获取存储项
   * @param alias 别名
   */
  itemOf<T extends IDictionary>(alias: string): IStoreItem<T>;
}
