import { ToastPayload, UIBindingMap, UIController } from "../../qin";
import { Label } from "cc";

/** Toast 视图控制器 */
export class UiToastController extends UIController<typeof UiToastController.UiSpec> {
  static readonly UiSpec = {
    text: ["Text", "component", Label],
  } as const satisfies UIBindingMap;

  onViewWillAppear(params?: ToastPayload): void {
    super.onViewWillAppear(params);
    this.refs.text.string = params?.message ?? "";
  }
}
