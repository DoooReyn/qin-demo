import { Label, Button } from "cc";
import { mock, PRESET, UIBindingMap, UIController } from "../../qin";

/**
 * 用户信息弹窗
 */
@mock.decorator.ccclass("UiPopupUserinfoController")
export class UiPopupUserinfoController extends UIController<typeof UiPopupUserinfoController.UiSpec> {
  protected static readonly UiSpec = {
    title: {
      kind: "component",
      path: "Title",
      component: Label,
    },
    btnClose: {
      kind: "component",
      path: "Button",
      component: Button,
    },
  } satisfies UIBindingMap;

  onViewWillAppear(params?: any): void {
    super.onViewWillAppear(params);
    this.refs.title.string = "用户信息";
    this.refs.btnClose.node.on(PRESET.EVENT.CLICK, this.back, this);
  }

  onViewWillDisappear(): void {
    this.refs.btnClose.node.off(PRESET.EVENT.CLICK, this.back, this);
    super.onViewWillDisappear();
  }
}
