/**
 * 红点管理系统使用示例
 */

import { ioc } from "../qin/ioc";
import { NumberRule, BooleanRule, ThresholdRule } from "../qin/dependency/reddot.rule";
import { RedDotStyle } from "../qin/dependency/reddot.typings";

/**
 * 红点系统使用示例
 */
export class RedDotExample {
  /**
   * 初始化红点配置
   */
  static initRedDots(): void {
    // 注册消息红点（数字样式）
    ioc.red.register({
      id: "message.new",
      style: RedDotStyle.NUMBER,
      rule: new NumberRule(),
      autoClear: true,
      persistent: true,
    });

    // 注册设置红点（角标样式）
    ioc.red.register({
      id: "settings.update",
      style: RedDotStyle.BADGE,
      rule: new BooleanRule(),
      autoClear: false,
      persistent: false,
    });

    // 注册系统红点（图标样式）
    ioc.red.register({
      id: "system.warning",
      style: RedDotStyle.ICON,
      rule: new ThresholdRule(3, "level", ">="),
      autoClear: false,
      persistent: true,
    });

    // 注册父级红点（消息总览）
    ioc.red.register({
      id: "message.all",
      style: RedDotStyle.NUMBER,
      rule: new NumberRule(),
      autoClear: false,
      persistent: true,
    });

    // 建立父子关系
    ioc.red.register({
      id: "message.chat",
      style: RedDotStyle.NUMBER,
      rule: new NumberRule(),
      autoClear: true,
      persistent: true,
      parent: "message.all",
    });

    ioc.red.register({
      id: "message.notification",
      style: RedDotStyle.NUMBER,
      rule: new NumberRule(),
      autoClear: true,
      persistent: true,
      parent: "message.all",
    });
  }

  /**
   * 更新红点数据示例
   */
  static updateRedDotData(): void {
    // 更新消息红点
    ioc.red.updateData("message.new", { count: 5 });

    // 更新设置红点
    ioc.red.updateData("settings.update", { visible: true });

    // 更新系统警告红点
    ioc.red.updateData("system.warning", { level: 4 });

    // 批量更新
    ioc.red.batchUpdate([
      { id: "message.chat", data: { count: 3 } },
      { id: "message.notification", data: { count: 2 } },
    ]);
  }

  /**
   * 监听红点状态变化示例
   */
  static subscribeRedDotChanges(): void {
    // 监听消息红点
    const unsubscribeMessage = ioc.red.subscribe("message.new", (event) => {
      console.log(`消息红点状态: ${event.visible}, 数据:`, event.data);
      // 更新UI显示
      this.updateUI("message.new", event.visible, event.data);
    });

    // 监听消息总览红点
    const unsubscribeAll = ioc.red.subscribe("message.all", (event) => {
      console.log(`消息总览红点状态: ${event.visible}`);
      this.updateUI("message.all", event.visible, event.data);
    });

    // 在组件销毁时取消监听
    // unsubscribeMessage();
    // unsubscribeAll();
  }

  /**
   * 处理红点点击事件示例
   */
  static handleRedDotClick(): void {
    // 点击消息红点
    ioc.red.onClick("message.new");

    // 点击设置红点（不会自动清除）
    ioc.red.onClick("settings.update");

    // 手动清除设置红点
    ioc.red.clear("settings.update");
  }

  /**
   * 获取红点状态示例
   */
  static getRedDotStates(): void {
    // 获取单个红点状态
    const messageVisible = ioc.red.getState("message.new");
    console.log("消息红点是否显示:", messageVisible);

    // 获取红点数据
    const messageData = ioc.red.getData("message.new");
    console.log("消息红点数据:", messageData);

    // 获取所有红点状态
    const allStates = ioc.red.getAllStates();
    console.log("所有红点状态:", allStates);
  }

  /**
   * 更新UI显示
   * @param id 红点ID
   * @param visible 是否可见
   * @param data 红点数据
   */
  private static updateUI(id: string, visible: boolean, data?: any): void {
    // 这里根据具体的UI框架来更新红点显示
    // 例如：更新按钮上的红点组件
    console.log(`更新UI: ${id} 红点 ${visible ? "显示" : "隐藏"}`, data);
  }

  /**
   * 与事件总线集成的示例
   */
  static integrateWithEventBus(): void {
    // 监听全局红点变化事件
    if (ioc.eventBus) {
      const listener = {
        event: "reddot:change",
        handle: (event: any) => {
          console.log("全局红点变化事件:", event);
          // 可以在这里处理跨模块的红点状态同步
        },
      };
      ioc.eventBus.shared.subscribe(listener);
    }
  }

  /**
   * 清理红点示例
   */
  static cleanup(): void {
    // 清除特定红点
    ioc.red.clear("message.new");

    // 注销红点（通常在模块卸载时使用）
    ioc.red.unregister("system.warning");
  }
}
