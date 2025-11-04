import { IIncremental } from "../typings/incremental";

/**
 * 递增ID生成器
 */
export class Incremental implements IIncremental {
  readonly name: string = "Incremental";
  readonly description: string = "递增ID生成器";
  onAttach(): void {}
  onDetach(): void {
    this.__container.clear();
  }

  /** 递增ID容器 */
  private __container: Map<string, number> = new Map();

  /**
   * 创建一个新的递增ID生成器
   * @param tag 生成器标签
   * @param from 初始值
   * @returns 递增ID
   */
  create(tag: string, from?: number) {
    if (!this.has(tag)) {
      this.__container.set(tag, from ?? 0);
    }
    return this.__container.get(tag)!;
  }

  /**
   * 检查是否存在指定标签的递增ID生成器
   * @param tag 生成器标签
   * @returns 是否存在
   */
  has(tag: string) {
    return this.__container.has(tag);
  }

  /**
   * 获取指定标签的当前递增ID
   * @param tag 生成器标签
   * @returns 当前递增ID
   */
  current(tag: string) {
    return this.create(tag)!;
  }

  /**
   * 获取指定标签的下一个递增ID
   * @param tag 生成器标签
   * @returns 下一个递增ID
   */
  next(tag: string) {
    const current = this.current(tag);
    const next = current + 1;
    this.__container.set(tag, next);
    return next;
  }

  /**
   * 重置指定标签的递增ID生成器
   * @param tag 生成器标签
   * @param from 重置值
   */
  reset(tag: string, from?: number) {
    this.__container.set(tag, from ?? 0);
  }

  /**
   * 获取指定标签的下一个递增ID
   * @param tag 生成器标签
   * @returns 下一个递增ID
   */
  acquire(tag: string) {
    return this.next(tag);
  }
}
