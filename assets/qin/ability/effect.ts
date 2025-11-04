import { builtinResMgr, Material, Node, UIRenderer } from "cc";
import { IAbility } from "./ability";

/**
 * 特效操作能力接口
 * @description 提供对节点特效的操作方法，如设置材质、置灰等
 */
export interface IEffect extends IAbility {
  /**
   * 设置节点材质（包括子节点）
   * @param node 目标节点
   * @param material 材质
   * @param properties 材质属性
   */
  set(
    node: Node,
    material: Material | null,
    properties?: Record<string, any>
  ): void;
  /**
   * 将节点恢复正常（取消材质）
   * @param node 目标节点
   */
  reset(node: Node): void;
  /**
   * 将节点置灰
   * @param node 目标节点
   */
  setGray(node: Node): void;
}

/**
 * 特效操作能力实现
 */
export const effect: IEffect = {
  name: "Effect",
  description: "特效操作能力",
  set(node: Node, material: Material | null, properties?: Record<string, any>) {
    if (node == null || node.isValid == false) return;
    const renders = node.getComponentsInChildren(UIRenderer);
    const dive = material && properties;
    for (let i = 0, l = renders.length; i < l; i++) {
      if (dive) {
        for (let p in properties) {
          material.setProperty(p, properties[p]);
        }
      }
      renders[i].customMaterial = material;
    }
  },
  reset(node: Node) {
    this.set(node, null);
  },
  setGray(node: Node) {
    this.set(node, builtinResMgr.get<Material>("ui-sprite-gray-material"));
  },
};
