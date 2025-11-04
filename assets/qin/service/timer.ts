import { ITimerService } from "../typings/timer";
import { Service } from "./service";

/**
 * 定时器服务
 * @description 定时器服务类实现了定时器服务接口，提供了定时器的安装、卸载和更新功能
 */
export class TimerService extends Service implements ITimerService {
  install(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  uninstall(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  update(ms: number): void {
    throw new Error("Method not implemented.");
  }
  readonly name: string = "TimerService";
  readonly description: string = "定时器服务";
}