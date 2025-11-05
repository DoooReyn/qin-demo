import { encode, decode } from "js-base64";
import { IAbility } from "./ability";

/**
 * Base64 调制能力接口
 */
export interface IBase64 extends IAbility {
  /** 压制 string -> string(base64) */
  encode(data: string): string;
  /** 解析 string(base64) -> string */
  decode(data: string): string;
}

/**
 * Base64 调制能力实现
 */
export const base64: IBase64 = {
  name: "Base64",
  description: "Base64 调制能力",
  encode(data: string) {
    return encode(data);
  },
  decode(data: string) {
    return decode(data);
  },
};
