import { Label, Button } from "cc";
import { ioc, mock, PRESET, UIBindingMap, UIController } from "../../qin";

/**
 * 用户信息弹窗
 */
@mock.decorator.ccclass("UiPopupUserinfoController")
export class UiPopupUserinfoController extends UIController<typeof UiPopupUserinfoController.UiSpec> {
  protected static readonly UiSpec = {
    labTitle: ["Body/Title", "component", Label],
    btnClose: ["Body/Button", "component", Button],
    keyNodes: ["Body/K#", "nodes"],
    valNodes: ["Body/V#", "nodes"],
  } as const satisfies UIBindingMap;

  onViewWillAppear(params?: any): void {
    super.onViewWillAppear(params);
    if (this.refs.labTitle) this.refs.labTitle.string = "用户信息";
    this.refs.btnClose?.node.on(PRESET.EVENT.CLICK, this.back, this);
    if (this.refs.valNodes && this.refs.keyNodes) {
      ioc.logcat.ui.d(this.refs.keyNodes.map((v) => v.name).join("|"), this.refs.valNodes.map((v) => v.name).join("|"));
    }
  }

  onViewWillDisappear(): void {
    this.refs.btnClose?.node.off(PRESET.EVENT.CLICK, this.back, this);
    super.onViewWillDisappear();
  }
}
