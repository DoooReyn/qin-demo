import { Node } from "cc";

import { mock } from "../ability";
import { Atom } from "./atom";
import { IUIView } from "../dependency/ui.typings";
import ioc from "../ioc";

/** 绑定类型 */
export type UIBindingKind = "node" | "component" | "components";

/** 绑定配置基类 */
export interface BaseBindingSpec {
  /** 相对于根节点的路径，例如 "."、"Header/BtnClose" */
  path: string;
  /** 是否必需，默认 true；false 时找不到返回 null/[] 而不是报错 */
  required?: boolean;
}

/** 绑定到单个节点 */
export interface NodeBindingSpec extends BaseBindingSpec {
  kind: "node";
}

/** 绑定到单个组件 */
export interface ComponentBindingSpec<T = any> extends BaseBindingSpec {
  kind: "component";
  component: new (...args: any[]) => T;
}

/** 绑定到多个组件 */
export interface ComponentsBindingSpec<T = any> extends BaseBindingSpec {
  kind: "components";
  component: new (...args: any[]) => T;
}

/** 绑定配置 */
export type UIBindingSpec = NodeBindingSpec | ComponentBindingSpec | ComponentsBindingSpec;

/** 绑定表：key -> 绑定配置 */
export type UIBindingMap = Record<string, UIBindingSpec>;

/** 根据绑定配置推导绑定结果类型 */
export type BindingResult<S extends UIBindingSpec> = S extends ComponentBindingSpec<infer C>
  ? C | null
  : S extends ComponentsBindingSpec<infer C>
  ? C[]
  : S extends NodeBindingSpec
  ? Node | null
  : unknown;

/** 根据绑定表推导最终引用字典类型 */
export type BindingRefs<M extends UIBindingMap> = {
  [K in keyof M]: BindingResult<M[K]>;
};

/**
 * UI 控制器基类
 * - 继承 Atom，接入框架的生命周期
 * - 实现 IUIView 接口，提供空实现，方便子类按需覆写
 * - 支持通过 defineBindings 声明式绑定节点/组件，结果存放于 this._refs
 */
@mock.decorator.ccclass("UIController")
export abstract class UIController<M extends UIBindingMap = {}> extends Atom implements IUIView {
  /** 视图引用字典（根据绑定配置自动生成） */
  protected refs!: BindingRefs<M>;

  /** 子类可覆写，返回绑定配置表 */
  protected defineBindings(): M {
    return {} as M;
  }

  onViewCreated(): void {
    const spec = this.defineBindings();
    this.refs = this.__bindView(this.node, spec) as BindingRefs<M>;
  }

  onViewWillAppear(params?: any): void {
    void params;
  }

  onViewDidAppear(): void {}

  onViewWillDisappear(): void {}

  onViewDidDisappear(): void {}

  onViewDisposed(): void {
    this.refs = null;
  }

  onViewFocus(): void {}

  protected back() {
    ioc.ui.back();
  }

  /**
   * 根据绑定配置解析节点/组件引用
   */
  private __bindView(root: Node, spec: UIBindingMap): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(spec)) {
      const conf = spec[key];
      const required = conf.required ?? true;

      // 1. 路径解析到节点
      const node = this.__resolveNode(root, conf.path);
      if (!node) {
        if (required) {
          // 必需但未找到：给出警告，方便调试
          console.warn(`UIController.bindView: path not found, key=${key}, path=${conf.path}`);
        }
        // 根据 kind 返回 null 或空数组
        result[key] = conf.kind === "components" ? [] : null;
        continue;
      }

      // 2. 根据 kind 绑定
      switch (conf.kind) {
        case "node": {
          result[key] = node;
          break;
        }
        case "component": {
          result[key] = node.getComponent(conf.component) ?? null;
          break;
        }
        case "components": {
          result[key] = node.getComponents(conf.component);
          break;
        }
      }
    }

    return result;
  }

  /**
   * 简单路径解析："." 或 "A/B/C"
   */
  private __resolveNode(root: Node, path: string): Node | null {
    if (!path || path === ".") {
      return root;
    }

    const segments = path.split("/").filter(Boolean);
    let current: Node | null = root;
    for (const name of segments) {
      if (!current) {
        return null;
      }
      current = current.getChildByName(name);
    }
    return current;
  }
}
