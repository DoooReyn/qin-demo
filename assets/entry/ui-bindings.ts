import { UiPageMainController } from "./view/ui-page-main.controller";
import { UiPopupUserinfoController } from "./view/ui-popup-userinfo.controller";
import { UiToastController } from "./view/ui-toast.controller";
import { UIConfig, PRESET } from "../qin";
import { UiLocator } from "./ui-locator";

/** UI 绑定 */
export const UiBindings: UIConfig[] = [
  {
    key: "ui-toast",
    type: "Overlay",
    overlaySubtype: "Toast",
    prefabPath: UiLocator.Toast,
    controller: UiToastController,
    cachePolicy: "Persistent",
  },
  {
    key: "ui-page-main",
    type: "Page",
    prefabPath: UiLocator.PageMain,
    controller: UiPageMainController,
    cachePolicy: "LRU",
  },
  {
    key: "ui-popup-userinfo",
    type: "Popup",
    prefabPath: UiLocator.PopupUserinfo,
    controller: UiPopupUserinfoController,
    enterTweenLib: "tweener-popup-in",
    exitTweenLib: "tweener-popup-out",
    cachePolicy: "LRU",
    modal: true,
    closeOnMaskClick: false,
  },
];
