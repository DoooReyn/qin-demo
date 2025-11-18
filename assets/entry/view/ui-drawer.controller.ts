import { Layout, Label } from "cc";
import { UIBindingMap, DrawerPayload, UIController } from "../../qin";

/** Drawer 视图控制器（全局样式） */
export class UiDrawerController extends UIController<typeof UiDrawerController.UiSpec> {
  static readonly UiSpec = {
    text: ["Text", "component", Label],
    layouts: [".", "components", Layout],
  } satisfies UIBindingMap;

  onViewWillAppear(params: DrawerPayload): void {
    this.refs.text.string = params.message ?? "";
    this.refs.text.updateRenderData(true);
    this.refs.layouts.forEach((v) => v.updateLayout(true));
    super.onViewWillAppear(params);
  }
}
