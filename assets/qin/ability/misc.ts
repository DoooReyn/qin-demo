import { IAbility } from "./ability";
import {
  Camera,
  Component,
  isValid,
  Layout,
  misc as M,
  Node,
  Sprite,
  Texture2D,
  UITransform,
  Vec2,
  Vec3,
  Widget,
} from "cc";
import { might } from "./might";
import { platform } from "./platform";

/**
 * 杂项能力接口
 */
export interface IMisc extends IAbility {
  /** 默认上下文 */
  ctx: object;
  /** 空转方法 */
  idle(..._: any): void;
  /**
   * 防抖
   * - 当事件被触发后，要等待一段时间后才执行函数
   * - 如果在等待时间内再次触发事件，将重新计时
   * - 应用场景：
   *      - 实时监听输入事件
   *      - 防止用户多次点击按钮
   * @param fn 执行函数
   * @param context 执行上下文
   * @param delay 延迟时间
   */
  debounce(fn: Function, context?: any, delay?: number): Function;
  /**
   * 节流
   * - 当事件被触发后，等待一段时间后才执行函数
   * - 如果在等待时间内再次触发事件，将忽略本次触发
   * - 应用场景：
   *      - 监听鼠标移动事件
   *      - 监听滚动事件
   * @param fn 执行函数
   * @param context 执行上下文
   * @param delay 延迟时间
   */
  throttle(fn: Function, context?: any, delay?: number): Function;
  /**
   * 下一帧运行
   * @param cb 回调
   */
  nextTick(cb: () => void): void;
  /** 禁止调试 */
  ban(): void;
  /**
   * 获取节点路径
   * @param node 节点
   * @returns 节点路径
   */
  getNodeUrl(node: Node, relative: Node): string;
  /**
   * 屏幕坐标系转世界坐标系
   * @param camera 相机
   * @param screen 屏幕坐标
   * @returns
   */
  screenToWorld(screen: Vec2 | Vec3, camera: Camera): Vec3;
  /**
   * 世界坐标系转屏幕坐标系
   * @param camera 相机
   * @param world 世界坐标
   * @returns
   */
  worldToScreen(world: Vec2 | Vec3, camera: Camera): Vec3;
  /**
   * 触点是否落在目标节点内
   * @param touch 触点
   * @param node 目标节点
   * @returns
   */
  hitTest(touch: Vec2, node: Node): boolean;
  /**
   * 坐标系转换（世界坐标转换到节点坐标）
   * @param src 待转换坐标节点
   * @param dst 目标节点
   */
  convertToNodeSpace(src: Node, dst: Node): Vec3;
  /**
   * 坐标系转换 (节点坐标转换到世界坐标)
   * @param src 待转换坐标节点
   */
  convertToWorldSpace(src: Node): Vec3;
  /**
   * 节点置灰
   * @param node 目标节点
   * @param gray 是否置灰
   * @param recursive 是否递归（默认是）
   */
  setGray(node: Node, gray: boolean, recursive: boolean): void;
  /**
   * 对贴图开启/关闭抗锯齿
   * @param tex 贴图
   * @param enabled 是否启用抗锯齿
   */
  setAntiAliasing(tex: Texture2D, enabled: boolean): void;
  /**
   * 刷新根节点以下所有对齐组件
   * @param root 根节点
   */
  updateAlignment(root: Node): void;
  /**
   * 刷新根节点以下所有布局组件
   * @param root 根节点
   */
  updateLayout(root: Node): void;
}

/**
 * 杂项能力实现
 */
export const misc: IMisc = {
  name: "Misc",
  description: "杂项能力",
  ctx: {},
  idle(..._: any) {},
  debounce(fn: Function, context?: any, delay: number = 300) {
    context ??= misc.ctx;
    let timer: number | null = null;
    return function (...args: any[]) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
        timer = null;
      }, delay);
    };
  },
  throttle(fn: Function, context?: any, delay: number = 300) {
    context ??= misc.ctx;
    let valid: boolean | null = true;
    let timer: number | null = null;
    return function (...args: any[]) {
      if (!valid) return;
      if (timer) clearTimeout(timer);
      valid = false;
      timer = setTimeout(function () {
        fn.apply(context, args);
        timer = null;
        valid = null;
      }, delay);
    };
  },
  nextTick(cb: () => void) {
    M.callInNextTick(function () {
      might.sync(cb);
    });
  },
  ban() {
    if (platform.browser) {
      document.oncontextmenu = function () {
        return false;
      };
      document.onkeydown = document.onkeyup = function (e) {
        if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
          return false;
        }
      };
      (() => {
        const a = ["c", "o", "n", "s", "t", "r", "u", "c", "t", "o", "r"].join(
          ""
        );
        const b = ["d", "e", "b", "b", "u", "g", "g", "e", "r"].join("");
        const c = ["c", "a", "l", "l"].join("");
        const exec = () => setInterval(() => (<any>exec)[a](b)[c](), 50);
        might.sync(exec);
      })();
    }
  },
  getNodeUrl(node: Node, relative: Node) {
    const path: string[] = [];
    while (node.parent) {
      path.unshift(node.name);
      if (node.parent == relative) {
        break;
      }
      node = node.parent;
    }
    return path.join("/");
  },
  screenToWorld(screen: Vec2 | Vec3, camera: Camera) {
    if (screen instanceof Vec2) {
      screen = screen.toVec3();
    }
    return camera.screenToWorld(screen);
  },
  worldToScreen(world: Vec2 | Vec3, camera: Camera) {
    if (world instanceof Vec2) {
      world = world.toVec3();
    }
    return camera.worldToScreen(world);
  },
  hitTest(touch: Vec2, node: Node) {
    return node && node.isValid && node._uiProps.uiTransformComp.hitTest(touch);
  },
  convertToNodeSpace(src: Node, dst: Node) {
    const wps = src.parent!._uiProps.uiTransformComp.convertToWorldSpaceAR(
      src.position
    );
    return dst._uiProps.uiTransformComp.convertToNodeSpaceAR(wps);
  },
  convertToWorldSpace(src: Node) {
    return src.parent!._uiProps.uiTransformComp.convertToWorldSpaceAR(
      src.position
    );
  },
  setGray(node: Node, gray: boolean, recursive: boolean = true) {
    if (recursive) {
      const all = node.getComponentsInChildren(Sprite);
      all.forEach((sprite) => {
        if (sprite && sprite.isValid && sprite.enabled) {
          sprite.grayscale = gray;
        }
      });
    } else {
      const sprite = node.getComponent(Sprite);
      if (sprite && sprite.isValid && sprite.enabled) {
        sprite.grayscale = gray;
      }
    }
  },
  setAntiAliasing(tex: Texture2D, enabled: boolean) {
    const { LINEAR, NEAREST } = Texture2D.Filter;
    let filter = enabled ? LINEAR : NEAREST;
    tex && tex.setFilters(filter, filter);
  },
  updateAlignment(root: Node) {
    if (root && isValid(root)) {
      root
        .getComponentsInChildren(Widget)
        .forEach((w) => w.isValid && w.enabled && w.updateAlignment());
    }
  },
  updateLayout(root: Node) {
    if (root && isValid(root)) {
      root
        .getComponentsInChildren(Layout)
        .forEach((w) => w.isValid && w.enabled && w.updateLayout(true));
    }
  },
};
