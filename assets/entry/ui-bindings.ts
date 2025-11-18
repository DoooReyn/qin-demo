import { UiPageMainController } from "./view/ui-page-main.controller";
import { UiPopupUserinfoController } from "./view/ui-popup-userinfo.controller";
import { UiToastController } from "./view/ui-toast.controller";
import { UiDrawerController } from "./view/ui-drawer.controller";
import { UIConfig, PRESET } from "../qin";
import { UiLocator } from "./ui-locator";

/** UI 绑定 */
export const UiBindings: UIConfig[] = [
  {
    key: PRESET.UI.TOAST_CONFIG_KEY,
    type: "Overlay",
    overlaySubtype: "Toast",
    prefabPath: UiLocator.Toast,
    controller: UiToastController,
    cachePolicy: "Persistent",
    enterTweenLib: "tweener-blur-in",
    exitTweenLib: "tweener-blur-out",
  },
  {
    key: PRESET.UI.DRAWER_CONFIG_KEY,
    type: "Overlay",
    overlaySubtype: "Drawer",
    prefabPath: UiLocator.Drawer,
    controller: UiDrawerController,
    cachePolicy: "Persistent",
    enterTweenLib: "tweener-drawer-in",
    exitTweenLib: "tweener-drawer-out",
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
