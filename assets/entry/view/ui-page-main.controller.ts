import { Button, Label } from "cc";
import { ioc, mock, PRESET, RichTextAtom, UIBindingMap, UIController } from "../../qin";
import { UiPopupUserinfoController } from "./ui-popup-userinfo.controller";

/**
 * 主页面
 */
@mock.decorator.ccclass("UiPageMainController")
export class UiPageMainController extends UIController<typeof UiPageMainController.UiSpec> {
  protected static readonly UiSpec = {
    btnOpen: ["Button", "component", Button],
    labTitle: ["Title", "component", Label],
    richText: ["HyperText", "component", RichTextAtom],
  } as const satisfies UIBindingMap;

  onViewWillAppear(params?: any): void {
    super.onViewWillAppear(params);

    if (this.refs.labTitle) this.refs.labTitle.string = "主页面";
    this.refs.btnOpen?.node.on(PRESET.EVENT.CLICK, this.__doOpenUserInfoPopup, this);
  }

  onViewWillDisappear(): void {
    this.refs.btnOpen?.node.off(PRESET.EVENT.CLICK, this.__doOpenUserInfoPopup, this);

    super.onViewWillDisappear();
  }

  private __doOpenUserInfoPopup() {
    ioc.ui.openPopup(UiPopupUserinfoController);
  }
}
