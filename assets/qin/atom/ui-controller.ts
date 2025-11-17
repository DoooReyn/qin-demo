import { Node } from "cc";

import { mock } from "../ability";
import { Atom } from "./atom";
import { IUIView } from "../dependency/ui.typings";
import ioc from "../ioc";

/** 绑定类型 */
export type UIBindingKind = "node" | "nodes" | "component" | "components";

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

/** 绑定到多个节点 */
export interface NodesBindingSpec extends BaseBindingSpec {
  kind: "nodes";
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
export type UIBindingSpec = NodeBindingSpec | NodesBindingSpec | ComponentBindingSpec | ComponentsBindingSpec;

/**
 * 绑定条目：
 * - 对象形式：{ path, kind, component? }
 * - 元组形式：
 *   - [path] 或 [path, "node"]
 *   - [path, "nodes"]
 *   - [path, "component", ComponentCtor]
 *   - [path, "components", ComponentCtor]
 */
export type UIBindingEntry =
  | UIBindingSpec
  | [path: string]
  | [path: string, kind: "node"]
  | [path: string, kind: "nodes"]
  | [path: string, kind: "component", component: new (...args: any[]) => any]
  | [path: string, kind: "components", component: new (...args: any[]) => any];

/** 绑定表：key -> 绑定配置或元组 */
export type UIBindingMap = Record<string, UIBindingEntry>;

/** 根据绑定配置推导绑定结果类型（支持对象与元组两种形式） */
export type BindingResult<S extends UIBindingEntry> =
  // 对象形式：component / components / node
  S extends ComponentBindingSpec<infer C>
    ? C | null
    : S extends ComponentsBindingSpec<infer C>
    ? C[]
    : S extends NodeBindingSpec
    ? Node | null
    : S extends NodesBindingSpec
    ? Node[]
    : // 元组形式：[path] / [path, 'node']
    S extends [string] | [string, "node"]
    ? Node | null
    : S extends [string, "nodes"]
    ? Node[]
    : // 元组形式：[path, 'component', Ctor]
    S extends [string, "component", infer Ctor]
    ? Ctor extends new (...args: any[]) => infer I
      ? I | null
      : unknown
    : // 元组形式：[path, 'components', Ctor]
    S extends [string, "components", infer Ctor]
    ? Ctor extends new (...args: any[]) => infer I
      ? I[]
      : unknown
    : unknown;

/** 根据绑定表推导最终引用字典类型 */
export type BindingRefs<M extends UIBindingMap> = {
  [K in keyof M]: BindingResult<M[K]>;
};

/**
 * UI 控制器基类
 * - 继承 Atom，接入框架的生命周期
 * - 实现 IUIView 接口，提供空实现，方便子类按需覆写
 * - 支持通过 static UiSpec 声明式绑定节点/组件，结果存放于 this._refs
 */
@mock.decorator.ccclass("UIController")
export abstract class UIController<M extends UIBindingMap = {}> extends Atom implements IUIView {
  /** 视图引用字典（根据绑定配置自动生成） */
  protected refs!: BindingRefs<M>;

  onViewCreated(): void {
    const spec = (this.constructor as unknown as { UiSpec: UIBindingMap }).UiSpec ?? {};
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
      const entry = spec[key];

      // 支持元组与对象两种写法，统一规范为对象配置
      let conf: UIBindingSpec;
      if (Array.isArray(entry)) {
        const [path, kindOrUndefined, component] = entry as any[];
        const kind = (kindOrUndefined ?? "node") as UIBindingKind;
        if (kind === "node") {
          conf = { kind: "node", path };
        } else if (kind === "nodes") {
          conf = { kind: "nodes", path };
        } else if (kind === "component") {
          conf = { kind: "component", path, component: component as any };
        } else {
          conf = { kind: "components", path, component: component as any };
        }
      } else {
        conf = entry;
      }
      const required = conf.required ?? true;

      // 1. 特殊语法：前缀匹配节点（仅对 kind === "nodes" 生效）
      if (conf.kind === "nodes") {
        const segments = conf.path.split("/").filter(Boolean);
        const last = segments[segments.length - 1];
        if (last && last.endsWith("#")) {
          const prefix = last.slice(0, -1);
          const parentPath = segments.slice(0, -1).join("/") || ".";
          const parentNode = this.__resolveNode(root, parentPath);
          if (!parentNode) {
            if (required) {
              ioc.logcat.ui.w(
                `UIController.bindView: parent path not found for prefix nodes binding, key=${key}, path=${conf.path}`
              );
            }
            result[key] = [];
            continue;
          }

          const matches = parentNode.children.filter((child) => child.name.startsWith(prefix));
          result[key] = matches;
          continue;
        }
      }

      // 2. 普通路径：解析到单个节点
      const node = this.__resolveNode(root, conf.path);
      if (!node) {
        if (required) {
          // 必需但未找到：给出警告，方便调试
          ioc.logcat.ui.w(`UIController.bindView: path not found, key=${key}, path=${conf.path}`);
        }
        // 根据 kind 返回 null 或空数组
        result[key] = conf.kind === "components" || conf.kind === "nodes" ? [] : null;
        continue;
      }

      // 3. 根据 kind 绑定
      switch (conf.kind) {
        case "node": {
          result[key] = node;
          break;
        }
        case "nodes": {
          result[key] = [node];
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
