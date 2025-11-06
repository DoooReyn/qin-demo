import { dict, literal } from "../ability";
import { Injectable } from "../ioc";
import { IQinOptions } from "../typings";
import { Dependency } from "./dependency";
import { IEnvironment } from "./environment.typings";

/**
 * 环境参数解析器
 * @description 提供环境参数解析能力
 */
@Injectable({ name: "Environment" })
export class Environment extends Dependency implements IEnvironment {
  args: IQinOptions = {
    app: "qin",
    version: "0.0.1",
    env: "dev",
  };

  use(args: IQinOptions) {
    dict.merge(this.args, args) as IQinOptions;
    if (this.isDev) {
      dict.merge(this.args, literal.extractUrlParams() as IQinOptions);
    }
  }

  isMode(mode: string) {
    return this.args.mode == mode;
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
