import { list } from "../ability";
import { DeepProxy } from "../foundation";
import ioc, { Injectable } from "../ioc";
import { Constructor } from "../typings";
import { Dto, IDatabase, OnPropertyChanged, Subscription } from "./database.typings";
import { Dependency } from "./dependency";

/** 数据模型 */
export class Model<D extends Dto> {
  /** 原始数据 */
  protected _dto: D | null = null;

  /** 数据深层代理 */
  protected _proxy: DeepProxy<D> | null = null;

  /** （细粒度）属性订阅者 */
  private __compactSubscriptions: Map<string, Set<Subscription>> = new Map();

  /** （粗粒度）属性订阅者 */
  private __laxSubscriptions: Subscription[] = [];

  /** 初始化 */
  public initialize() {}

  /**
   * 通知订阅者
   * @param property 属性路径
   * @param value 属性值
   */
  private __notify(property: string[], value: any): void {
    const path = property.join(".");
    if (this.__compactSubscriptions.has(path)) {
      this.__compactSubscriptions.get(path)!.forEach((subscription) => {
        const [onPropertyChanged, context] = subscription;
        onPropertyChanged.call(context, path, value);
      });
    }
    this.__laxSubscriptions.forEach((item) => item[0].call(item[1], path, value));
  }

  public get dto(): D | null {
    return this._dto;
  }

  public sync(dto: D) {
    const self = this;
    this._proxy = new DeepProxy(dto, {
      set: (target: any, prop: string | symbol, value: any, receiver: any) => {
        const old = Reflect.get(target, prop, receiver);
        const path = [...(self._proxy!.getPath(target) ?? []), String(prop)];
        if (old !== value) {
          self.__notify(path, value);
        }
        return Reflect.set(target, prop, value, receiver);
      },
    });
    this._dto = this._proxy.create();
  }

  public subscribeCompact(property: string, onPropertyChanged: OnPropertyChanged, context: any) {
    if (!this.__compactSubscriptions.has(property)) {
      this.__compactSubscriptions.set(property, new Set());
    }
    this.__compactSubscriptions.get(property)!.add([onPropertyChanged, context]);
  }

  public unsubscribeCompact(property: string, onPropertyChanged: OnPropertyChanged, context: any): void {
    const subscriptions = this.__compactSubscriptions.get(property);
    if (subscriptions) {
      for (const subscription of subscriptions) {
        if (subscription[0] === onPropertyChanged && subscription[1] === context) {
          subscriptions.delete(subscription);
          break;
        }
      }
    }
  }

  public unsubscribeCompacts(property?: string, context?: any): void {
    if (property) {
      const subscriptions = this.__compactSubscriptions.get(property);
      if (subscriptions) {
        if (context) {
          // 取消指定属性和上下文的订阅
          for (const subscription of subscriptions) {
            if (subscription[1] === context) {
              subscriptions.delete(subscription);
            }
          }
        } else {
          // 取消指定属性的所有订阅
          subscriptions.clear();
        }
      }
    } else {
      if (context) {
        // 取消指定上下文的所有订阅
        this.__compactSubscriptions.forEach((subscriptions) => {
          for (const subscription of subscriptions) {
            if (subscription[1] === context) {
              subscriptions.delete(subscription);
            }
          }
        });
      } else {
        // 取消所有订阅
        this.__compactSubscriptions.clear();
      }
    }
  }

  public subscribeLax(onPropertyChanged: OnPropertyChanged, context: any) {
    this.__laxSubscriptions.push([onPropertyChanged, context]);
  }

  public unsubscribeLax(onPropertyChanged: OnPropertyChanged, context: any) {
    list.removeIf(this.__laxSubscriptions, (item) => item[0] === onPropertyChanged && item[1] === context, true);
  }

  public unsubscribeLaxes(context?: any) {
    if (context) {
      list.removeIf(this.__laxSubscriptions, (item) => item[1] === context, true);
    } else {
      list.clear(this.__laxSubscriptions);
    }
  }

  public unsubscribeAll(context?: any) {
    this.unsubscribeCompacts(undefined, context);
    this.unsubscribeLaxes(context);
  }
}

/**
 * 数据模型装饰器
 * @param name 数据模型名称
 * @returns
 */
export function Modelize(name: string) {
  return function (cls: any) {
    cls.prototype[Database.Key] = name;
    ioc.db.register(cls);
    return cls;
  };
}

/**
 * 获取数据模型名称
 * @param cls 数据模型构造
 * @returns
 */
export function GetModelName(cls: typeof Model<Dto>): string {
  return cls.prototype[Database.Key];
}

/**
 * 内存数据库工具
 **/
@Injectable({ name: "Database" })
export class Database extends Dependency implements IDatabase {
  /** 数据库标识 */
  public static readonly Key: symbol = Symbol.for("Database");

  /** 数据模型构造容器 */
  private __container: Map<string, Constructor<Model<Dto>>> = new Map();

  /** 数据模型实例容器 */
  private __instance: Map<string, Model<Dto>> = new Map();

  public register(cls: Constructor<Model<Dto>>): void {
    const name = GetModelName(cls);
    if (!name) {
      throw new Error("数据库: 无效的数据模型构造，请使用 @Modelize 装饰器");
    }
    this.__container.set(name, cls);
  }

  public unregister(cls: Constructor<Model<Dto>>) {
    const name = GetModelName(cls);

    if (!name) {
      throw new Error("数据库: 无效的数据模型构造，请使用 @Modelize 装饰器");
    }

    if (!this.__container.has(name)) {
      throw new Error(`数据库: 模型未注册 ${name}`);
    }

    return this.__container.delete(name);
  }

  public acquire<D extends Dto>(cls: Constructor<Model<D>> | string): Model<D> | null {
    let name: string;

    if (typeof cls !== "string") {
      name = GetModelName(cls);
    } else {
      name = cls;
    }

    if (!name) {
      throw new Error("数据库: 模型无效或未注册");
    }

    if (!this.__container.has(name)) {
      throw new Error(`数据库: 模型未注册 ${name}`);
    }

    let inst = this.__instance.get(name);
    if (!inst) {
      cls = this.__container.get(name)! as Constructor<Model<D>>;
      inst = new cls();
      inst.initialize();
      this.__instance.set(name, inst);
    }

    return inst as Model<D>;
  }

  public create<D extends Dto>(cls: Constructor<Model<D>> | string) {
    let name: string;

    if (typeof cls !== "string") {
      name = GetModelName(cls);
    } else {
      name = cls;
    }

    if (!name) {
      throw new Error("数据库: 模型无效或未注册");
    }

    if (!this.__container.has(name)) {
      throw new Error(`数据库: 模型未注册 ${name}`);
    }

    cls = this.__container.get(name)! as Constructor<Model<D>>;
    const inst = new cls();
    inst.initialize();
    return inst;
  }
}
