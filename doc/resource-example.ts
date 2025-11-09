/**
 * 资源管理使用示例
 * @description 展示如何使用 Qin 框架的新资源管理系统
 */

import {
  _decorator,
  Component,
  Node,
  Sprite,
  SpriteFrame,
  Prefab,
  AudioClip,
} from "cc";
import { ioc, CacheSource, PreloadItem } from "../assets/qin";

const { ccclass, property } = _decorator;

@ccclass("ResourceExample")
export class ResourceExample extends Component {
  @property(Sprite)
  sprite: Sprite = null;

  /**
   * 示例 1: 基础资源加载
   */
  async example1_basicLoad() {
    // 加载本地精灵帧
    const spriteFrame = await ioc.loader.loadSpriteFrame("img-hero", "shared");
    if (spriteFrame) {
      this.sprite.spriteFrame = spriteFrame;
      console.log("✅ 加载本地资源成功");
    }
  }

  /**
   * 示例 2: 加载远程资源
   */
  async example2_remoteLoad() {
    // 加载远程图片（自动识别）
    const remoteSprite = await ioc.loader.loadSpriteFrame(
      "https://cdn.example.com/images/hero.png",
    );
    if (remoteSprite) {
      this.sprite.spriteFrame = remoteSprite;
      console.log("✅ 加载远程资源成功");
    }
  }

  /**
   * 示例 3: 高级加载选项
   */
  async example3_advancedLoad() {
    // 使用完整配置加载
    const sprite = await ioc.loader.load(SpriteFrame, {
      path: "img-hero",
      bundle: "shared",
      useCache: true, // 使用缓存
      cacheExpires: 300000, // 5分钟过期
      forceReload: false, // 不强制重新加载
    });

    if (sprite) {
      console.log("✅ 高级加载成功");
    }
  }

  /**
   * 示例 4: 预加载资源列表
   */
  async example4_preload() {
    const resources: PreloadItem[] = [
      ["img-hero", SpriteFrame, "resources"],
      ["img-enemy", SpriteFrame, "resources"],
      ["img-background", SpriteFrame, "resources"],
      ["pfb-dialog", Prefab, "resources"],
      ["aud-bgm", AudioClip, "resources"],
    ];

    await ioc.loader.preload(resources, (finished, total) => {
      const progress = ((finished / total) * 100).toFixed(0);
      console.log(`⏳ 加载进度: ${progress}% (${finished}/${total})`);
    });

    console.log("✅ 预加载完成");
  }

  /**
   * 示例 5: 缓存管理
   */
  async example5_cacheManagement() {
    // 1. 加载资源（自动缓存）
    await ioc.loader.loadSpriteFrame("img-hero");

    // 2. 检查缓存
    const cacheKey = "local:shared@img-hero";
    if (ioc.cache.has(cacheKey)) {
      console.log("✅ 缓存存在");
    }

    // 3. 获取缓存
    const cached = ioc.cache.get<SpriteFrame>(cacheKey);
    if (cached) {
      console.log("✅ 缓存命中");
    }

    // 4. 增加引用计数
    ioc.cache.addRef(cacheKey);

    // 5. 减少引用计数（引用为0时自动释放）
    ioc.cache.decRef(cacheKey, true);
  }

