import { IAbility } from "./ability";
import { random, Range } from "./random";

/**
 * 字符串能力接口
 * @description 提供字符串操作能力
 */
export interface ILiteral extends IAbility {
  /**
   * 格式化字符串
   * 支持两种格式：
   * 1. 位置参数: format("Hello, {0}!", "World") => "Hello, World!"
   * 2. 命名参数: format("Hello, {name}!", { name: "World" }) => "Hello, World!"
   *
   * @param template 模板字符串，使用 {0}, {1}, ... 或 {name} 作为占位符
   * @param args 要替换的参数，可以是多个参数或一个对象
   * @returns 格式化后的字符串
   */
  fmt(template: string, ...args: any[]): string;
  /**
   * 将字符串的第一个字符转换为大写
   * @param str 要转换的字符串
   * @returns 转换后的字符串
   */
  capitalize(str: string): string;
  /**
   * 将字符串的第一个字符转换为小写
   * @param str 要转换的字符串
   * @returns 转换后的字符串
   */
  uncapitalize(str: string): string;
  /**
   * 将字符串转换为大写
   * @param str 要转换的字符串
   * @returns 转换后的字符串
   */
  upper(str: string): string;
  /**
   * 将字符串转换为小写
   * @param str 要转换的字符串
   * @returns 转换后的字符串
   */
  lower(str: string): string;
  /**
   * 判断字符串是否为空
   * @param str 要判断的字符串
   * @returns 是否为空
   */
  blank(str: string): boolean;
  /**
   * 判断字符串是否不为空
   * @param str 要判断的字符串
   * @returns 是否不为空
   */
  notBlank(str: string): boolean;

  /**
   * 截断字符串
   * @param str 要截断的字符串
   * @param maxLength 最大长度
   * @param ellipsis 省略号字符串，默认为"..."
   * @returns 截断后的字符串
   */
  truncate(str: string, maxLength: number, ellipsis?: string): string;
  /**
   * 比较两个版本字符串的大小
   * @param version1 版本字符串1
   * @param version2 版本字符串2
   * @returns 1 如果version1大于version2，-1如果version1小于version2，0如果相等
   */
  compareVersion(version1: string, version2: string): number;
  /**
   * 连接多个字符串为一个字符串，每个字符串之间用分隔符分隔
   * @param separator 分隔符字符串，默认为空字符串
   * @param strings 要连接的字符串数组
   * @returns 连接后的字符串
   */
  joins(separator: string, ...strings: string[]): string;
  /**
   * 连接多个字符串为一个字符串，每个字符串之间用换行符分隔
   * @param strings 要连接的字符串数组
   * @returns 连接后的字符串
   */
  joinLines(...strings: string[]): string;
  /**
   * 从URL字符串中提取参数
   * @param url URL字符串
   * @returns 参数对象
   */
  extractUrlParams(url?: string): Record<string, string>;
  /**
   * 生成唯一ID
   * @param tag 可选的标签字符串，用于标识生成的ID
   * @returns 唯一ID字符串
   */
  uniqueId(tag?: string): string;
  /**
   * 获取字符串的字节长度
   * @param str 要获取字节长度的字符串
   * @returns 字符串的字节长度
   */
  getByteLength(str: string): number;

