import { sys } from "cc";
import { dict, literal } from "../ability";
import { Injectable } from "../ioc";
import { IApplicationOptions } from "../typings";
import { Dependency } from "./dependency";
import { IEnvironment } from "./environment.typings";

/**
 * 环境参数解析器
 * @description 提供环境参数解析能力
 */
@Injectable({ name: "Environment", priority: 0 })
export class Environment extends Dependency implements IEnvironment {
  args: IApplicationOptions = {
    app: "qin",
    version: "0.0.1",
    env: "dev",
    language: sys.Language.CHINESE,
  };

  use(args: IApplicationOptions) {
    dict.merge(this.args, args) as IApplicationOptions;
    if (this.isDev) {
      dict.merge(this.args, literal.extractUrlParams() as IApplicationOptions);
    }
  }

  isMode(mode: string) {
    return this.args.env == mode;
  }

  get isDev() {
    return this.isMode("dev");
  }

  get isDebug() {
    return this.isMode("debug");
  }

  get isBeta() {
    return this.isMode("beta");
  }

  get isRelease() {
    return this.isMode("release");
  }
}
