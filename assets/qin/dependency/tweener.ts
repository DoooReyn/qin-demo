import { Node, Tween, tween } from "cc";
import ioc, { Injectable } from "../ioc";
import { Dependency } from "./dependency";
import { ITweener, ITweenArgs, ITweenEntry } from "./tweener.typings";
import { might, mock } from "../ability";
import {
  PopupInTw,
  PopupOutTw,
  ShakeTw,
  WaveTw,
  VibrationTw,
  ExplosionTw,
  EarthquakeTw,
  JellyShakeTw,
  ScrollNumberTw,
} from "../tweener";

/**
 * Tweener 依赖实现
 */
@Injectable({ name: "Tweener", priority: 200 })
export class Tweener extends Dependency implements ITweener {
  /** 已注册的缓动库容器：lib -> entry */
  private __container: Map<string, ITweenEntry> = new Map();
  /** 运行时缓动表：node.uuid -> Map<lib, [Tween<Node>, ITweenArgs]> */
  private __tweens: Map<string, Map<string, [Tween<Node>, ITweenArgs]>> = new Map();

  onAttach(): Promise<void> {
    this.register(PopupInTw);
    this.register(PopupOutTw);
    this.register(ShakeTw);
    this.register(WaveTw);
    this.register(VibrationTw);
    this.register(ExplosionTw);
    this.register(EarthquakeTw);
    this.register(JellyShakeTw);
    this.register(ScrollNumberTw);
    return super.onAttach();
  }

  onDetach(): Promise<void> {
    this.stopAll();
    this.__tweens.clear();
    return super.onDetach();
  }

  has(lib: string): boolean {
    return this.__container.has(lib);
  }

  register(entry: ITweenEntry): void {
    if (this.__container.has(entry.lib)) {
      ioc.logcat?.tweener.wf("缓动动画: {0} 已注册，请勿重复注册", entry.lib);
    } else {
      this.__container.set(entry.lib, entry);
    }
  }

  unregister(entry: ITweenEntry | string): void {
    if (typeof entry === "string") {
      this.__container.delete(entry);
    } else {
      this.__container.delete(entry.lib);
    }
  }

  clear(): void {
    this.__container.clear();
  }

  isPlaying(node: Node, lib: string): boolean {
    if (this.__tweens.has(node.uuid)) {
      const tweens = this.__tweens.get(node.uuid)!;
      if (tweens.has(lib)) {
        return !!tweens.get(lib)![0]?.running;
      }
    }
    return false;
  }

  @mock.logExecutionTime("Tweener.play")
  async play(node: Node, lib: string, args?: ITweenArgs): Promise<void> {
    const [_, err] = await might.async(this.__play(node, lib, args));
    if (err) {
      ioc.logcat?.tweener.e(`缓动动画: ${lib} 执行失败`, err);
    }
  }

  pause(node: Node, lib: string): void {
    if (this.__tweens.has(node.uuid)) {
      const tweens = this.__tweens.get(node.uuid)!;
      if (tweens.has(lib)) {
        const [twn, a] = tweens.get(lib)!;
        twn?.pause();
        const [, e] = might.sync(() => a.onPause?.call(a.context, node));
        if (e) ioc.logcat?.tweener.e(`缓动动画: ${lib} onPause 回调异常`, e);
      }
    }
  }

  resume(node: Node, lib: string): void {
    if (this.__tweens.has(node.uuid)) {
      const tweens = this.__tweens.get(node.uuid)!;
      if (tweens.has(lib)) {
        const [twn, a] = tweens.get(lib)!;
        twn?.resume();
        const [, e] = might.sync(() => a.onResume?.call(a.context, node));
        if (e) ioc.logcat?.tweener.e(`缓动动画: ${lib} onResume 回调异常`, e);
      }
    }
  }

  stop(node: Node, lib: string): void {
    if (this.__tweens.has(node.uuid)) {
      const tweens = this.__tweens.get(node.uuid)!;
      if (tweens.has(lib)) {
        const [twn, a] = tweens.get(lib)!;
        twn?.stop();
        tweens.delete(lib);
        const [, e] = might.sync(() => a.onStop?.call(a.context, node));
        if (e) ioc.logcat?.tweener.e(`缓动动画: ${lib} onStop 回调异常`, e);
      }
    }
  }

  pauseAll(node?: Node): void {
    if (node) {
      if (this.__tweens.has(node.uuid)) {
        const tweens = this.__tweens.get(node.uuid)!;
        tweens.forEach((tween, lib) => {
          const [twn, args] = tween;
          twn.pause();
          const [, e] = might.sync(() => args.onPause?.call(args.context, node));
          if (e) ioc.logcat?.tweener.e(`缓动动画: ${lib} onPause 回调异常`, e);
        });
      }
    } else {
      this.__tweens.forEach((tweens) => {
        tweens.forEach((tween, lib) => {
          const [twn, args] = tween;
          twn.pause();
          const [, e] = might.sync(() => args.onPause?.call(args.context, node));
          if (e) ioc.logcat?.tweener.e(`缓动动画: ${lib} onPause 回调异常`, e);
        });
      });
    }
  }

