/** 
 * 依赖项
 * - @description 依赖项为框架提供基础能力
 */
export interface IDependency {
  /** 依赖名称 */
  readonly name: string;
  /** 依赖描述 */
  readonly description: string;
  /** 获取依赖项 */
  dependencyOf?<D extends IDependency>(name: string): D;
  /** 依赖注入时调用 */
  onAttach(): void;
  /** 依赖解注入时调用 */
  onDetach(): void;
}
