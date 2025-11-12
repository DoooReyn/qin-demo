import { DEV } from "cc/env";

import * as qin from "../qin";

qin.app.initialize({
  env: "dev",
  app: "qin-demo",
  version: "0.0.1",
});

qin.ioc.eventBus.app.subscribes({
  event: qin.PRESET.EVENT.APP_AFTER_LAUNCHED,
  handle() {
    qin.ioc.logcat.qin.i("Qin's application is launched.");
  },
  once: true,
});

if (DEV) {
  qin.gg.set("qin", qin, 1);
}
