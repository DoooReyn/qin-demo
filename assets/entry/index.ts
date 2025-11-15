import { DEV } from "cc/env";

import * as qin from "../qin";
import { sys, instantiate } from "cc";

qin.app.initialize({
  env: "dev",
  app: "qin-demo",
  version: "0.0.1",
  language: sys.Language.CHINESE,
});

qin.ioc.eventBus.app.subscribes({
  event: qin.PRESET.EVENT.APP_AFTER_LAUNCHED,
  handle() {
    qin.ioc.logcat.qin.i("Qin's application is launched.");
    qin.ioc.loader.loadPrefab("l:resources@main").then((prefab) => {
      const node = instantiate(prefab);
      qin.ioc.launcher.root.addChild(node);
    });
  },
  once: true,
});

if (DEV) {
  qin.gg.set("qin", qin, 1);
}
