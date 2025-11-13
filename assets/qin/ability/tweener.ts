import { Node, Tween, tween } from "cc";

import ioc from "../ioc";
import { might } from "./might";
import { IAbility } from "./ability";

/** 缓动参数 */
export interface ITweenArgs {
  /** 动画时长（单位：秒） */
  duration: number;
  /**
   * 当同一节点上存在相同 lib 的缓动时的处理策略
   * replace: 停掉旧的并替换为新的；skip: 跳过新的，不做任何处理
   */
  existencePolicy?: ExistencePolicy;
  /** 回调函数的 this 上下文；未指定时按照调用处传入 */
  context?: any;
  /** 动画开始 */
  onStart?(target: Node): void;
  /** 动画结束 */
  onEnd?(target: Node): void;
  /** 动画暂停 */
  onPause?(target: Node): void;
  /** 动画恢复 */
  onResume?(target: Node): void;
  /** 动画停止 */
  onStop?(target: Node): void;
  /** 透传的自定义参数，将与注册的默认参数进行浅合并 */
  [k: string]: any;
}

/** 同一节点同名缓动的存在策略 */
export type ExistencePolicy = "replace" | "skip";

/**
 * 缓动条目接口，定义参数与执行入口
 */
export interface ITweenEntry {
  /** 唯一库名，用于标识一种缓动 */
  lib: string;
  /** 该缓动的默认参数（会与调用时参数浅合并） */
  args: ITweenArgs;
  /**
   * 构建实际的 Tween 序列（不需要处理开始/结束回调与注册表写入）
   * @param node 目标节点
   * @param args 缓动参数
   * @returns Tween 实例
   */
  create(node: Node, args: ITweenArgs): Tween<Node>;
}

/** 缓动能力接口 */
export interface ITweener extends IAbility {
  /**
   * 是否已注册某个缓动库
   * @param lib 库名
   * @returns 是否存在注册
   */
  has(lib: string): boolean;
  /**
   * 注册一个缓动库入口
   * @param entry 缓动条目
   */
  register(entry: ITweenEntry): void;
  /**
   * 反注册一个缓动库入口
   * @param entry 缓动条目或库名
   */
  unregister(entry: ITweenEntry | string): void;
  /**
   * 清空所有已注册的缓动库
   */
  clear(): void;
  /**
   * 播放指定节点上的缓动库（根据存在策略决定替换/跳过）
   * @param node 目标节点
   * @param lib 库名
   * @param args 播放参数
   * @returns 异步完成 Promise
   */
  play(node: Node, lib: string, args: ITweenArgs): Promise<void>;
  /**
   * 停止指定节点上的某个缓动
   * @param node 目标节点
   * @param lib 库名
   */
  stop(node: Node, lib: string): void;
  /**
   * 暂停指定节点上的某个缓动
   * @param node 目标节点
   * @param lib 库名
   */
  pause(node: Node, lib: string): void;
  /**
   * 恢复指定节点上的某个缓动
   * @param node 目标节点
   * @param lib 库名
   */
  resume(node: Node, lib: string): void;
  /**
   * 判断指定节点上的某个缓动是否播放中
   * @param node 目标节点
   * @param lib 库名
   * @returns 是否处于播放状态
   */
  isPlaying(node: Node, lib: string): boolean;
  /**
   * 暂停某节点或所有节点上的全部缓动
   * @param node 目标节点（可选）
   */
  pauseAll(node?: Node): void;
  /**
   * 恢复某节点或所有节点上的全部缓动
   * @param node 目标节点（可选）
   */
  resumeAll(node?: Node): void;
  /**
   * 停止某节点或所有节点上的全部缓动
   * @param node 目标节点（可选）
   */
  stopAll(node?: Node): void;
}

/**
 * 已注册的缓动库容器
 * key: lib 名称 -> ITweenEntry
 */
const __container: Map<string, ITweenEntry> = new Map();
/**
 * 运行时缓动表
 * key: 节点 uuid -> Map<lib, [Tween 实例, ITweenArgs]>
 * 其中元组：
 *  - 第 1 项 Tween<Node>: 已封装开始/结束回调的完整序列
 *  - 第 2 项 ITweenArgs: 本次播放的参数（用于回调上下文与事件）
 */
const __tweens: Map<string, Map<string, [Tween<Node>, ITweenArgs]>> = new Map();

/**
 * 内部播放流程
 * 1. 检查 lib 是否已注册；未注册则返回
 * 2. 合并默认参数与调用参数
 * 3. 根据存在策略处理同名缓动（skip/replace）
 * 4. 包装 onStart -> create -> onEnd，顺序组装为一个完整的 sequence
 * 5. 写入运行时表并启动
 */
