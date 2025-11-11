import qin, { ioc, PRESET } from "../qin";

qin.initialize({
  env: "dev",
  app: "qin-demo",
  version: "0.0.1",
});

ioc.eventBus.app.subscribes({
  event: PRESET.EVENT.APP_AFTER_LAUNCHED,
  handle() {
    ioc.logcat.qin.i("Qin's application is launched.");
  },
  once: true,
});
