import { sys } from "cc";
import { DEV } from "cc/env";

import * as qin from "../qin";
import { UiBindings } from "./ui-bindings";
import { UiLocator } from "./ui-locator";

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
      qin.ioc.ui.registerMany(UiBindings);
    },
    once: true,
  },
  {
    event: qin.PRESET.EVENT.APP_AFTER_LAUNCHED,
    async handle() {
      qin.ioc.logcat.qin.i("Qin's application is launched.");

      const prefab = await qin.ioc.loader.loadPrefab(UiLocator.Toast);
      prefab && qin.ioc.nodePool.register(prefab);

      await qin.ioc.ui.openPage("ui-page-main");

      await qin.ioc.ui.openPopup("ui-popup-userinfo");
    },
    once: true,
  }
);

if (DEV) {
  qin.gg.set("qin", qin, 1);
}
