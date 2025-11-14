import { IRedDotRule } from "./reddot.typings";
import ioc from "../ioc";

/**
 * 数字红点规则 - 当数字大于0时显示红点
 */
export class NumberRule implements IRedDotRule {
  /**
   * 评估红点是否应该显示
   * @param data 红点数据，应包含 count 属性
   * @returns 是否显示红点
   */
  evaluate(data: any): boolean {
    if (!data || typeof data.count !== "number") {
      return false;
    }
    return data.count > 0;
  }
}

/**
 * 布尔红点规则 - 当布尔值为true时显示红点
 */
export class BooleanRule implements IRedDotRule {
  /**
   * 评估红点是否应该显示
   * @param data 红点数据，应包含 visible 属性
   * @returns 是否显示红点
   */
  evaluate(data: any): boolean {
    if (!data || typeof data.visible !== "boolean") {
      return false;
    }
    return data.visible;
  }
}

/**
 * 存在性红点规则 - 当数据存在且不为空时显示红点
 */
export class ExistenceRule implements IRedDotRule {
  /**
   * 评估红点是否应该显示
   * @param data 红点数据
   * @returns 是否显示红点
   */
  evaluate(data: any): boolean {
    return data !== null && data !== undefined && data !== "";
  }
}

/**
 * 自定义阈值红点规则
 */
export class ThresholdRule implements IRedDotRule {
  /**
   * 构造函数
   * @param threshold 阈值
   * @param property 数据属性名
   * @param operator 比较操作符
   */
  constructor(
    private threshold: number,
    private property: string = "count",
    private operator: ">" | "<" | ">=" | "<=" | "==" | "!=" = ">"
  ) {}

  /**
   * 评估红点是否应该显示
   * @param data 红点数据
   * @returns 是否显示红点
   */
  evaluate(data: any): boolean {
    if (!data || typeof data[this.property] !== "number") {
      return false;
    }

    const value = data[this.property];
    switch (this.operator) {
      case ">":
        return value > this.threshold;
      case "<":
        return value < this.threshold;
      case ">=":
        return value >= this.threshold;
      case "<=":
        return value <= this.threshold;
      case "==":
        return value == this.threshold;
      case "!=":
        return value != this.threshold;
      default:
        return false;
    }
  }
}

/**
 * 自定义评估方法红点规则
 */
export class CustomRule implements IRedDotRule {
  /**
   * 构造函数
   * @param evaluator 自定义评估函数
   */
  constructor(private evaluator: (data: any) => boolean) {}

  /**
   * 评估红点是否应该显示
   * @param data 红点数据
   * @returns 是否显示红点
   */
  evaluate(data: any): boolean {
    try {
      return this.evaluator(data);
    } catch (error) {
      ioc.logcat?.red.e("自定义红点规则评估失败:", error);
      return false;
    }
  }
}
