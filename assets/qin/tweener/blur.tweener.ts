import { ITweenArgs, ITweenEntry } from "../dependency";
import { tween, Node } from "cc";

/** 模糊入场动画 */
export const BlurInTw: ITweenEntry = {
  lib: "tweener-blur-in",
  args: {
    duration: 0.2,
  },
  create(node: Node, args: ITweenArgs) {
    const time = args.duration;
    return tween(node).set({ opacity: 0 }).to(time, { opacity: 255 }, { easing: "sineInOut" });
  },
};

/** 模糊出场动画 */
export const BlurOutTw: ITweenEntry = {
  lib: "tweener-blur-out",
  args: {
    duration: 0.2,
  },
  create(node: Node, args: ITweenArgs) {
    const time = args.duration;
    return tween(node).set({ opacity: 255 }).to(time, { opacity: 0 }, { easing: "sineInOut" });
  },
};