  /**
   * 示例 6: 查看缓存统计
   */
  example6_cacheStats() {
    const stats = ioc.cache.getStats();
    console.log("📊 缓存统计信息：");
    console.log(`   总数: ${stats.total}`);
    console.log(`   本地资源: ${stats.local}`);
    console.log(`   远程资源: ${stats.remote}`);
    console.log(`   永久缓存: ${stats.permanent}`);
    console.log(`   临时缓存: ${stats.temporary}`);
    console.log(`   缓存命中: ${stats.hits}`);
    console.log(`   缓存未命中: ${stats.misses}`);

    const hitRate =
      stats.hits + stats.misses > 0
        ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2)
        : "0.00";
    console.log(`   命中率: ${hitRate}%`);
  }

  /**
   * 示例 7: 手动清理缓存
   */
  example7_cleanupCache() {
    // 清理过期缓存
    const expiredCount = ioc.cache.cleanup();
    console.log(`🧹 清理了 ${expiredCount} 个过期缓存`);

    // 清理所有远程资源缓存
    const remoteCount = ioc.cache.clearBySource(CacheSource.Remote, true);
    console.log(`🧹 清理了 ${remoteCount} 个远程资源缓存`);

    // 清空所有缓存
    // ioc.cache.clear(true);
  }

  /**
   * 示例 8: 资源生命周期管理
   */
  private __loadedResources: string[] = [];

  async example8_lifecycleManagement() {
    // 加载场景资源
    const resources = ["img-hero", "img-enemy", "pfb-dialog"];

    for (const path of resources) {
      await ioc.loader.loadSpriteFrame(path);
      this.__loadedResources.push(path);

      // 增加引用计数
      const cacheKey = `local:shared@${path}`;
      ioc.cache.addRef(cacheKey);
    }

    console.log("✅ 场景资源加载完成");
  }

  cleanupSceneResources() {
    // 释放场景资源
    for (const path of this.__loadedResources) {
      const cacheKey = `local:shared@${path}`;
      ioc.cache.decRef(cacheKey, true);
    }
    this.__loadedResources = [];
    console.log("🧹 场景资源已释放");
  }

  /**
   * 示例 9: 卸载资源包
   */
  example9_unloadBundle() {
    // 卸载资源包（自动清理该包的所有缓存）
    ioc.loader.unloadBundle("shared", true);
    console.log("🧹 资源包已卸载");
  }

  /**
   * 示例 10: 强制重新加载
   */
  async example10_forceReload() {
    // 强制重新加载资源，忽略缓存
    const sprite = await ioc.loader.load(SpriteFrame, {
      path: "img-hero",
      forceReload: true,
    });

    console.log("✅ 强制重新加载完成");
  }

  /**
   * 示例 11: 禁用缓存
   */
  async example11_disableCache() {
    // 加载资源但不缓存
    const sprite = await ioc.loader.load(SpriteFrame, {
      path: "img-temp",
      useCache: false,
    });

    console.log("✅ 加载完成（未缓存）");
  }

  /**
   * 示例 12: 配置日志
   */
  example12_enableLogging() {
    // 开启加载器日志
    ioc.loader.logEnabled = true;

    // 开启缓存日志
    ioc.cache.logEnabled = true;

    // 设置默认缓存过期时间（5分钟）
    ioc.loader.defaultCacheExpires = 300000;

    console.log("✅ 日志已开启");
  }

  /**
   * 示例 13: 批量加载不同类型资源
   */
  async example13_loadMultipleTypes() {
    // 加载精灵帧
    const sprite = await ioc.loader.loadSpriteFrame("img-hero");

    // 加载预制体
    const prefab = await ioc.loader.loadPrefab("pfb-dialog");

    // 加载 JSON 配置
    const config = await ioc.loader.loadJson("cfg-game");

    // 加载音频
    const audio = await ioc.loader.loadAudio("aud-bgm");

    // 加载图集
    const atlas = await ioc.loader.loadAtlas("atl-ui");

    console.log("✅ 批量加载完成");
  }

  /**
   * 示例 14: 错误处理
   */
  async example14_errorHandling() {
    try {
      const sprite = await ioc.loader.loadSpriteFrame(
        "https://cdn.example.com/not-exist.png",
      );

      if (!sprite) {
        console.warn("⚠️ 资源加载失败，使用默认资源");
        // 使用本地默认资源
        const fallback = await ioc.loader.loadSpriteFrame("img-default");
        this.sprite.spriteFrame = fallback;
      }
    } catch (error) {
      console.error("❌ 加载异常:", error);
    }
  }

  /**
   * 示例 15: 定期清理任务
   */
  private __cleanupTimer: any;

  startAutoCleanup() {
    // 每60秒清理一次过期缓存
    this.__cleanupTimer = ioc.timer.shared.loop(
      60,
      () => {
        const count = ioc.cache.cleanup();
        if (count > 0) {
          console.log(`🔄 自动清理了 ${count} 个过期缓存`);
        }

        // 检查缓存数量
        const stats = ioc.cache.getStats();
        if (stats.total > 100) {
          console.warn("⚠️ 缓存数量过多，建议手动清理");
        }
      },
      this,
    );

    console.log("✅ 自动清理任务已启动");
  }

  stopAutoCleanup() {
    if (this.__cleanupTimer) {
      ioc.timer.shared.del(this.__cleanupTimer);
      this.__cleanupTimer = null;
      console.log("🛑 自动清理任务已停止");
    }
  }

  // ==================== 生命周期 ====================

  async onLoad() {
    console.log("🎮 资源管理示例");
    console.log("==================");

    // 开启日志
    this.example12_enableLogging();

    // 启动自动清理
    this.startAutoCleanup();
  }

  async start() {
    // 运行示例
    await this.example1_basicLoad();
    await this.example3_advancedLoad();
    await this.example4_preload();

    // 查看统计
    this.example6_cacheStats();
  }

  onDestroy() {
    // 停止自动清理
    this.stopAutoCleanup();

    // 清理场景资源
    this.cleanupSceneResources();
  }
}
