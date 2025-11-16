import { mock } from "../ability";
import { Atom } from "../atom";
import { IUIView } from "../dependency/ui.typings";

/**
 * UI 控制器基类
 * - 继承 Atom，接入框架的生命周期
 * - 实现 IUIView 接口，提供空实现，方便子类按需覆写
 */
@mock.decorator.ccclass("UIController")
export class UIController extends Atom implements IUIView {
  onViewCreated(): void {}

  onViewWillAppear(params?: any): void {
    void params;
  }

  onViewDidAppear(): void {}

  onViewWillDisappear(): void {}

  onViewDidDisappear(): void {}

  onViewDisposed(): void {}

  onViewFocus(): void {}
}
