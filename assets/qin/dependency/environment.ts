import { dict, literal } from "../ability";
import { IEnvironment, IQinOptions } from "../typings";
import { Dependency } from "./dependency";

/**
 * 环境参数解析器
 * @description 提供环境参数解析能力
 */
export class Environment extends Dependency implements IEnvironment {
  readonly name: string = "Environment";
  readonly description: string = "环境参数解析器";

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
