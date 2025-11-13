import { sp } from "cc";
import { IAbility } from "./ability";
import ioc from "../ioc";

/**
 * Spine辅助能力接口
 */
export interface ISpine extends IAbility {
  EventType: {
    SkinChanged: string;
    AttachmentChanged: string;
  };
  /**
   * 获取当前皮肤名称
   * @param skl 骨骼组件
   * @returns
   */
  getCurrentSkin(skl: sp.Skeleton): string;

  /**
   * 整体换装
   * @param skl 骨骼组件
   */
  changeSkin(skl: sp.Skeleton, skinName: string): void;

  /**
   * 局部换装
   * - 需要清楚知道部件所在的位置（要求美术给出）
   * @param skl 骨骼组件
   * @param skinName 皮肤名称
   * @param slotName 插槽名称
   * @param attachmentName 部件名称
   */
  changeSlotAttachment(skl: sp.Skeleton, skinName: string, slotName: string, attachmentName: string): void;
}

/**
 * Spine辅助能力实现
 */
export const spine: ISpine = {
  name: "Spine",
  description: "Spine辅助能力",
  EventType: {
    SkinChanged: "spine:skin-changed",
    AttachmentChanged: "spine:attachment-changed",
  },
  getCurrentSkin(skl: sp.Skeleton) {
    return skl._skeleton?.skin.name;
  },
  changeSkin(skl: sp.Skeleton, skinName: string) {
    const data = skl.skeletonData.getRuntimeData();
    if (!data) return ioc.logcat.res.ef("骨骼动画: {0} 资源未构建", skl.name);

    const skin = data.findSkin(skinName);
    if (!skin) return ioc.logcat.res.ef("骨骼动画: {0} 未找到皮肤 {1}", skl.name, skinName);

    skl.setSkin(skin.name);
    skl.node.emit(spine.EventType.SkinChanged, { skin: skin.name });
  },
  changeSlotAttachment(skl: sp.Skeleton, skinName: string, slotName: string, attachmentName: string) {
    const data = skl.skeletonData.getRuntimeData();
    if (!data) return ioc.logcat.res.ef("骨骼动画: {0} 资源未构建", skl.name);

    const skin = data.findSkin(skinName);
    if (!skin) return ioc.logcat.res.ef("骨骼动画: {0} 未找到皮肤 {1}", skl.name, skinName);

    const slotIndex = data.findSlotIndex(slotName);
    if (slotIndex === -1)
      return ioc.logcat.res.ef("骨骼动画: {0} 未找到皮肤 {1} 的插槽 {2}", skl.name, skinName, slotName);

    console.log(skin, slotName, skin.attachments);
    const attachment = skin.getAttachment(slotIndex, attachmentName);
    if (!attachment)
      return ioc.logcat.res.ef("骨骼动画: {0} 未找到皮肤 {1} 的附件 {2}", skl.name, skinName, attachmentName);

    skl.findSlot(slotName)!.setAttachment(attachment);
    skl.node.emit(spine.EventType.AttachmentChanged, {
      skin: skinName,
      slot: slotName,
      attachment: attachmentName,
    });

    // 如果使用 PRIVATE_CACHE/SHARED_CACHE 缓存模式，则需要更新缓存
    const cacheMode = skl["_cacheMode"];
    if (cacheMode === sp.AnimationCacheMode.PRIVATE_CACHE || cacheMode === sp.AnimationCacheMode.SHARED_CACHE) {
      skl.invalidAnimationCache();
    }
  },
};
