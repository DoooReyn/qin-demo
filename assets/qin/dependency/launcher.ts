import { director, game, Camera, Canvas, Director, Game, Node, Scene } from "cc";

import ioc, { Injectable } from "../ioc";
import { Dependency } from "./dependency";
import { ILauncher } from "./launcher.typings";

/**
 * 启动器
 */
@Injectable({ name: "Launcher" })
export class Launcher extends Dependency implements ILauncher {
  scene: Scene;
  stage: Canvas;
  root: Node;
  cameraUi: Camera;

  private __onLaunched: () => void;

  onAttach(): Promise<void> {
    return super.onAttach();
  }

  start(onLaunched: () => void) {
    this.__onLaunched = onLaunched;
    game.once(Game.EVENT_CLOSE, this.onEnded, this);
    director.once(Director.EVENT_AFTER_SCENE_LAUNCH, this.onReady, this);
  }

  onReady(scene: Scene) {
    this.scene = scene;
    this.stage = scene.getComponentInChildren(Canvas);
    this.root = this.stage.node;
    this.cameraUi = this.root.getComponentInChildren(Camera);
    ioc.logcat.qin.i("场景启动完毕:", scene.name);
    this.__onLaunched?.();
  }

  onEnded() {
    ioc.logcat.qin.i("应用退出");
  }
}
