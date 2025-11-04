import { IDependency } from "../typings/dependency";
import { IService } from "../typings/service";

/**
 * 服务项基类
 */
export class Service {
  dependencyOf<T extends IDependency>(name: string): T | undefined {
    return undefined;
  }
  serviceOf<T extends IService>(name: string): T | undefined {
    return undefined;
  }
}
