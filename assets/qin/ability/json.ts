import ioc from "../ioc";
import { IAbility } from "./ability";
import { might } from "./might";

/**
 * JSON 调制能力接口
 */
export interface IJson extends IAbility {
  /** 压制 object -> string */
  encode(data: object): string;
  /** 解析 string -> object */
  decode(data: string): object;
}

/**
 * JSON 调制能力实现
 */
export const json: IJson = {
  name: "Json",
  description: "JSON 调制能力",
  encode(data: object): string {
    return JSON.stringify(data, null, 0);
  },
  decode(data: string): object {
    const [ret, err] = might.sync(() => JSON.parse(data));
    if (err) {
      ioc.logcat.qin.e("JSON 解析失败:", data);
    }
    return ret;
  },
};
