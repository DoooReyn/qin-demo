import { sys } from "cc";
import { IAbility } from "./ability";

/**
 * 平台鉴定能力接口
 * @description 提供平台鉴定能力，包括操作系统、平台、环境等信息。
 */
export interface IPlatform extends IAbility {
  /** 操作系统名称 */
  os: string;
  /** 平台名称 */
  platform: string;
  /** 是否原生设备环境 */
  native: boolean;
  /** 是否为移动设备环境 */
  mobile: boolean;
  /** 是否为浏览器环境 */
  browser: boolean;
  /** 是否为桌面环境 */
  desktop: boolean;
  /** 是否为macos环境 */
  macos: boolean;
  /** 是否为windows环境 */
  windows: boolean;
  /** 是否为linux环境 */
  linux: boolean;
  /** 是否为android环境 */
  android: boolean;
  /** 是否为ios环境 */
  ios: boolean;
  /** 是否为web环境 */
  web: boolean;
  /** 是否为移动设备原生环境 */
  mobileNative: boolean;
  /** 是否为桌面设备原生环境 */
  desktopNative: boolean;
  /** 是否为ios设备原生环境 */
  iosNative: boolean;
  /** 是否为android设备原生环境 */
  androidNative: boolean;
  /** 是否为ohos设备原生环境 */
  ohosNative: boolean;
  /** 是否为移动设备浏览器环境 */
  mobileBrowser: boolean;
  /** 是否为桌面设备浏览器环境 */
  desktopBrowser: boolean;
  /** 是否为ios设备浏览器环境 */
  iosBrowser: boolean;
  /** 是否为android设备浏览器环境 */
  androidBrowser: boolean;
  /** 是否为ohos设备浏览器环境 */
  ohosBrowser: boolean;
  /** 是否为微信小游戏环境 */
  wxGame: boolean;
  /** 是否为华为小游戏环境 */
  hwGame: boolean;
  /** 是否为支付宝小游戏环境 */
  zfbGame: boolean;
  /** 是否为小米小游戏环境 */
  xmGame: boolean;
  /** 是否为抖音小游戏环境 */
  dyGame: boolean;
  /** 是否为淘宝小游戏环境 */
  tbGame: boolean;
  /** 是否为荣耀小游戏环境 */
  honorGame: boolean;
  /** 是否为OPPO小游戏环境 */
  oppoGame: boolean;
  /** 是否为VIVO小游戏环境 */
  vivoGame: boolean;
  /** 是否小端字节序 */
  littleEndian: boolean;
}

/**
 * 平台鉴定能力实现
 */
export const platform: IPlatform = {
  name: "Platform",
  description: "平台鉴定",
  os: sys.os,
  platform: sys.platform,
  littleEndian: sys.isLittleEndian,
  native: sys.isNative,
  mobile: sys.isMobile,
  browser: sys.isBrowser,
  macos: sys.OS.OSX === sys.os,
  windows: sys.OS.WINDOWS === sys.os,
  linux: sys.OS.LINUX === sys.os,
  get desktop(): boolean {
    return platform.macos || platform.windows || platform.linux;
  },
  android: sys.OS.ANDROID === sys.os,
  ios: sys.OS.IOS === sys.os,
  web: sys.isBrowser,
  mobileNative: sys.isMobile && sys.isNative,
  get desktopNative(): boolean {
    return platform.desktop && sys.isNative;
  },
  iosNative: sys.OS.IOS === sys.os && sys.isNative,
  androidNative: sys.OS.ANDROID === sys.os && sys.isNative,
  ohosNative: sys.OS.OHOS === sys.os && sys.isNative,
  mobileBrowser: sys.isMobile && sys.isBrowser,
  get desktopBrowser(): boolean {
    return platform.desktop && sys.isBrowser;
  },
  iosBrowser: sys.OS.IOS === sys.os && sys.isBrowser,
  androidBrowser: sys.OS.ANDROID === sys.os && sys.isBrowser,
  ohosBrowser: sys.OS.OHOS === sys.os && sys.isBrowser,
  wxGame: sys.platform === sys.Platform.WECHAT_GAME,
  hwGame: sys.platform === sys.Platform.HUAWEI_QUICK_GAME,
  zfbGame: sys.platform === sys.Platform.ALIPAY_MINI_GAME,
  xmGame: sys.platform === sys.Platform.XIAOMI_QUICK_GAME,
  dyGame: sys.platform === sys.Platform.BYTEDANCE_MINI_GAME,
  tbGame: sys.platform === sys.Platform.TAOBAO_MINI_GAME,
  honorGame: sys.platform === sys.Platform.HONOR_MINI_GAME,
  oppoGame: sys.platform === sys.Platform.OPPO_MINI_GAME,
  vivoGame: sys.platform === sys.Platform.VIVO_MINI_GAME,
};
