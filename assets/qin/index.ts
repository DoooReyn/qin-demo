import { DEV } from "cc/env";
import { Qin } from "./qin";

export * from "./foundation";
export * from "./ability";
export * from "./dependency";
export * from "./dependency-injector";

/** 全局 Qin 实例 */
const qin = new Qin();

/** 仅在开发环境下将 Qin 实例挂载到全局对象 */
if (DEV) {
  (<any>window).qin = qin;
}

export default qin;
export { Qin };
