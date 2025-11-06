/** 
 * 依赖项
 * @description 依赖项为框架提供基础能力
 * - 依赖项优先于服务项注册
 * - 依赖项可以获取其他依赖项，但不能获取服务
 */
export interface IDependency {
  /** 依赖名称 */
  readonly name: string;
  /** 依赖描述 */
  readonly description: string;
  /** 依赖注入时调用 */
  onAttach(): Promise<void>;
  /** 依赖解注入时调用 */
  onDetach(): Promise<void>;
}
