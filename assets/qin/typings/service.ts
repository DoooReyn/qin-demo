

/**
 * 服务项
 * @description 服务项为框架提供特定业务能力，它跟游戏功能紧密相关
 * - 服务项在依赖项之后注册
 * - 服务项可以获取其他服务项和依赖项
 */
export interface IService {
  /** 服务名称 */
  readonly name: string;
  /** 服务描述 */
  readonly description: string;
  /** 运行状态 */
  running: boolean;
  /** 服务安装 */
  onAttach(): Promise<void>;
  /** 服务卸载 */
  onDetach(): Promise<void>;
  /** 服务更新 */
  update(ms: number): void;
}
