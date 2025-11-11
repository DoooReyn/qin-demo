import { IAbility } from "./ability";

/**
 * 常用计时点
 */
const MACRO = {
  /** 计时（以毫秒计）# 立刻 */
  ZERO: 0,
  /** 计时（以毫秒计）# 1 帧 */
  FRAME: 16,
  /** 计时（以毫秒计）# 1 秒钟 */
  SECOND: 1_000,
  /** 计时（以毫秒计）# 1 分钟 */
  MINUTE: 60_000,
  /** 计时（以毫秒计）# 1 小时 */
  HOUR: 3_600_000,
  /** 计时（以毫秒计）# 1 天 */
  DAY: 86_400_000,
  /** 计时（以毫秒计）# 1 周 */
  WEEK: 604_800_000,
  /** 计时（以毫秒计，按30天计算）# 1 月 */
  MONTH: 18_144_000_000,
} as const;

/**
 * 常用帧数对应的时间（秒）
 */
const FRAMES: Record<number, number> = {
  [60]: 1 / 60,
};

/**
 * 时间日期操作能力
 * @description 提供时间日期相关的操作能力，如计时、延时等。
 */
export interface ITime extends IAbility {
  /** 常用计时点 */
  macro: typeof MACRO;
  /** 获取当前时间戳（以毫秒计） */
  get now(): number;
  /** 获取当前日期 */
  get date(): Date;
  /** 获取当前年份 */
  year(d?: Date): number;
  /** 获取当前月份（0-11） */
  month(d?: Date): number;
  /** 获取当前日期（1-31） */
  day(d?: Date): number;
  /** 获取当前小时（0-23） */
  hour(d?: Date): number;
  /** 获取当前分钟（0-59） */
  minute(d?: Date): number;
  /** 获取当前秒数（0-59） */
  second(d?: Date): number;
  /** 获取当前毫秒数（0-999） */
  millisecond(d?: Date): number;
  /** 获取当前月份的天数（28-31） */
  monthDay(d?: Date): number;
  /** 获取当前星期（0-6，0 表示星期日） */
  weekDay(d?: Date): number;
  /** 获取当前时间戳（以毫秒计） */
  time(d?: Date): number;
  /** 获取指定时间点前的时间戳（以毫秒计） */
  before(time: number, d?: Date): number;
  /** 获取指定时间点后的时间戳（以毫秒计） */
  after(time: number, d?: Date): number;
  /** 计算两个日期时间之间的差值（毫秒） */
  diff(d1: Date, d2?: Date): number;
  /** 解析日期 */
  parse(d?: Date): {
    yy: number;
    mm: number;
    dd: number;
    h: number;
    m: number;
    s: number;
    ms: number;
    ts: number;
  };
  /** 格式化日期为字符串（yyyy-mm-dd） */
  ymd(d?: Date): string;
  /** 格式化时间为字符串 (h:m:s) */
  hms(d?: Date): string;
  /** 格式化时间为字符串 (h:m:s.ms) */
  hmsm(d?: Date): string;
  /** 格式化日期时间为字符串（yyyy-mm-dd h:m:s.ms） */
  ymdhms(d?: Date): string;
  /** 格式化秒数为字符串 */
  fmt(
    stamp: number,
    unit: { day: string; hour: string; minute: string; second: string }
  ): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    text: string;
  };
  /** 转换帧数为时间（秒） */
  frameOf(frame: number): number;
  /** 秒数转日期形式（例如 100秒 => 01:40） */
  sec2date(sec: number): string;
  /** 秒数转换为毫秒数 */
  sec2ms(sec: number): number;
  /** 毫秒数转换为秒数 */
  ms2sec(ms: number): number;
  /** 模拟耗时操作（毫秒） */
  lag(ms: number): void;
  /** 异步等待指定时间（毫秒） */
  wait(ms: number): Promise<void>;
  /** 获取日期的开始时间（00:00:00.000） */
  startOfDay(d?: Date): Date;
  /** 获取日期的结束时间（23:59:59.999） */
  endOfDay(d?: Date): Date;
  /** 获取日期的开始时间（00:00:00.000） */
  startOfMonth(d?: Date): Date;
  /** 获取日期的结束时间（23:59:59.999） */
  endOfMonth(d?: Date): Date;
  /** 获取日期的开始时间（00:00:00.000） */
  startOfYear(d?: Date): Date;
  /** 获取日期的结束时间（23:59:59.999） */
  endOfYear(d?: Date): Date;
  /** 获取日期的开始时间（00:00:00.000） */
  startOfWeek(d?: Date): Date;
  /** 获取日期的结束时间（23:59:59.999） */
  endOfWeek(d?: Date): Date;
  /** 计算两个日期时间之间的差值（天） */
  diffDays(d1: Date, d2?: Date): number;
  /** 计算两个日期时间之间的差值（周） */
  diffWeeks(d1: Date, d2?: Date): number;
  /** 计算两个日期时间之间的差值（月） */
  diffMonths(d1: Date, d2?: Date): number;
  /** 计算两个日期时间之间的差值（年） */
  diffYears(d1: Date, d2?: Date): number;
  /** 计算两个日期时间之间的差值（时） */
  diffHours(d1: Date, d2?: Date): number;
  /** 计算两个日期时间之间的差值（分） */
  diffMinutes(d1: Date, d2?: Date): number;
  /** 计算两个日期时间之间的差值（秒） */
  diffSeconds(d1: Date, d2?: Date): number;
  /** 是否为闰年 */
  isLeapYear(year?: number): boolean;
  /** 获取指定月份的天数（28-31） */
  daysInMonth(year?: number, month?: number): number;
  /** 添加指定天数到日期 */
  addDays(days: number, d?: Date): Date;
  /** 添加指定月数到日期 */
  addMonths(months: number, d?: Date): Date;
  /** 添加指定年数到日期 */
  addYears(years: number, d?: Date): Date;
}

