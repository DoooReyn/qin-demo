import { director, game, Camera, Canvas, Director, Game, Node, Scene } from "cc";

import { MainAtom } from "../atom";
import ioc, { Injectable } from "../ioc";
import { PRESET } from "../preset";
import { Dependency } from "./dependency";
import { ILauncher } from "./launcher.typings";

/**
 * 启动器
 */
@Injectable({ name: "Launcher", priority: 210 })
export class Launcher extends Dependency implements ILauncher {
  scene: Scene;
  stage: Canvas;
  root: Node;
  cameraUi: Camera;
  main: MainAtom;

  private __onLaunched: () => void;

  onAttach(): Promise<void> {
    return super.onAttach();
  }

  initialize(onLaunched: () => void) {
    this.__onLaunched = onLaunched;
    game.once(Game.EVENT_CLOSE, this.onEnded, this);
    director.once(Director.EVENT_AFTER_SCENE_LAUNCH, this.onReady, this);
  }

  onReady(scene: Scene) {
    ioc.logcat.qin.i("场景启动完成:", scene.name);
    this.scene = scene;
    this.root = scene.getChildByName(PRESET.MACRO.STAGE) ?? scene.children[0];
    this.stage = this.root.getComponent(Canvas) ?? scene.getComponentInChildren(Canvas);
    this.cameraUi =
      this.root.getChildByName(PRESET.MACRO.CAMERA_UI)?.getComponent(Camera) ??
      this.root.getComponentInChildren(Camera);
    this.main = this.root.addComponent(MainAtom);
    this.__onLaunched?.();
    this.__onLaunched = null;
  }

  onEnded() {
    ioc.unmount();
    ioc.logcat.qin.i("应用退出");
  }
}
