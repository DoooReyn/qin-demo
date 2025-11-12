import { Constructor, Pair } from "../typings";
import { IDependency } from "./dependency.typings";

/** 数据传输对象 */
export interface Dto {}

/** 数据属性变化回调 */
export type OnPropertyChanged = (path: string, value: any) => void;

/** 订阅结构 */
export type Subscription = Pair<OnPropertyChanged, any>;

/** 数据模型接口 */
export interface IModel<T extends Dto> {
  /** 数据代理 */
  get dto(): T;

  /** 初始化 */
  initialize(): void;

  /**
   * 同步数据
   * @param dto 数据对象
   */
  sync(dto: T): void;

  /**
   * 订阅属性变化（细粒度）
   * @param property 属性路径
   * @param onPropertyChanged 回调
   * @param context 上下文
   * @returns
   */
  subscribeCompact(property: string, onPropertyChanged: OnPropertyChanged, context: any): void;

  /**
   * 取消订阅（细粒度）
   * @param property 属性路径
   * @param onPropertyChanged 回调
   * @param context 上下文
   */
  unsubscribeCompact(property: string, onPropertyChanged: OnPropertyChanged, context: any): void;

  /**
   * 取消（指定路径的）所有订阅（细粒度）
   * @param property 属性路径（可选，不传时取消所有订阅）
   * @param context 上下文（可选，不传时取消指定属性的所有订阅）
   */
  unsubscribeCompacts(property?: string, context?: any): void;

  /**
   * 订阅属性变化（粗粒度）
   * @param onPropertyChanged 回调
   * @param context 上下文
   */
  subscribeLax(onPropertyChanged: OnPropertyChanged, context: any): void;

  /**
   * 取消订阅（粗粒度）
   * @param onPropertyChanged 回调
   * @param context 上下文
   */
  unsubscribeLax(onPropertyChanged: OnPropertyChanged, context: any): void;

  /**
   * 取消（指定上下文的）所有属性订阅（粗粒度）
   */
  unsubscribeLaxes(context?: any): void;

  /**
   * 取消所有订阅（包含细粒度和粗粒度）
   * @param context 上下文（可选，不传时取消所有订阅）
   */
  unsubscribeAll(context?: any): void;
}

/**
 * 内存数据库接口
 */
export interface IDatabase extends IDependency {
  /**
   * 注入数据模型
   * @param cls 数据模型构造
   */
  register(cls: Constructor<IModel<Dto>>): void;

  /**
   * 注销数据模型
   * @param cls 数据模型构造
   */
  unregister(cls: { new (): IModel<Dto> }): void;

  /**
   * 获取数据模型（唯一实例）
   * @param cls 数据模型构造
   * @returns 数据模型实例
   */
  acquire<D extends Dto>(cls: Constructor<IModel<D>> | string): IModel<D> | null;

  /**
   * 创建数据模型
   * @param cls 数据模型构造
   * @returns
   */
  create<D extends Dto>(cls: Constructor<IModel<D>> | string): IModel<D> | null;
}
