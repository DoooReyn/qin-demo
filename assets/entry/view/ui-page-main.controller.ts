import { Button, Label } from "cc";
import { ioc, mock, PRESET, RichTextAtom, UIBindingMap, UIController } from "../../qin";
import { UiPopupUserinfoController } from "./ui-popup-userinfo.controller";

/** 绑定配置 */
const UiSpec = {
  btnOpen: {
    kind: "component",
    path: "Button",
    component: Button,
  },
  title: {
    kind: "component",
    path: "Title",
    component: Label,
  },
  hyperText: {
    kind: "component",
    path: "HyperText",
    component: RichTextAtom,
  },
} satisfies UIBindingMap;

/**
 * 主页面
 */
@mock.decorator.ccclass("UiPageMainController")
export class UiPageMainController extends UIController<typeof UiSpec> {
  defineBindings() {
    return UiSpec;
  }

  onViewWillAppear(params?: any): void {
    super.onViewWillAppear(params);

    this.refs.title.string = "主页面";
    this.refs.btnOpen.node.on(PRESET.EVENT.CLICK, this.__doOpenUserInfoPopup, this);
    ioc.logcat.qin.d(this.refs.hyperText.text);
  }

  onViewWillDisappear(): void {
    this.refs.btnOpen.node.off(PRESET.EVENT.CLICK, this.back, this);

    super.onViewWillDisappear();
  }

  private __doOpenUserInfoPopup() {
    ioc.ui.openPopup(UiPopupUserinfoController);
  }
}
