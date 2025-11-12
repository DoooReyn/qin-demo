import { sys } from "cc";

import { dict, json, lzstring, platform, zipson, IDictionary } from "../ability";
import { Triggers } from "../foundation";
import ioc, { Injectable } from "../ioc";
import { Dependency } from "./dependency";
import { IStoreContainer, IStoreItem } from "./store.typings";

/**
 * 本地存储项
 */
export class StoreItem<T extends IDictionary> implements IStoreItem<T> {
  /** 原始数据 */
  private __raw: T;

  public data: T;
  public readonly onDataChanged: Triggers;

  constructor(
    public readonly alias: string,
    public readonly template: T,
  ) {
    this.onDataChanged = new Triggers();
    this.load();
  }

  /**
   * 数据编码
   * @returns 编码后的数据
   */
  private __encode() {
    if (ioc.environment.isRelease) {
      return lzstring.encode(zipson.encode(this.__raw));
    } else {
      return json.encode(this.__raw);
    }
  }

  /**
   * 数据解码
   * @param content 内容
   * @returns 解码后的数据
   */
  private __decode(content: string) {
    if (ioc.environment.isRelease) {
      return zipson.decode(lzstring.decode(content)) as T;
    } else {
      return json.decode(content) as T;
    }
  }

  load() {
    if (this.data) return;

    const content = sys.localStorage.getItem(this.alias);
    if (content) {
      this.__raw = this.__decode(content) as T;
    } else {
      this.__raw = dict.deepCopy(this.template) as T;
      this.save();
    }

    const self = this;
    this.data = new Proxy(this.__raw, {
      set(target, prop, value) {
        // 自动保存
        self.onDataChanged.runWith(prop, target[prop], value);
        dict.set(target, prop, value);
        self.save();
        return true;
      },
      get(target, prop) {
        return target[prop];
      },
    });
  }

  get key() {
    const appName = ioc.environment.args.app;
    if (ioc.environment.isDev && platform.browser) {
      const user = ioc.environment.args.user ?? "guest";
      return appName + "-" + user + "-" + this.alias;
    } else {
      return appName + "-" + this.alias;
    }
  }

  save() {
    sys.localStorage.setItem(this.alias, this.__encode());
  }
}

/**
 * 本地存储容器
 */
@Injectable({ name: "Store" })
export class Store extends Dependency implements IStoreContainer {
  /** 存储项目容器 */
  private readonly __container: Map<string, StoreItem<IDictionary>> = new Map();

  public register<T extends object>(alias: string, template: T) {
    if (!this.__container.has(alias)) {
      this.__container.set(alias, new StoreItem(alias, template));
    }
  }

  public unregister(alias: string) {
    this.__container.delete(alias);
  }

  public save(alias?: string) {
    if (alias === undefined) {
      this.__container.forEach((v) => v.save());
    } else {
      this.__container.get(alias)?.save();
    }
  }

  public load(alias?: string) {
    if (alias === undefined) {
      this.__container.forEach((v) => v.load());
    } else {
      this.__container.get(alias)?.load();
    }
  }

  public itemOf<T extends object>(alias: string): StoreItem<T> | undefined {
    return this.__container.get(alias) as StoreItem<T> | undefined;
  }
}