export const time: ITime = {
  name: "Time",
  description: "时间日期操作能力",
  macro: MACRO,
  get now(): number {
    return Date.now();
  },
  get date(): Date {
    return new Date();
  },
  year(d?: Date): number {
    return (d ??= time.date).getFullYear();
  },
  month(d?: Date): number {
    return (d ??= time.date).getMonth();
  },
  day(d?: Date): number {
    return (d ??= time.date).getDate();
  },
  hour(d?: Date): number {
    return (d ??= time.date).getHours();
  },
  minute(d?: Date): number {
    return (d ??= time.date).getMinutes();
  },
  second(d?: Date): number {
    return (d ??= time.date).getSeconds();
  },
  millisecond(d?: Date): number {
    return (d ??= time.date).getMilliseconds();
  },
  weekDay(d?: Date): number {
    return (d ??= time.date).getDay();
  },
  time(d?: Date): number {
    return (d ??= time.date).getTime();
  },
  before(t: number, d?: Date): number {
    return (d ??= time.date).getTime() - t;
  },
  after(t: number, d?: Date): number {
    return (d ??= time.date).getTime() + t;
  },
  diff(d1: Date, d2?: Date): number {
    return Math.abs((d2 ??= time.date).getTime() - d1.getTime());
  },
  diffDays(d1: Date, d2?: Date): number {
    return time.diff(d1, d2) / MACRO.DAY;
  },
  diffWeeks(d1: Date, d2?: Date): number {
    return time.diffDays(d1, d2) / 7;
  },
  diffMonths(d1: Date, d2?: Date): number {
    return time.diffDays(d1, d2) / 30;
  },
  diffYears(d1: Date, d2?: Date): number {
    return time.diffDays(d1, d2) / 365;
  },
  diffHours(d1: Date, d2?: Date): number {
    return time.diff(d1, d2) / MACRO.HOUR;
  },
  diffMinutes(d1: Date, d2?: Date): number {
    return time.diff(d1, d2) / MACRO.MINUTE;
  },
  diffSeconds(d1: Date, d2?: Date): number {
    return time.diff(d1, d2) / MACRO.SECOND;
  },
  isLeapYear(year?: number): boolean {
    year ??= time.year();
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  },
  daysInMonth(year?: number, month?: number): number {
    year ??= time.year();
    month ??= time.month();
    return new Date(year, month + 1, 0).getDate();
  },
  addDays(days: number, d?: Date): Date {
    d ??= time.date;
    return new Date(d.getTime() + days * MACRO.DAY);
  },
  addMonths(months: number, d?: Date): Date {
    d ??= time.date;
    return new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
  },
  addYears(years: number, d?: Date): Date {
    d ??= time.date;
    return new Date(d.getFullYear() + years, d.getMonth(), d.getDate());
  },
  monthDay(d?: Date): number {
    return (d ??= time.date).getDate();
  },
  parse: function (d?: Date): {
    yy: number;
    mm: number;
    dd: number;
    h: number;
    m: number;
    s: number;
    ms: number;
    ts: number;
  } {
    d ??= time.date;
    return {
      yy: time.year(d),
      mm: time.month(d),
      dd: time.monthDay(d),
      h: time.hour(d),
      m: time.minute(d),
      s: time.second(d),
      ms: time.millisecond(d),
      ts: time.time(d),
    };
  },
  ymd: function (d?: Date): string {
    const s = time.parse(d ?? time.date);
    return `${s.yy}-${s.mm + 1}-${s.dd}`;
  },
  hms: function (d?: Date): string {
    const s = time.parse(d ?? time.date);
    return `${s.h}:${s.m}:${s.s}`;
  },
  hmsm: function (d?: Date): string {
    const s = time.parse(d ?? time.date);
    return `${s.h}:${s.m}:${s.s}.${s.ms}`;
  },
  ymdhms: function (d?: Date): string {
    const s = time.parse(d ?? time.date);
    return `${s.yy}-${s.mm + 1}-${s.dd} ${s.h}:${s.m}:${s.s}`;
  },
  fmt: function (
    stamp: number,
    unit: { day: string; hour: string; minute: string; second: string }
  ): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    text: string;
  } {
    let days = 0,
      hours = 0,
      minutes = 0,
      seconds = 0,
      text = "";
    const now = time.time();
    const remaining = stamp - now;
    if (remaining > 0) {
      days = Math.floor(remaining / MACRO.DAY);
      hours = Math.floor((remaining % MACRO.DAY) / MACRO.HOUR);
      minutes = Math.floor((remaining % MACRO.HOUR) / MACRO.MINUTE);
      seconds = Math.floor((remaining % MACRO.MINUTE) / MACRO.SECOND);
      if (days > 0) {
        text = `${days} ${unit.day} ${hours}${unit.hour} ${minutes}${unit.minute} ${seconds}${unit.second}`;
      } else if (hours > 0) {
        text = `${hours}${unit.hour} ${minutes}${unit.minute} ${seconds}${unit.second}`;
      } else if (minutes > 0) {
        text = `${minutes}${unit.minute} ${seconds}${unit.second}`;
      } else {
        text = `${seconds}${unit.second}`;
      }
    }
    return { days, hours, minutes, seconds, text };
  },
  frameOf: function (fps: number): number {
    return (FRAMES[fps] ??= 1 / fps);
  },
  sec2date: function (seconds: number): string {
    seconds = seconds | 0;
    const hour = (seconds / 3600) | 0;
    const min = (seconds / 60) | 0;
    const sec = seconds % 60;
    const date: number[] = [];
    hour > 0 && date.push(hour);
    date.push(min);
    date.push(sec);
    return date.map((v) => v.toString().padStart(2, "0")).join(":");
  },
  sec2ms: function (sec: number): number {
    return sec * 1000;
  },
  ms2sec: function (ms: number): number {
    return ms / 1000;
  },
  lag: function (ms: number): void {
    const end = time.now + ms;
    while (time.now < end) {}
  },
  wait: function (ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  },
  startOfDay: function (d?: Date): Date {
    d ??= time.date;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  },
  endOfDay: function (d?: Date): Date {
    d ??= time.date;
    return new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      23,
      59,
      59,
      999
    );
  },
  startOfMonth: function (d?: Date): Date {
    d ??= time.date;
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  },
  endOfMonth: function (d?: Date): Date {
    d ??= time.date;
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  },
  startOfYear: function (d?: Date): Date {
    d ??= time.date;
    return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
  },
  endOfYear: function (d?: Date): Date {
    d ??= time.date;
    return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
  },
  startOfWeek: function (d?: Date): Date {
    d ??= time.date;
    const day = d.getDay() || 7; // 转换为1-7，1表示周一
    const diff = day - 1; // 计算与周一的差距
    return new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate() - diff,
      0,
      0,
      0,
      0
    );
  },
  endOfWeek: function (d?: Date): Date {
    d ??= time.date;
    const day = d.getDay() || 7; // 转换为1-7，1表示周一
    const diff = 7 - day; // 计算与周日的差距
    return new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate() + diff,
      23,
      59,
      59,
      999
    );
  },
};
