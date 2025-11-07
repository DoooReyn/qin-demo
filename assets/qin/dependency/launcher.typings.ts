import { Camera, Canvas, Node, Scene } from "cc";

import { IDependency } from "./dependency.typings";

/**
 * 启动器
 */
export interface ILauncher extends IDependency {
  /** 场景 */
  scene: Scene;
  /** 舞台（画布） */
  stage: Canvas;
  /** 根节点 */
  root: Node;
  /** UI 相机 */
  cameraUi: Camera;
  /** 启动 */
  start(onLaunched: () => void): void;
  /** 场景加载完毕 */
  onReady(scene: Scene): void;
  /** 应用退出 */
  onEnded(): void;
}
