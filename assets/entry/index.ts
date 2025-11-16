import { DEV } from "cc/env";

import * as qin from "../qin";
import { sys } from "cc";
import { UiPageMainController } from "./view/ui-page-main.controller";
import { UiPopupUserinfoController } from "./view/ui-popup-userinfo.controller";

qin.app.initialize({
  env: "dev",
  app: "qin-demo",
  version: "0.0.1",
  language: sys.Language.CHINESE,
});

qin.ioc.eventBus.app.subscribes(
  {
    event: qin.PRESET.EVENT.APP_UI_ROOT_ENSURED,
    handle() {
      qin.ioc.ui.registerMany([
        {
          key: "ui-page-main",
          type: "Page",
          prefabPath: "l:resources@ui/pfb-page-main",
          controller: UiPageMainController,
          cachePolicy: "LRU",
        },
      ]);
      qin.ioc.ui.register({
        key: "ui-popup-userinfo",
        type: "Popup",
        prefabPath: "l:resources@ui/pfb-popup-userinfo",
        controller: UiPopupUserinfoController,
        cachePolicy: "LRU",
        modal: false,
        closeOnMaskClick: false,
      });
    },
    once: true,
  },
  {
    event: qin.PRESET.EVENT.APP_AFTER_LAUNCHED,
    handle() {
      qin.ioc.logcat.qin.i("Qin's application is launched.");
      qin.ioc.ui.openPage("ui-page-main");
      qin.ioc.ui.openPopup("ui-popup-userinfo");
    },
    once: true,
  }
);

if (DEV) {
  qin.gg.set("qin", qin, 1);
}