async function __play(node: Node, lib: string, args: ITweenArgs) {
  return new Promise<void>((resolve) => {
    const entry = __container.get(lib);
    if (!entry) {
      ioc.logcat.tweener.ef(`缓动动画: {0} 未注册，请先注册`, lib);
      return resolve();
    }

    /* 将注册时的默认参数与调用时参数进行浅合并 */
    args = { ...entry.args, ...args };

    if (__tweens.has(node.uuid)) {
      const tweens = __tweens.get(node.uuid);
      if (tweens.has(lib)) {
        if (args.existencePolicy === "skip") {
          ioc.logcat.tweener.ef(`缓动动画: {0} 正在播放中，应用跳过策略`, lib);
          return resolve();
        } else {
          ioc.logcat.tweener.ef(`缓动动画: {0} 正在播放中，应用替换策略`, lib);
          /* 停掉旧实例并触发 onStop，再替换为新的 */
          tweens.get(lib)![0]?.stop();
          tweens.delete(lib);
          const [, e] = might.sync(() => args.onStop?.call(args.context, node));
          if (e) ioc.logcat.tweener.e(`缓动动画: ${lib} onStop 回调异常`, e);
        }
      }
    } else {
      /* 首次在该节点上播放缓动时，创建节点级容器 */
      __tweens.set(node.uuid, new Map());
    }

    /* 进入 onStart 回调（异常由 might 捕获并记录） */
    const t1 = tween(node).call(() => {
      const [, e] = might.sync(() => args.onStart?.call(args.context, node));
      if (e) ioc.logcat.tweener.e(`缓动动画: ${lib} onStart 回调异常`, e);
    });
    /* 由入口构建主体缓动序列 */
    const [t2, createErr] = might.sync(() => entry.create(node, args));
    if (createErr || !t2) {
      ioc.logcat.tweener.e(`缓动动画: ${lib} 构建失败`, createErr);
      return resolve();
    }
    /* 收尾：从运行时表移除并回调 onEnd */
    const t3 = tween(node).call(() => {
      const map = __tweens.get(node.uuid);
      map?.delete(lib);
      const [, e] = might.sync(() => args.onEnd?.call(args.context, node));
      if (e) ioc.logcat.tweener.e(`缓动动画: ${lib} onEnd 回调异常`, e);
      resolve();
    });
    /* 组装完整序列并与节点状态绑定（节点销毁时自动停止） */
    const twn = tween().sequence(t1, t2, t3).target(node).bindNodeState(true);
    /* 写入运行时表并启动 */
    __tweens.get(node.uuid)!.set(lib, [twn, args]);
    twn.start();
  });
}

/**
 * 缓动动画能力
 * @description 用于控制节点上的缓动动画，并提供了缓动动画的注册、播放、暂停、停止等功能。
 * 同时，该模块还支持动画的各种回调函数。
 *
 * @see ITweener 缓动动画接口
 * @see ITweenEntry 缓动动画入口接口
 * @see ITweenArgs 缓动动画参数接口
 */