  resumeAll(node?: Node): void {
    if (node) {
      if (this.__tweens.has(node.uuid)) {
        const tweens = this.__tweens.get(node.uuid)!;
        tweens.forEach((tween, lib) => {
          const [twn, args] = tween;
          twn.resume();
          const [, e] = might.sync(() => args.onResume?.call(args.context, node));
          if (e) ioc.logcat?.tweener.e(`缓动动画: ${lib} onResume 回调异常`, e);
        });
      }
    } else {
      this.__tweens.forEach((tweens) => {
        tweens.forEach((tween, lib) => {
          const [twn, args] = tween;
          twn.resume();
          const [, e] = might.sync(() => args.onResume?.call(args.context, node));
          if (e) ioc.logcat?.tweener.e(`缓动动画: ${lib} onResume 回调异常`, e);
        });
      });
    }
  }

  stopAll(node?: Node): void {
    if (node) {
      if (this.__tweens.has(node.uuid)) {
        const tweens = this.__tweens.get(node.uuid)!;
        tweens.forEach((tween, lib) => {
          const [twn, args] = tween;
          twn.stop();
          tweens.delete(lib);
          const [, e] = might.sync(() => args.onStop?.call(args.context, node));
          if (e) ioc.logcat?.tweener.e(`缓动动画: ${lib} onStop 回调异常`, e);
        });
        tweens.clear();
      }
    } else {
      this.__tweens.forEach((tweens) => {
        tweens.forEach((tween, lib) => {
          const [twn, args] = tween;
          twn.stop();
          tweens.delete(lib);
          const [, e] = might.sync(() => args.onStop?.call(args.context, node));
          if (e) ioc.logcat?.tweener.e(`缓动动画: ${lib} onStop 回调异常`, e);
        });
        tweens.clear();
      });
      this.__tweens.clear();
    }
  }

  /**
   * 内部播放流程
   * @param node 目标节点
   * @param lib 缓动库名
   * @param args 播放参数（与注册默认参数浅合并后生效）
   * @returns 异步完成 Promise
   */
  private async __play(node: Node, lib: string, args?: ITweenArgs) {
    return new Promise<void>((resolve) => {
      const entry = this.__container.get(lib);
      if (!entry) {
        ioc.logcat?.tweener.ef(`缓动动画: {0} 未注册，请先注册`, lib);
        return resolve();
      }

      if (args) {
        args = { ...entry.args, ...args };
      } else {
        args = { ...entry.args };
      }
      args.existencePolicy ??= "replace";

      if (this.__tweens.has(node.uuid)) {
        const tweens = this.__tweens.get(node.uuid)!;
        if (tweens.has(lib)) {
          if (args.existencePolicy === "skip") {
            ioc.logcat?.tweener.ef(`缓动动画: {0} 正在播放中，应用跳过策略`, lib);
            return resolve();
          } else {
            ioc.logcat?.tweener.ef(`缓动动画: {0} 正在播放中，应用替换策略`, lib);
            tweens.get(lib)![0]?.stop();
            tweens.delete(lib);
            const [, e] = might.sync(() => args.onStop?.call(args.context, node));
            if (e) ioc.logcat?.tweener.e(`缓动动画: ${lib} onStop 回调异常`, e);
          }
        }
      } else {
        this.__tweens.set(node.uuid, new Map());
      }

      const t1 = tween(node).call(() => {
        const [, e] = might.sync(() => args.onStart?.call(args.context, node));
        if (e) ioc.logcat?.tweener.e(`缓动动画: ${lib} onStart 回调异常`, e);
        // ioc.logcat.tweener.i(`缓动动画: ${lib} 第一阶段播放结束`);
      });
      const [t2, createErr] = might.sync(() => entry.create(node, args));
      if (createErr || !t2) {
        ioc.logcat?.tweener.e(`缓动动画: ${lib} 构建失败`, createErr);
        return resolve();
      }
      // t2.call(() => {
      //   ioc.logcat.tweener.i(`缓动动画: ${lib} 第二阶段播放结束`);
      // });
      const t3 = tween(node).call(() => {
        const map = this.__tweens.get(node.uuid);
        map?.delete(lib);
        const [, e] = might.sync(() => args.onEnd?.call(args.context, node));
        if (e) ioc.logcat?.tweener.e(`缓动动画: ${lib} onEnd 回调异常`, e);
        // ioc.logcat.tweener.i(`缓动动画: ${lib} 第三阶段播放结束`);
        resolve();
      });
      const twn = tween().sequence(t1, t2, t3).target(node).bindNodeState(true);
      this.__tweens.get(node.uuid)!.set(lib, [twn, args]);
      twn.start();
    });
  }
}