  /**
   * 从字符串中随机选择一个字符
   * @param str 要选择字符的字符串
   * @returns 随机选择的字符
   */
  randomChar(str: string): string;
  /**
   * 从字符串中随机选择多个字符
   * @param str 要选择字符的字符串
   * @param n 要选择的字符数量
   * @returns 随机选择的字符字符串
   */
  randomChars(str: string, n: number): string;
  /**
   * 生成随机中文字符串
   * @param n 要生成的中文字符数量
   * @returns 随机中文字符字符串
   */
  randomChinese(n: number): string;
  /**
   * 生成随机小写英文字符串
   * @param n 要生成的小写英文字符数量
   * @returns 随机小写英文字符字符串
   */
  randomLowerEnglish(n: number): string;
  /**
   * 生成随机大写英文字符串
   * @param n 要生成的大写英文字符数量
   * @returns 随机大写英文字符字符串
   */
  randomUpperEnglish(n: number): string;
  /**
   * 生成随机英文字符串
   * @param n 要生成的英文字符数量
   * @returns 随机英文字符字符串
   */
  randomEnglish(n: number): string;
  /**
   * 生成随机数字字符串
   * @param n 要生成的数字字符数量
   * @returns 随机数字字符串
   */
  randomDigit(n: number): string;
  /**
   * 判断字符是否为中文字符
   * @param char 要判断的字符
   * @returns 是否为中文字符
   */
  isChinese(char: string): boolean;
  /**
   * 判断字符是否为英文字符
   * @param char 要判断的字符
   * @returns 是否为英文字符
   */
  isEnglish(char: string): boolean;
  /**
   * 判断字符是否为数字字符
   * @param char 要判断的字符
   * @returns 是否为数字字符
   */
  isDigit(char: string): boolean;
  /**
   * 将字符串拆分为单字数组，其中连续的英文字母为一个单字
   * @param text 输入字符串
   * @returns 拆分后的单字数组
   * @example
   * splitWords("Hello, world") // ["Hello", ",", " ", "world"]
   * splitWords("你好world") // ["你", "好", "world"]
   * splitWords("abc123def") // ["abc", "1", "2", "3", "def"]
   */
  splitWords(text: string): string[];
}

const charSet: Record<string, [number, number]> = {
  /** 基本汉字 */
  BasicChinese: [0x4e00, 0x9fa5],
  /** 数字0-9	*/
  Numbers: [0x30, 0x39],
  /** 小写英文字母 */
  LowerCaseAlphabet: [0x61, 0x7a],
  /** 大写英文字母 */
  UpperCaseAlphabet: [0x41, 0x5a],
} as const;

