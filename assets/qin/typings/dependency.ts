/** 依赖项 */
export interface IDependency {
  /** 依赖名称 */
  readonly name: string;
  /** 依赖描述 */
  readonly description: string;
  /** 依赖注入时调用 */
  onAttach(): void;
  /** 依赖解注入时调用 */
  onDetach(): void;
}
