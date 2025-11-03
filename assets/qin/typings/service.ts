/** 服务项 */
export interface IService {
  /** 服务名称 */
  readonly name: string;
  /** 服务描述 */
  readonly description: string;
  /** 服务安装 */
  install(): Promise<void>;
  /** 服务卸载 */
  uninstall(): Promise<void>;
  /** 服务更新 */
  update(ms: number): void;
}
