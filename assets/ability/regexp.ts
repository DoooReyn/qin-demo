import { IAbility } from "./ability";

/** 常用正则表达式 */
const EXPRESSIONS = {
  /** 正则：去除多余的空格 */
  TRIM_SPACES: /\s+/g,
  /** 正则：邮箱 */
  EMAIL: /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(\.[a-zA-Z0-9_-])+/,
  /** 正则：密码 */
  PASSWORD: /^[0-9a-zA-Z@#$]+$/,
  /** 正则：中国大陆身份证号码 */
  ID_CARD:
    /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
  /** 正则：URL地址 */
  URL: /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i,
  /** 正则：IPv4地址 */
  IPV4: /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
  /** 正则：IPv6地址 */
  IPV6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
  /** 正则：中文字符 */
  CHINESE: /[\u4e00-\u9fa5]/g,
  /** 正则：纯中文字符 */
  CHINESE_ONLY: /^[\u4e00-\u9fa5]+$/,
  /** 正则：数字 */
  NUMBER: /^\d+$/,
  /** 正则：整数（包括负数） */
  INTEGER: /^-?\d+$/,
  /** 正则：浮点数 */
  FLOAT: /^-?\d+(\.\d+)?$/,
  /** 正则：正整数 */
  POSITIVE_INTEGER: /^[1-9]\d*$/,
  /** 正则：非负整数 */
  NON_NEGATIVE_INTEGER: /^\d+$/,
  /** 正则：银行卡号 */
  BANK_CARD: /^[1-9]\d{12,19}$/,
  /** 正则：QQ号 */
  QQ: /^[1-9][0-9]{4,10}$/,
  /** 正则：微信号 */
  WECHAT: /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/,
  /** 正则：车牌号 */
  LICENSE_PLATE:
    /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4}[A-Z0-9挂学警港澳]$/,
  /** 正则：日期格式 YYYY-MM-DD */
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  /** 正则：时间格式 HH:MM:SS */
  TIME: /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/,
  /** 正则：日期时间格式 YYYY-MM-DD HH:MM:SS */
  DATETIME: /^\d{4}-\d{2}-\d{2} ([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/,
  /** 正则：HTML标签 */
  HTML_TAG: /<[^>]+>/g,
  /** 正则：十六进制颜色值 */
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  /** 正则：MAC地址 */
  MAC_ADDRESS: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
  /** 正则：Base64编码 */
  BASE64: /^[A-Za-z0-9+/]*={0,2}$/,
  /** 正则：版本号 */
  VERSION: /^\d+\.\d+\.\d+$/,
  /** 正则：文件扩展名 */
  FILE_EXTENSION: /\.[^.]+$/,
  /** 正则：域名 */
  DOMAIN:
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  /** 正则：端口号 */
  PORT: /^([1-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/,
  /** 正则：邮政编码 */
  POSTAL_CODE: /^[1-9]\d{5}$/,
  /** 正则：用户名（字母开头，允许字母数字下划线，3-16位） */
  USERNAME: /^[a-zA-Z][a-zA-Z0-9_]{2,15}$/,
  /** 正则：强密码（至少包含大小写字母、数字和特殊字符） */
  STRONG_PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  /** 正则：emoji表情 */
  EMOJI:
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
  /** 正则：国家代码和手机号格式校验正则表达式的映射关系 */
  PHONE_BY_COUNTRY_CODE: {
    "244": /^\+2449\d{8}$/,
    "93": /^\+93\d{9}$/,
    "355": /^\+355\d{8,9}$/,
    "213": /^\+213\d{9}$/,
    "376": /^\+376\d{6}$/,
    "1264": /^\+1264\d{7}$/,
    "1268": /^\+1268\d{7}$/,
    "54": /^\+54\d{10}$/,
    "374": /^\+374\d{8}$/,
    "247": /^\+247\d{5}$/,
    "61": /^\+61\d{9}$/,
    "43": /^\+43\d{10}$/,
    "994": /^\+994\d{9}$/,
    "1242": /^\+1242\d{7}$/,
    "973": /^\+973\d{7}$/,
    "880": /^\+880\d{10}$/,
    "1246": /^\+1246\d{7}$/,
    "375": /^\+375\d{9}$/,
    "32": /^\+32\d{9}$/,
    "501": /^\+501\d{7}$/,
    "229": /^\+229\d{7}$/,
    "1441": /^\+1441\d{7}$/,
    "591": /^\+591\d{7,8}$/,
    "267": /^\+267\d{7}$/,
    "55": /^\+55\d{11}$/,
    "673": /^\+673\d{6}$/,
    "359": /^\+359\d{9}$/,
    "226": /^\+226\d{7}$/,
    "95": /^\+95\d{8,9}$/,
    "257": /^\+257\d{7}$/,
    "237": /^\+237\d{8}$/,
    "1": /^\+1\d{10}$/,
    "1345": /^\+1345\d{7}$/,
    "236": /^\+236\d{8}$/,
    "235": /^\+235\d{8}$/,
    "56": /^\+56\d{9}$/,
    "86": /^\+86\d{11}$/,
    "57": /^\+57\d{10}$/,
    "242": /^\+242\d{9}$/,
    "682": /^\+682\d{4}$/,
    "506": /^\+506\d{8}$/,
    "53": /^\+53\d{8}$/,
    "357": /^\+357\d{8}$/,
    "420": /^\+420\d{9}$/,
    "45": /^\+45\d{8}$/,
    "253": /^\+253\d{6}$/,
    "1890": /^\+1890\d{7}$/,
    "593": /^\+593\d{9}$/,
    "20": /^\+20\d{9}$/,
    "503": /^\+503\d{8}$/,
    "372": /^\+372\d{7}$/,
    "251": /^\+251\d{9}$/,
    "679": /^\+679\d{7}$/,
    "358": /^\+358\d{9}$/,
    "33": /^\+33\d{9}$/,
    "594": /^\+594\d{9}$/,
    "241": /^\+241\d{6}$/,
    "220": /^\+220\d{7}$/,
    "995": /^\+995\d{9}$/,
    "49": /^\+49\d{11}$/,
    "233": /^\+233\d{9}$/,
    "350": /^\+350\d{8}$/,
    "30": /^\+30\d{10}$/,
    "1809": /^\+1809\d{7}$/,
    "1671": /^\+1671\d{7}$/,
    "502": /^\+502\d{8}$/,
    "224": /^\+224\d{8}$/,
    "592": /^\+592\d{7}$/,
    "509": /^\+509\d{8}$/,
    "504": /^\+504\d{8}$/,
    "852": /^\+852\d{8}$/,
    "36": /^\+36\d{8}$/,
    "354": /^\+354\d{7}$/,
    "91": /^\+91\d{10}$/,
    "62": /^\+62\d{9,12}$/,
    "98": /^\+98\d{9,10}$/,
    "964": /^\+964\d{10}$/,
    "353": /^\+353\d{9}$/,
    "972": /^\+972\d{9}$/,
    "39": /^\+39\d{10}$/,
    "225": /^\+225\d{8}$/,
    "1876": /^\+1876\d{7}$/,
    "81": /^\+81\d{10}$/,
    "962": /^\+962\d{9}$/,
    "855": /^\+855\d{8,9}$/,
    "327": /^\+327\d{9}$/,
    "254": /^\+254\d{9}$/,
    "82": /^\+82\d{9,10}$/,
    "965": /^\+965\d{8}$/,
    "331": /^\+331\d{8}$/,
    "856": /^\+856\d{8,9}$/,
    "371": /^\+371\d{8}$/,
    "961": /^\+961\d{7,8}$/,
    "266": /^\+266\d{8}$/,
    "231": /^\+231\d{7}$/,
    "218": /^\+218\d{9}$/,
    "423": /^\+423\d{7}$/,
    "370": /^\+370\d{8}$/,
    "352": /^\+352\d{8}$/,
    "853": /^\+853\d{8}$/,
    "261": /^\+261\d{9}$/,
    "265": /^\+265\d{7}$/,
    "60": /^\+60\d{9,10}$/,
    "960": /^\+960\d{7}$/,
    "223": /^\+223\d{8}$/,
    "356": /^\+356\d{8}$/,
    "1670": /^\+1670\d{7}$/,
    "596": /^\+596\d{9}$/,
    "230": /^\+230\d{7}$/,
    "52": /^\+52\d{10}$/,
    "373": /^\+373\d{7}$/,
    "377": /^\+377\d{8}$/,
    "976": /^\+976\d{8}$/,
    "1664": /^\+1664\d{7}$/,
    "212": /^\+212\d{9}$/,
    "258": /^\+258\d{9}$/,
    "264": /^\+264\d{9}$/,
    "674": /^\+674\d{5}$/,
    "977": /^\+977\d{9}$/,
    "599": /^\+599\d{7}$/,
    "31": /^\+31\d{9}$/,
    "64": /^\+64\d{9}$/,
    "505": /^\+505\d{8}$/,
    "227": /^\+227\d{8}$/,
    "234": /^\+234\d{10}$/,
    "850": /^\+850\d{8}$/,
    "47": /^\+47\d{8}$/,
    "968": /^\+968\d{8}$/,
    "92": /^\+92\d{10}$/,
    "507": /^\+507\d{7}$/,
    "675": /^\+675\d{9}$/,
    "595": /^\+595\d{8}$/,
    "51": /^\+51\d{9}$/,
    "63": /^\+63\d{10}$/,
    "48": /^\+48\d{9}$/,
    "689": /^\+689\d{6}$/,
    "351": /^\+351\d{9}$/,
    "1787": /^\+1787\d{7}$/,
    "974": /^\+974\d{7}$/,
    "262": /^\+262\d{9}$/,
    "40": /^\+40\d{9}$/,
    "7": /^\+7\d{10}$/,
    "1758": /^\+1758\d{7}$/,
    "1784": /^\+1784\d{7}$/,
    "684": /^\+684\d{7}$/,
    "685": /^\+685\d{7}$/,
    "378": /^\+378\d{6}$/,
    "239": /^\+239\d{7}$/,
    "966": /^\+966\d{9}$/,
    "221": /^\+221\d{9}$/,
    "248": /^\+248\d{7}$/,
    "232": /^\+232\d{8}$/,
    "65": /^\+65\d{8}$/,
    "421": /^\+421\d{9}$/,
    "386": /^\+386\d{8}$/,
    "677": /^\+677\d{5}$/,
    "252": /^\+252\d{7}$/,
    "27": /^\+27\d{9}$/,
    "34": /^\+34\d{9}$/,
    "94": /^\+94\d{9}$/,
    "249": /^\+249\d{9}$/,
    "597": /^\+597\d{7}$/,
    "268": /^\+268\d{7}$/,
    "46": /^\+46\d{9}$/,
    "41": /^\+41\d{9}$/,
    "963": /^\+963\d{9}$/,
    "886": /^\+886\d{9}$/,
    "992": /^\+992\d{9}$/,
    "255": /^\+255\d{9}$/,
    "66": /^\+66\d{9}$/,
    "228": /^\+228\d{8}$/,
    "676": /^\+676\d{5}$/,
    "216": /^\+216\d{8}$/,
    "90": /^\+90\d{10}$/,
    "993": /^\+993\d{8}$/,
    "256": /^\+256\d{9}$/,
    "380": /^\+380\d{9}$/,
    "971": /^\+971\d{9}$/,
    "44": /^\+44\d{10,11}$/,
    "598": /^\+598\d{8}$/,
    "58": /^\+58\d{10}$/,
    "84": /^\+84\d{9}$/,
    "967": /^\+967\d{9}$/,
    "381": /^\+381\d{8,9}$/,
    "263": /^\+263\d{9}$/,
    "243": /^\+243\d{9}$/,
    "260": /^\+260\d{9}$/,
  },
} as const;

/**
 * 正则表达式能力接口
 * @description 提供常用正则表达式的校验和操作方法
 */
export interface IRegExp extends IAbility {
  /**
   * 去除首尾空格
   * @param str 字符串
   */
  trim(str: string): string;
  /**
   * 去除所有空格
   * @param str 字符串
   */
  trimSpaces(str: string): string;
  /**
   * 校验邮箱格式
   * @param email 邮箱
   */
  isEmail(email: string): boolean;
  /**
   * 根据国际区号对手机号进行格式校验
   * @param phoneNumber 手机号
   * @param countryCode 国际区号
   */
  isPhoneNo(
    phoneNumber: string,
    countryCode: keyof typeof EXPRESSIONS.PHONE_BY_COUNTRY_CODE
  ): boolean;
  /**
   * 密码格式校验
   * @param password 密码
   * @param min 最小长度
   * @param max 最大长度
   */
  isPassword(password: string, min: number, max: number): boolean;
  /**
   * 校验中国大陆身份证号码
   * @param idCard 身份证号码
   */
  isIdCard(idCard: string): boolean;
  /**
   * 校验URL地址
   * @param url URL地址
   */
  isUrl(url: string): boolean;
  /**
   * 校验IPv4地址
   * @param ip IPv4地址
   */
  isIPv4(ip: string): boolean;
  /**
   * 校验IPv6地址
   * @param ip IPv6地址
   */
  isIPv6(ip: string): boolean;
  /**
   * 检查是否包含中文字符
   * @param str 字符串
   */
  hasChinese(str: string): boolean;
  /**
   * 检查是否为纯中文字符
   * @param str 字符串
   */
  isChineseOnly(str: string): boolean;
  /**
   * 校验是否为数字
   * @param str 字符串
   */
  isDigit(str: string): boolean;
  /**
   * 校验是否为整数
   * @param str 字符串
   */
  isInteger(str: string): boolean;
  /**
   * 校验是否为浮点数
   * @param str 字符串
   */
  isFloat(str: string): boolean;
  /**
   * 校验是否为正整数
   * @param str 字符串
   */
  isPositiveInteger(str: string): boolean;
  /**
   * 校验是否为非负整数
   * @param str 字符串
   */
  isNonNegativeInteger(str: string): boolean;
  /**
   * 校验银行卡号
   * @param cardNumber 银行卡号
   */
  isBankCard(cardNumber: string): boolean;
  /**
   * 校验QQ号
   * @param qq QQ号
   */
  isQQ(qq: string): boolean;
  /**
   * 校验微信号
   * @param wechat 微信号
   */
  isWechat(wechat: string): boolean;
  /**
   * 校验车牌号
   * @param licensePlate 车牌号
   */
  isCarNo(licensePlate: string): boolean;
  /**
   * 校验日期格式 YYYY-MM-DD
   * @param date 日期字符串
   */
  isDate(date: string): boolean;
  /**
   * 校验时间格式 HH:MM:SS
   * @param time 时间字符串
   */
  isTime(time: string): boolean;
  /**
   * 校验日期时间格式 YYYY-MM-DD HH:MM:SS
   * @param datetime 日期时间字符串
   */
  isDateTime(datetime: string): boolean;
  /**
   * 移除HTML标签
   * @param html HTML字符串
   */
  removeHtmlTags(html: string): string;
  /**
   * 校验十六进制颜色值
   * @param color 颜色值
   */
  isHexColor(color: string): boolean;
  /**
   * 校验MAC地址
   * @param mac MAC地址
   */
  isMacAddress(mac: string): boolean;
  /**
   * 校验Base64编码
   * @param base64 Base64字符串
   */
  isBase64(base64: string): boolean;
  /**
   * 校验版本号
   * @param version 版本号
   */
  isVersion(version: string): boolean;
  /**
   * 获取文件扩展名
   * @param filename 文件名
   */
  getFileExtension(filename: string): string | null;
  /**
   * 校验域名
   * @param domain 域名
   */
  isDomain(domain: string): boolean;
  /**
   * 校验端口号
   * @param port 端口号
   */
  isPort(port: string): boolean;
  /**
   * 校验邮政编码
   * @param postalCode 邮政编码
   */
  isPostalCode(postalCode: string): boolean;
  /**
   * 校验用户名
   * @param username 用户名
   */
  isUsername(username: string): boolean;
  /**
   * 校验强密码
   * @param password 密码
   */
  isStrongPassword(password: string): boolean;
  /**
   * 移除emoji表情
   * @param str 字符串
   */
  removeEmoji(str: string): string;
  /**
   * 检查是否包含emoji表情
   * @param str 字符串
   */
  hasEmoji(str: string): boolean;
  /**
   * 提取字符串中的中文字符
   * @param str 字符串
   */
  extractChinese(str: string): string[];
  /**
   * 提取字符串中的数字
   * @param str 字符串
   */
  extractNumbers(str: string): string[];
  /**
   * 提取字符串中的邮箱地址
   * @param str 字符串
   */
  extractEmails(str: string): string[];
  /**
   * 提取字符串中的URL
   * @param str 字符串
   */
  extractUrls(str: string): string[];
  /**
   * 格式化手机号（中国大陆）
   * @param phone 手机号
   */
  formatChinesePhone(phone: string): string;
  /**
   * 格式化银行卡号
   * @param cardNumber 银行卡号
   */
  formatBankCard(cardNumber: string): string;
  /**
   * 脱敏手机号
   * @param phone 手机号
   */
  maskPhone(phone: string): string;
  /**
   * 脱敏身份证号
   * @param idCard 身份证号
   */
  maskIdCard(idCard: string): string;
  /**
   * 脱敏银行卡号
   * @param cardNumber 银行卡号
   */
  maskBankCard(cardNumber: string): string;
}

/**
 * 正则表达式能力实现
 */
export const regexp: IRegExp = {
  name: "RegExp",
  description: "正则表达式能力",
  trim(str: string) {
    return str.trim();
  },
  trimSpaces(str: string) {
    return str.replace(EXPRESSIONS.TRIM_SPACES, "");
  },
  isEmail(email: string): boolean {
    return EXPRESSIONS.EMAIL.test(email);
  },
  isPhoneNo(
    phoneNumber: string,
    countryCode: keyof typeof EXPRESSIONS.PHONE_BY_COUNTRY_CODE
  ): boolean {
    const regex = EXPRESSIONS.PHONE_BY_COUNTRY_CODE[countryCode];
    if (regex) {
      return regex.test(`+${countryCode}${phoneNumber}`);
    } else {
      return false;
    }
  },
  isPassword(password: string, min: number = 6, max: number = 32): boolean {
    // 检查密码长度
    if (password.length < min || password.length > max) {
      return false;
    }

    // 检查密码是否包含不允许的字符
    if (!EXPRESSIONS.PASSWORD.test(password)) {
      return false;
    }

    // 密码格式符合要求
    return true;
  },
  isIdCard(idCard: string): boolean {
    return EXPRESSIONS.ID_CARD.test(idCard);
  },
  isUrl(url: string): boolean {
    return EXPRESSIONS.URL.test(url);
  },
  isIPv4(ip: string): boolean {
    return EXPRESSIONS.IPV4.test(ip);
  },
  isIPv6(ip: string): boolean {
    return EXPRESSIONS.IPV6.test(ip);
  },
  hasChinese(str: string): boolean {
    return EXPRESSIONS.CHINESE.test(str);
  },
  isChineseOnly(str: string): boolean {
    return EXPRESSIONS.CHINESE_ONLY.test(str);
  },
  isDigit(str: string): boolean {
    return EXPRESSIONS.NUMBER.test(str);
  },
  isInteger(str: string): boolean {
    return EXPRESSIONS.INTEGER.test(str);
  },
  isFloat(str: string): boolean {
    return EXPRESSIONS.FLOAT.test(str);
  },
  isPositiveInteger(str: string): boolean {
    return EXPRESSIONS.POSITIVE_INTEGER.test(str);
  },
  isNonNegativeInteger(str: string): boolean {
    return EXPRESSIONS.NON_NEGATIVE_INTEGER.test(str);
  },
  isBankCard(cardNumber: string): boolean {
    return EXPRESSIONS.BANK_CARD.test(cardNumber);
  },
  isQQ(qq: string): boolean {
    return EXPRESSIONS.QQ.test(qq);
  },
  isWechat(wechat: string): boolean {
    return EXPRESSIONS.WECHAT.test(wechat);
  },
  isCarNo(licensePlate: string): boolean {
    return EXPRESSIONS.LICENSE_PLATE.test(licensePlate);
  },
  isDate(date: string): boolean {
    return EXPRESSIONS.DATE.test(date);
  },
  isTime(time: string): boolean {
    return EXPRESSIONS.TIME.test(time);
  },
  isDateTime(datetime: string): boolean {
    return EXPRESSIONS.DATETIME.test(datetime);
  },
  removeHtmlTags(html: string): string {
    return html.replace(EXPRESSIONS.HTML_TAG, "");
  },
  isHexColor(color: string): boolean {
    return EXPRESSIONS.HEX_COLOR.test(color);
  },
  isMacAddress(mac: string): boolean {
    return EXPRESSIONS.MAC_ADDRESS.test(mac);
  },
  isBase64(base64: string): boolean {
    return EXPRESSIONS.BASE64.test(base64);
  },
  isVersion(version: string): boolean {
    return EXPRESSIONS.VERSION.test(version);
  },
  getFileExtension(filename: string): string | null {
    const match = filename.match(EXPRESSIONS.FILE_EXTENSION);
    return match ? match[0] : null;
  },
  isDomain(domain: string): boolean {
    return EXPRESSIONS.DOMAIN.test(domain);
  },
  isPort(port: string): boolean {
    return EXPRESSIONS.PORT.test(port);
  },
  isPostalCode(postalCode: string): boolean {
    return EXPRESSIONS.POSTAL_CODE.test(postalCode);
  },
  isUsername(username: string): boolean {
    return EXPRESSIONS.USERNAME.test(username);
  },
  isStrongPassword(password: string): boolean {
    return EXPRESSIONS.STRONG_PASSWORD.test(password);
  },
  removeEmoji(str: string): string {
    return str.replace(EXPRESSIONS.EMOJI, "");
  },
  hasEmoji(str: string): boolean {
    return EXPRESSIONS.EMOJI.test(str);
  },
  extractChinese(str: string): string[] {
    return str.match(EXPRESSIONS.CHINESE) || [];
  },
  extractNumbers(str: string): string[] {
    return str.match(/\d+/g) || [];
  },
  extractEmails(str: string): string[] {
    return str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  },
  extractUrls(str: string): string[] {
    return str.match(/https?:\/\/[^\s/$.?#].[^\s]*/gi) || [];
  },
  formatChinesePhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
    }
    return phone;
  },
  formatBankCard(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, "");
    return cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
  },
  maskPhone(phone: string): string {
    return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
  },
  maskIdCard(idCard: string): string {
    return idCard.replace(/(\d{6})\d{8}(\d{4})/, "$1********$2");
  },
  maskBankCard(cardNumber: string): string {
    return cardNumber.replace(/(\d{4})\d+(\d{4})/, "$1****$2");
  },
};
