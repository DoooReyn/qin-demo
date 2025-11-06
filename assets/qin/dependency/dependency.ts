

/**
 * 依赖项基类
 */
export class Dependency {
  /** 依赖项注册回调 */
  onAttach(): void {}
  /** 依赖项注销回调 */
  onDetach(): void {}
}