export const tweener: ITweener = {
  name: "Tweener",
  description: "缓动动画辅助能力",
  /**
   * 查询是否已注册某个缓动库
   * @param lib 库名
   */
  has(lib: string) {
    return __container.has(lib);
  },
  /**
   * 注册缓动库；若已存在则给出警告
   * @param entry 缓动库入口
   */
  register(entry: ITweenEntry) {
    if (__container.has(entry.lib)) {
      ioc.logcat.res.wf("缓动动画: {0} 已注册，请勿重复注册", entry.lib);
    } else {
      __container.set(entry.lib, entry);
    }
  },
  /**
   * 反注册一个缓动库入口
   * @param entry 缓动库入口或库名
   */
  unregister(entry: ITweenEntry | string) {
    if (typeof entry === "string") {
      __container.delete(entry);
    } else {
      __container.delete(entry.lib);
    }
  },
  /**
   * 清空所有已注册的缓动库
   */
  clear() {
    __container.clear();
  },
  /**
   * 判断某节点上的某个缓动是否正在播放
   * @param node 节点实例
   * @param lib 库名
   */
  isPlaying(node: Node, lib: string) {
    if (__tweens.has(node.uuid)) {
      const tweens = __tweens.get(node.uuid);
      if (tweens.has(lib)) {
        return !!tweens.get(lib)![0]?.running;
      }
    }
    return false;
  },
  /**
   * 播放指定缓动库
   * @param node 节点实例
   * @param lib 库名
   * @param args 缓动参数
   */
  async play(node: Node, lib: string, args: ITweenArgs) {
    const [ret, err] = await might.async(__play(node, lib, args));
    if (err) {
      ioc.logcat.tweener.e(`缓动动画: ${lib} 执行失败`, err);
    }
    return ret;
  },
  /**
   * 暂停指定缓动，并触发 onPause 回调
   * @param node 节点实例
   * @param lib 库名
   */
  pause(node: Node, lib: string) {
    if (__tweens.has(node.uuid)) {
      const tweens = __tweens.get(node.uuid);
      if (tweens.has(lib)) {
        const [twn, a] = tweens.get(lib)!;
        twn?.pause();
        {
          const [, e] = might.sync(() => a.onPause?.call(a.context, node));
          if (e) ioc.logcat.tweener.e(`缓动动画: ${lib} onPause 回调异常`, e);
        }
      }
    }
  },
  /**
   * 恢复指定缓动，并触发 onResume 回调
   * @param node 节点实例
   * @param lib 库名
   */
  resume(node: Node, lib: string) {
    if (__tweens.has(node.uuid)) {
      const tweens = __tweens.get(node.uuid);
      if (tweens.has(lib)) {
        const [twn, a] = tweens.get(lib)!;
        twn?.resume();
        {
          const [, e] = might.sync(() => a.onResume?.call(a.context, node));
          if (e) ioc.logcat.tweener.e(`缓动动画: ${lib} onResume 回调异常`, e);
        }
      }
    }
  },
  /**
   * 停止指定缓动，并触发 onStop 回调
   * @param node 节点实例
   * @param lib 库名
   */
  stop(node: Node, lib: string) {
    if (__tweens.has(node.uuid)) {
      const tweens = __tweens.get(node.uuid);
      if (tweens.has(lib)) {
        const [twn, args] = tweens.get(lib)!;
        twn?.stop();
        tweens.delete(lib);
        {
          const [, e] = might.sync(() => args.onStop?.call(args.context, node));
          if (e) ioc.logcat.tweener.e(`缓动动画: ${lib} onStop 回调异常`, e);
        }
      }
    }
  },
  /**
   * 暂停单个节点或全局所有节点上的全部缓动
   * @param node 节点实例（可选）
   */
  pauseAll(node?: Node) {
    if (node) {
      if (__tweens.has(node?.uuid)) {
        const tweens = __tweens.get(node?.uuid);
        tweens.forEach((tween, lib) => {
          const [twn, a] = tween;
          twn.pause();
          {
            const [, e] = might.sync(() => a.onPause?.call(a.context, node));
            if (e) ioc.logcat.tweener.e(`缓动动画: ${lib} onPause 回调异常`, e);
          }
        });
      }
    } else {
      __tweens.forEach((tweens) => {
        tweens.forEach((tween, lib) => {
          const [twn, a] = tween;
          twn.pause();
          {
            const [, e] = might.sync(() => a.onPause?.call(a.context, node));
            if (e) ioc.logcat.tweener.e(`缓动动画: ${lib} onPause 回调异常`, e);
          }
        });
      });
    }
  },
  /**
   * 恢复单个节点或全局所有节点上的全部缓动
   * @param node 节点实例（可选）
   */
  resumeAll(node?: Node) {
    if (node) {
      if (__tweens.has(node?.uuid)) {
        const tweens = __tweens.get(node?.uuid);
        tweens.forEach((tween, lib) => {
          const [twn, a] = tween;
          twn.resume();
          {
            const [, e] = might.sync(() => a.onResume?.call(a.context, node));
            if (e) ioc.logcat.tweener.e(`缓动动画: ${lib} onResume 回调异常`, e);
          }
        });
      }
    } else {
      __tweens.forEach((tweens) => {
        tweens.forEach((tween, lib) => {
          const [twn, a] = tween;
          twn.resume();
          {
            const [, e] = might.sync(() => a.onResume?.call(a.context, node));
            if (e) ioc.logcat.tweener.e(`缓动动画: ${lib} onResume 回调异常`, e);
          }
        });
      });
    }
  },
  /**
   * 停止单个节点或全局所有节点上的全部缓动，并触发 onStop 回调
   * @param node 节点实例（可选）
   */
  stopAll(node?: Node) {
    if (node) {
      if (__tweens.has(node?.uuid)) {
        const tweens = __tweens.get(node?.uuid);
        tweens.forEach((tween, lib) => {
          const [twn, args] = tween;
          twn.stop();
          tweens.delete(lib);
          {
            const [, e] = might.sync(() => args.onStop?.call(args.context, node));
            if (e) ioc.logcat.tweener.e(`缓动动画: ${lib} onStop 回调异常`, e);
          }
        });
        tweens.clear();
      }
      // 仅清理指定节点，勿清空所有节点
    } else {
      __tweens.forEach((tweens) => {
        tweens.forEach((tween, lib) => {
          const [twn, args] = tween;
          twn.stop();
          tweens.delete(lib);
          {
            const [, e] = might.sync(() => args.onStop?.call(args.context, node));
            if (e) ioc.logcat.tweener.e(`缓动动画: ${lib} onStop 回调异常`, e);
          }
        });
        tweens.clear();
      });
      __tweens.clear();
    }
  },
};
