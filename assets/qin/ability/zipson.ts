import { IAbility } from "./ability";
import { logcat } from "./logcat";
import { might } from "./might";
import * as Zipson from "zipson";

/**
 * Zipson 调制能力接口
 */
export interface IZipSon extends IAbility {
  /** 压制 object -> string */
  encode(data: object): string;
  /** 解析 string -> object */
  decode(data: string): object;
}

/**
 * Zipson 调制能力实现
 */
export const zipson: IZipSon = {
  name: "Zipson",
  description: "Zipson 调制能力",
  encode(data: object): string {
    return Zipson.stringify(data);
  },
  decode(data: string): object {
    const [ret, err] = might.sync(Zipson.parse, Zipson, data);
    if (err) {
      logcat.qin.e("zipson 解析失败:", data);
    }
    return ret;
  },
};
