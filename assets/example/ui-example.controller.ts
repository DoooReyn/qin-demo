import { _decorator } from "cc";

import { ioc, UIController } from "../qin";

const { ccclass } = _decorator;

/**
 * 简单 UI 示例控制器
 * 用于验证 UIManager 的生命周期调用
 */
@ccclass("UiExampleController")
export class UiExampleController extends UIController {
  onViewCreated(): void {
    ioc.logcat?.qin.df("[UiExample] onViewCreated");
  }

  onViewWillAppear(params?: any): void {
    ioc.logcat?.qin.df("[UiExample] onViewWillAppear params=", params);
  }

  onViewDidAppear(): void {
    ioc.logcat?.qin.df("[UiExample] onViewDidAppear");
  }

  onViewWillDisappear(): void {
    ioc.logcat?.qin.df("[UiExample] onViewWillDisappear");
  }

  onViewDidDisappear(): void {
    ioc.logcat?.qin.df("[UiExample] onViewDidDisappear");
  }

  onViewDisposed(): void {
    ioc.logcat?.qin.df("[UiExample] onViewDisposed");
  }

  onViewFocus(): void {
    ioc.logcat?.qin.df("[UiExample] onViewFocus");
  }
}
