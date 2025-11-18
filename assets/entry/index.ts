import { sys } from "cc";
import { DEV } from "cc/env";

import * as qin from "../qin";
import { UiBindings } from "./ui-bindings";
import { UiLocator } from "./ui-locator";
import { Prefab } from "cc";

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

      await qin.ioc.loader.loadParallel(
        [
          [Prefab, { path: UiLocator.Toast }],
          [Prefab, { path: UiLocator.Drawer }],
        ],
        (finished, total, path, success) => {
          qin.ioc.logcat.qin[success ? "if" : "ef"](
            "前置资源加载进度：{0}/{1} 当前: {2} <{3}>",
            finished,
            total,
            path,
            success ? "成功" : "失败"
          );
          if (success) {
            const prefab = qin.ioc.cache.get<Prefab>(path);
            prefab && qin.ioc.nodePool.register(prefab);
          }
        },
        4
      );

      await qin.ioc.ui.openPage("ui-page-main");

      await qin.ioc.ui.openPopup("ui-popup-userinfo");
    },
    once: true,
  }
);

if (DEV) {
  qin.gg.set("qin", qin, 1);
}
