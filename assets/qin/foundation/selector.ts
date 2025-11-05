import { ObjectEntry, pool, Triggers } from "../ability";

/** 选择模式 */
export enum SelectMode {
  /** 单选 */
  Single,
  /** 多选 */
  Multi,
}

/**
 * 选项
 */
@pool.obEntryOutline("Option")
export class Option<R> extends ObjectEntry {
  /** 原始内容 */
  private raw: R | null = null;

  /** 触发器#选择 */
  public readonly onSelected: Triggers = new Triggers();

  /** 选择状态 */
  private status: boolean = false;

  /** 选择状态 */
  public get selected() {
    return this.status;
  }
  public set selected(sel: boolean) {
    if (this.status !== sel) {
      this.status = sel;
    }
    this.onSelected.runWith(sel, this.raw);
  }

  /** 设置选择状态，但是不触发事件 */
  public set selectedNoEmit(sel: boolean) {
    if (this.status !== sel) {
      this.status = sel;
    }
  }

  /** 是否同一选项 */
  public equals(raw: R) {
    return this.raw === raw;
  }

  protected onStart(raw: any) {
    this.raw = raw;
    this.status = false;
    this.onSelected.clear();
  }

  protected onEnded() {
    this.raw = null;
    this.status = false;
    this.onSelected.clear();
  }
}

/**
 * 选择器
 * - 支持单选和多选
 */
export class Selector<R> {
  /** 选项列表 */
  private options: Option<R>[] = [];

  /**
   * 构造
   * @param type 选择模式
   */
  constructor(public readonly type: SelectMode) {}

  /**
   * 查询选项
   * @param raw 原始内容
   * @returns
   */
  public has(raw: R) {
    return this.findIndex(raw) > -1;
  }

  /**
   * 查询选项
   * @param raw 原始内容
   * @returns
   */
  public findIndex(raw: R) {
    return this.options.findIndex((v) => v.equals(raw));
  }

  /**
   * 查询选项
   * @param raw 原始内容
   * @returns
   */
  public find(raw: R) {
    return this.options.find((v) => v.equals(raw));
  }

  /**
   * 遍历选项
   * @param visit 访问器
   */
  public forEach(visit: (opt: Option<R>) => void) {
    this.options.forEach(visit);
  }

  /**
   * 添加选项
   * @param raw 原始内容
   */
  public add(raw: R) {
    if (!this.has(raw)) {
      const option = pool.acquire(Option<R>, raw);
      this.options.push(option);
      return option;
    }
    return null;
  }

  /**
   * 删除选项
   * @param raw 原始内容
   */
  public del(raw: R) {
    const index = this.findIndex(raw);
    if (index > -1) {
      const options = this.options.splice(index, 1);
      if (options.length > 0) {
        pool.recycle(options[0]);
      }
    }
  }

  /** 清除选项 */
  public clear() {
    for (let l = this.options.length, i = l - 1, opt: Option<R>; i >= 0; i--) {
      opt = this.options[i];
      pool.recycle(opt);
    }
    this.options.length = 0;
  }

  /**
   * 选中选项
   * @param raw 原始内容
   * @returns
   */
  public select(raw: R) {
    if (this.options.length == 0) return;
    if (!this.has(raw)) return;

    if (this.type === SelectMode.Single) {
      for (let i = 0, l = this.options.length, opt: Option<R>; i < l; i++) {
        opt = this.options[i];
        opt.selected = opt.equals(raw);
      }
    } else {
      const option = this.find(raw)!;
      option.selected = true;
    }
  }

  /**
   * 切换选项状态
   * @param option 选项
   */
  public switch(raw: R) {
    if (this.options.length == 0) return;
    if (!this.has(raw)) return;

    if (this.type === SelectMode.Single) {
      for (let i = 0, l = this.options.length, opt: Option<R>; i < l; i++) {
        opt = this.options[i];
        opt.selected = !opt.selected;
      }
    } else {
      const option = this.find(raw)!;
      option.selected = !option.selected;
    }
  }

  /**
   * 全部选中
   */
  public selectAll() {
    for (let i = 0, l = this.options.length, opt: Option<R>; i < l; i++) {
      opt = this.options[i];
      opt.selected = true;
    }
  }

  /**
   * 全部取消选中
   */
  public unselectAll() {
    for (let i = 0, l = this.options.length, opt: Option<R>; i < l; i++) {
      opt = this.options[i];
      opt.selected = false;
    }
  }

  /**
   * 获取选中的选项
   */
  public get selected() {
    const selected = [];
    for (let i = 0, l = this.options.length, opt: Option<R>; i < l; i++) {
      opt = this.options[i];
      if (opt.selected) {
        selected.push(opt);
      }
    }
    return selected;
  }

  /**
   * 指定内容是否被选中
   * @param raw 原始内容
   * @returns
   */
  public contains(raw: R) {
    if (this.has(raw)) {
      return this.selected.includes(this.find(raw)!);
    } else {
      return false;
    }
  }

  /**
   * 获取选项数量
   */
  public get size() {
    return this.options.length;
  }
}
