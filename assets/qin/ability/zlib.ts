import { inflate, Data, deflate } from "pako";
import { IAbility } from "./ability";

/**
 * Zlib 调制能力接口
 */
export interface IZlib extends IAbility {
  /** 压制 string -> string(zlib) */
  encode(data: Data): string;
  /** 解析 string(zlib) -> string */
  decode(data: string): Data;
}

/**
 * Zlib 调制能力实现
 */
export const zlib: IZlib = {
  name: "Modulate",
  description: "Zlib 调制能力",
  encode(data: Data) {
    return inflate(data, { to: "string" });
  },
  decode(data: string) {
    return deflate(data);
  },
};