export const literal: ILiteral = {
  name: "Literal",
  description: "字符串操作能力",
  fmt(template: string, ...args: any[]) {
    // 如果没有参数，则直接返回模板字符串
    if (args.length === 0) {
      return template;
    }
    // 如果只有一个参数且为对象，则使用命名参数格式化
    if (
      args.length === 1 &&
      typeof args[0] === "object" &&
      args[0] !== null &&
      !Array.isArray(args[0])
    ) {
      const params = args[0];
      return template.replace(/{([^{}]*)}/g, (match, key) => {
        const value = params[key];
        return value !== undefined ? String(value) : match;
      });
    }
    // 否则使用位置参数进行格式化
    return template.replace(/{(\d+)}/g, (match, index) => {
      const value = args[parseInt(index, 10)];
      return value !== undefined ? String(value) : match;
    });
  },
  capitalize(str: string) {
    if (!str || str.length === 0) {
      return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  uncapitalize(str: string) {
    if (!str || str.length === 0) {
      return str;
    }
    return str.charAt(0).toLowerCase() + str.slice(1);
  },
  upper(str: string) {
    return str.toUpperCase();
  },
  lower(str: string) {
    return str.toLowerCase();
  },
  blank(str: string) {
    return str === null || str === undefined || str.trim().length === 0;
  },
  notBlank(str: string) {
    return !literal.blank(str);
  },
  truncate(str: string, maxLength: number, ellipsis?: string) {
    if (!str || str.length <= maxLength) {
      return str;
    }
    ellipsis ??= "...";
    return str.substring(0, maxLength - ellipsis.length) + ellipsis;
  },
  compareVersion(version1: string, version2: string) {
    const v1 = version1.split(".");
    const v2 = version2.split(".");
    const len = Math.max(v1.length, v2.length);
    for (let i = 0; i < len; i++) {
      const n1 = parseInt(v1[i] || "0");
      const n2 = parseInt(v2[i] || "0");
      if (n1 > n2) return 1;
      if (n1 < n2) return -1;
    }
    return 0;
  },
  joins(separator: string, ...strings: string[]) {
    return strings.join(separator);
  },
  joinLines(...strings: string[]) {
    return strings.join("\n");
  },
  extractUrlParams(url?: string) {
    url ??= window?.location?.href ?? "";
    const params: Record<string, string> = {};
    if (literal.blank(url)) return params;

    const query = url.split("?")[1];
    if (!query) return params;
    query.split("&").forEach((pair) => {
      const [key, value] = pair.split("=");
      params[key] = decodeURIComponent(value || "");
    });
    return params;
  },
  uniqueId: (tag?: string) => {
    const part1 = tag ?? "generic";
    const part2 = Date.now() % 10 ** 5;
    const part3 = random.randomInteger(1001, 9999, Range.L1R1);
    return `${part1}-${part2}-${part3}`;
  },
  getByteLength: (str: string) => {
    try {
      return new Blob([str]).size;
    } catch (e) {
      let byteLength = 0;
      for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        if (charCode <= 0x7f) {
          byteLength += 1;
        } else if (charCode <= 0x7ff) {
          byteLength += 2;
        } else if (charCode <= 0xffff) {
          byteLength += 3;
        } else {
          byteLength += 4;
        }
      }
      return byteLength;
    }
  },
  randomChar(str: string) {
    if (str.length === 0) return "";
    if (str.length === 1) return str;
    const at = random.randomInteger(0, str.length - 1, Range.L1R1);
    return str.charAt(at);
  },
  randomChars(str: string, n: number) {
    let chars = "";
    for (let i = 0; i < n; i++) {
      chars += literal.randomChar(str);
    }
    return chars;
  },
  randomChinese: (n: number) => {
    let chars = "";
    for (let i = 0; i < n; i++) {
      chars += String.fromCharCode(
        random.randomInteger(
          charSet.BasicChinese[0],
          charSet.BasicChinese[1],
          Range.L1R1
        )
      );
    }
    return chars;
  },
  randomLowerEnglish(n: number) {
    let chars = "";
    for (let i = 0; i < n; i++) {
      chars += String.fromCharCode(
        random.randomInteger(
          charSet.LowerCaseAlphabet[0],
          charSet.LowerCaseAlphabet[1],
          Range.L1R1
        )
      );
    }
    return chars;
  },
  randomUpperEnglish(n: number) {
    let chars = "";
    for (let i = 0; i < n; i++) {
      chars += String.fromCharCode(
        random.randomInteger(
          charSet.UpperCaseAlphabet[0],
          charSet.UpperCaseAlphabet[1],
          Range.L1R1
        )
      );
    }
    return chars;
  },
  randomEnglish: (n: number) => {
    let chars = "";
    for (let i = 0; i < n; i++) {
      if (random.randomIf()) {
        chars += String.fromCharCode(
          random.randomInteger(
            charSet.LowerCaseAlphabet[0],
            charSet.LowerCaseAlphabet[1],
            Range.L1R1
          )
        );
      } else {
        chars += String.fromCharCode(
          random.randomInteger(
            charSet.UpperCaseAlphabet[0],
            charSet.UpperCaseAlphabet[1],
            Range.L1R1
          )
        );
      }
    }
    return chars;
  },
  randomDigit: (n: number) => {
    let chars = "";
    for (let i = 0; i < n; i++) {
      chars += random.randomInteger(0, 9, Range.L1R1);
    }
    return chars;
  },
  isChinese: (char: string) => {
    const charCode = char.charCodeAt(0);
    return (
      charCode >= charSet.BasicChinese[0] && charCode <= charSet.BasicChinese[1]
    );
  },
  isEnglish(char: string) {
    return /^[a-zA-Z]$/.test(char);
  },
  isDigit(char: string) {
    const charCode = char.charCodeAt(0);
    return charCode >= charSet.Numbers[0] && charCode <= charSet.Numbers[1];
  },
  splitWords(text: string) {
    if (!text || text.length === 0) {
      return [];
    }

    const result: string[] = [];
    let currentWord = "";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // 检查是否为英文字母
      if (literal.isEnglish(char)) {
        // 如果当前字符是英文字母，添加到当前单词中
        currentWord += char;
      } else {
        // 如果当前字符不是英文字母
        // 1. 先保存之前的英文单词（如果有的话）
        if (currentWord.length > 0) {
          result.push(currentWord);
          currentWord = "";
        }

        // 2. 添加当前非英文字符
        result.push(char);
      }
    }

    // 处理最后一个单词（如果字符串以英文字母结尾）
    if (currentWord.length > 0) {
      result.push(currentWord);
    }

    return result;
  },
};
