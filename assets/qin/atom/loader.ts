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
  private __urlTemp: string = "";

  /** 资源 URL */
  private __url: string = "";

  /** 资源 URL */
  public get url(): string {
    return this.__url;
  }

  public set url(url: string) {
    if (EDITOR) {
      this.__url = url;
    } else {
      if (this.__url !== url) {
        this.__urlTemp = url;
        this._load();
      }
    }
  }

  /** 内容节点 */
  protected _content: Node | undefined;

  /** 内容视图 */
  protected _view: V | undefined;

  /** 资源 */
  protected _asset: R | null = null;

  /** 触发器#加载完成 */
  public readonly onLoadDone: Triggers = new Triggers();

  /** 触发器#加载失败 */
  public readonly onLoadFail: Triggers = new Triggers();

  protected _doStart(): void {
    super._doStart();
    this.__urlTemp = this.__url;
    this._load();
  }

  protected _doEnd(): void {
    super._doEnd();
    this._clearContent();
    this.onLoadDone.clear();
    this.onLoadFail.clear();
  }

  /**
   * 加载
   */
  protected async _load() {
    if (be.empty(this.__urlTemp)) {
      this._clearContent();
      return Promise.resolve();
    }

    const temp = this.__urlTemp;
    const [res, err] = await might.async(this._loadContent(temp));
    if (err) {
      this.onLoadFail.runWith(err);
      this.__urlTemp = "";
      this._asset = null;
    } else if (be.empty(res)) {
      this.onLoadFail.runWith(new Error("资源: 加载失败 " + temp));
      this.__urlTemp = "";
      this._asset = null;
    } else {
      this._clearContent();
      this.__url = temp;
      this.__urlTemp = "";
      this._asset = res!;
      this._doLoadComplete(res!);
      this.onLoadDone.runWith(this._view);
    }
  }

  /**
   * 清空内容
   */
  protected abstract _clearContent(): void;

  /**
   * 加载内容
   * @param url 资源 URL
   */
  protected abstract _loadContent(url: string): Promise<R | null>;

  /**
   * 加载完成
   * @param res 资源
   */
  protected abstract _doLoadComplete(res: R): void;

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
  protected _addRef() {
    if (this._asset && this._asset instanceof Asset && this._asset.isValid) {
      this._asset.addRef();
    }
  }

  /** 减少原始资源引用计数 */
  protected _decRef() {
    if (this._asset && this._asset instanceof Asset && this._asset.isValid) {
      this._asset.decRef();
      this._asset = null;
    }
  }
}
