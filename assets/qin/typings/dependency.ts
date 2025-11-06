/**
 * 依赖项元数据
 */
export interface IDependencyMeta {
  /** 名称 */
  readonly name: string;
  /** 描述 */
  readonly description: string;
}

/**
 * 依赖项
 * @description 依赖项为框架提供基础能力
 * - 依赖项优先于服务项注册
 * - 依赖项可以获取其他依赖项，但不能获取服务
 */
export interface IDependency {
  /** 元数据 */
  meta: IDependencyMeta;
  /** 依赖注入时调用 */
  onAttach(): Promise<void>;
  /** 依赖解注入时调用 */
  onDetach(): Promise<void>;
}
