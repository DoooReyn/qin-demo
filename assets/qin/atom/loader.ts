import { Asset, Node } from "cc";
import { EDITOR } from "cc/env";

import { be, might, mock } from "../ability";
import { Triggers } from "../foundation";
import { Atom } from "./atom";

/**
 * 装载器基类
 */
@mock.decorator.ccclass("Loader")
export abstract class Loader<V, R> extends Atom {
  /** 资源临时 URL */
  private _urlTemp: string = "";

  /** 资源 URL */
  private _url: string = "";

  /** 资源 URL */
  public get url(): string {
    return this._url;
  }

  public set url(url: string) {
    if (EDITOR) {
      this._url = url;
    } else {
      if (this._url !== url) {
        this._urlTemp = url;
        this.load();
      }
    }
  }

  /** 内容节点 */
  protected _content: Node | undefined;

  /** 内容视图 */
  protected _view: V | undefined;

  /** 资源 */
  protected asset: R | null = null;

  /** 触发器#加载完成 */
  public readonly onLoadDone: Triggers = new Triggers();

  /** 触发器#加载失败 */
  public readonly onLoadFail: Triggers = new Triggers();

  protected doStart(): void {
    super.doStart();
    this._urlTemp = this._url;
    this.load();
  }

  protected doEnd(): void {
    super.doEnd();
    this.clearContent();
    this.onLoadDone.clear();
    this.onLoadFail.clear();
  }

  /**
   * 加载
   */
  protected async load() {
    if (be.empty(this._urlTemp)) {
      this.clearContent();
      return Promise.resolve();
    }

    const temp = this._urlTemp;
    const [res, err] = await might.async(this.loadContent(temp));
    if (err) {
      this.onLoadFail.runWith(err);
      this._urlTemp = "";
      this.asset = null;
    } else if (be.empty(res)) {
      this.onLoadFail.runWith(new Error("资源: 加载失败 " + temp));
      this._urlTemp = "";
      this.asset = null;
    } else {
      this.clearContent();
      this._url = temp;
      this._urlTemp = "";
      this.asset = res!;
      this.doLoadComplete(res!);
      this.onLoadDone.runWith(this._view);
    }
  }

  /**
   * 清空内容
   */
  protected abstract clearContent(): void;

  /**
   * 加载内容
   * @param url 资源 URL
   */
  protected abstract loadContent(url: string): Promise<R | null>;

  /**
   * 加载完成
   * @param res 资源
   */
  protected abstract doLoadComplete(res: R): void;

  /**
   * 内容视图
   */
  public get view() {
    return this._view;
  }

  /**
   * 内容节点
   */
  public get content() {
    return this._content;
  }

  /** 增加原始资源引用计数 */
  protected addRef() {
    if (this.asset && this.asset instanceof Asset && this.asset.isValid) {
      this.asset.addRef();
    }
  }

  /** 减少原始资源引用计数 */
  protected decRef() {
    if (this.asset && this.asset instanceof Asset && this.asset.isValid) {
      this.asset.decRef();
      this.asset = null;
    }
  }
}
