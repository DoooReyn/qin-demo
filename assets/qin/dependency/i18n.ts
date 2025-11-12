import { sys } from "cc";
import { Dependency } from "./dependency";
import { Ii18n, IStoreLang, Language, LanguageDictionary } from "./i18n.typings";
import ioc, { Injectable } from "../ioc";
import { PRESET } from "../preset";
import { literal } from "../ability";

/**
 * 国际化工具
 */
@Injectable({ name: "I18n" })
export class I18n extends Dependency implements Ii18n {
  /** 当前语言 */
  private __current: Language = sys.Language.CHINESE;

  /** 支持的语言列表 */
  private readonly __supported: Set<Language> = new Set();

  /** 字典容器 */
  private readonly __container: Map<Language, Map<string, LanguageDictionary>> = new Map();

  /**
   * 使用文本编号获取多语言文本
   * @param id 文本编号
   * @returns
   */
  private __getTextById(id: string) {
    if (this.__container.has(this.__current)) {
      const dictionaries = this.__container.get(this.__current)!;
      for (let [, dictionary] of dictionaries) {
        if (dictionary[id] != undefined) {
          return dictionary[id];
        }
      }
    }
    return "xxx@" + id;
  }

  /**
   * 从字典中获取多语言文本
   * @param name 字典名称
   * @param id 文本编号
   * @returns
   */
  private __getTextFromDict(name: string, id: string) {
    if (this.__container.has(this.__current)) {
      const dictionaries = this.__container.get(this.__current)!;
      if (dictionaries.has(name)) {
        const dictionary = dictionaries.get(name)!;
        const text = dictionary[id];
        if (text != undefined) {
          return text;
        }
      }
    }
    return name + "@" + id;
  }

  onDetach(): Promise<void> {
    this.clearAll();
    return super.onDetach();
  }

  get language() {
    return this.__current;
  }
  set language(lang: Language) {
    this.__current = lang;
    ioc.store.itemOf<IStoreLang>(PRESET.STORE.LANG)!.data!.lang = lang;
    ioc.eventBus.app.publish(PRESET.EVENT.APP_LANGUAGE_CHANGED, this.__current);
  }

  initialize(options: { language?: Language; supported?: Language[] }) {
    // 添加支持的语言
    this.__supported.add(options.language);
    if (options.supported) {
      for (let i = 0; i < options.supported.length; i++) {
        this.__supported.add(options.supported[i]);
      }
    }

    // 设置当前语言
    // 1. 如果本地已经有记录，则使用本地缓存的语言
    // 2. 如果没有本地记录，则使用当前系统的语言
    // 3. 如果系统语言不在支持列表中，则使用传入的语言
    ioc.store.register(PRESET.STORE.LANG, { language: this.__current });
    const preset = ioc.store.itemOf<IStoreLang>(PRESET.STORE.LANG);
    if (preset) {
      // 使用缓存语言
      this.language = preset.data!.lang;
    } else {
      const lang = sys.language;
      if (this.__supported.has(lang)) {
        // 使用系统语言
        this.language = lang;
      } else {
        // 使用传入语言
        this.language = options.language;
      }
    }
  }

  isSupported(language: Language) {
    return this.__supported.has(language);
  }

  text(nameOrId: string, id?: string): string {
    if (id === undefined) {
      return this.__getTextById(nameOrId);
    } else {
      return this.__getTextFromDict(nameOrId, id);
    }
  }

  fmt(nameOrId: string, id?: string, ...args: []): string {
    const text = this.text(nameOrId, id);
    return literal.fmt(text, ...args);
  }

  add(language: Language, name: string, dictionary: LanguageDictionary) {
    this.__supported.add(language);
    if (this.__container.has(language)) {
      const dictionaries = this.__container.get(language)!;
      dictionaries.set(name, dictionary);
    } else {
      const dictionaries = new Map();
      this.__container.set(language, dictionaries);
      dictionaries.set(name, dictionary);
    }
  }

  del(language: Language, name: string) {
    if (this.__container.has(language)) {
      const dictionary = this.__container.get(language)!;
      dictionary.delete(name);
      if (dictionary.size === 0) {
        this.__container.delete(language);
      }
    }
  }

  clear(language: Language) {
    if (this.__container.has(language)) {
      this.__container.delete(language);
    }
  }

  clearAll() {
    this.__supported.clear();
    this.__container.clear();
  }
}
