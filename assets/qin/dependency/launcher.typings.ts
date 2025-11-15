import { Camera, Canvas, Node, Scene } from "cc";

import { MainAtom } from "../atom";
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
  /** 应用入口 */
  main: MainAtom;
  /** 初始化 */
  initialize(onLaunched: () => void): void;
  /** 场景加载完毕 */
  onReady(scene: Scene): void;
  /** 应用退出 */
  onEnded(): void;
}
