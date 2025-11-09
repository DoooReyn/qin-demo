# 🎯 Qin Framework - 资源管理优化

## 📋 概述

本次更新对 Qin 框架的资源管理系统进行了全面优化，引入了统一的资源加载器和缓存管理系统，大幅提升了资源管理的便利性和性能。

## ✨ 核心特性

### 1. 统一资源加载器 (AssetLoader)

- ✅ **统一接口** - 不再需要区分本地资源和远程资源
- ✅ **自动识别** - 根据路径自动判断资源来源
- ✅ **智能缓存** - 自动管理资源缓存，提升加载性能
- ✅ **类型完整** - 支持所有常用资源类型（图片、音频、预制体等）
- ✅ **预加载** - 支持批量预加载和进度回调

### 2. 统一缓存管理器 (CacheContainer)

- ✅ **集中管理** - 统一管理所有资源的缓存
- ✅ **引用计数** - 精确控制资源生命周期
- ✅ **过期控制** - 支持设置缓存过期时间
- ✅ **自动清理** - 定时清理过期缓存
- ✅ **统计信息** - 提供详细的缓存统计（命中率、数量等）
- ✅ **来源区分** - 区分本地资源和远程资源

## 🏗️ 架构设计

```
┌─────────────────────────────────────────┐
│          AssetLoader (统一接口)          │
│  • 自动判断本地/远程                      │
│  • 统一加载接口                           │
│  • 自动缓存管理                           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       CacheContainer (缓存管理)          │
│  • 统一缓存存储                           │
│  • 引用计数管理                           │
│  • 过期时间控制                           │
│  • 缓存统计信息                           │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌─────────────┐  ┌─────────────┐
│ResContainer │  │RemoteContainer│
│  (本地资源)  │  │  (远程资源)   │
└─────────────┘  └─────────────┘
```

## 🚀 快速开始

### 基础用法

```typescript
import { ioc } from "../qin";

// 加载本地资源
const sprite = await ioc.loader.loadSpriteFrame("img-hero", "shared");

// 加载远程资源（自动识别）
const remoteSprite = await ioc.loader.loadSpriteFrame(
  "https://cdn.example.com/hero.png"
);

// 加载其他类型资源
const prefab = await ioc.loader.loadPrefab("pfb-dialog");
const audio = await ioc.loader.loadAudio("aud-bgm");
const config = await ioc.loader.loadJson("cfg-game");
```

### 高级配置

```typescript
import { ioc, SpriteFrame } from "../qin";

// 使用完整配置
const sprite = await ioc.loader.load(SpriteFrame, {
  path: "img-hero",
  bundle: "shared",
  useCache: true,           // 是否使用缓存
  cacheExpires: 300000,     // 缓存过期时间（5分钟）
  forceReload: false,       // 是否强制重新加载
});
```

### 预加载资源

```typescript
// 预加载资源列表
const paths = ["img-hero", "img-enemy", "pfb-dialog"];

await ioc.loader.preload(paths, "shared", (finished, total) => {
  console.log(`加载进度: ${(finished/total*100).toFixed(0)}%`);
});
```

### 缓存管理

```typescript
// 查看缓存统计
const stats = ioc.cache.getStats();
console.log(`缓存总数: ${stats.total}`);
console.log(`命中率: ${(stats.hits/(stats.hits+stats.misses)*100).toFixed(2)}%`);

// 清理过期缓存
const count = ioc.cache.cleanup();
console.log(`清理了 ${count} 个过期缓存`);

// 引用计数管理
ioc.cache.addRef("local:shared@img-hero");  // 增加引用
ioc.cache.decRef("local:shared@img-hero");  // 减少引用
```

## 📊 性能优势

### 对比旧方案

| 特性 | 旧方案 | 新方案 |
|------|--------|--------|
| 本地/远程统一 | ❌ 需要手动判断 | ✅ 自动识别 |
| 缓存管理 | ⚠️ 分散在各处 | ✅ 统一管理 |
| 引用计数 | ❌ 不支持 | ✅ 支持 |
| 过期控制 | ⚠️ 仅 ReleasableContainer | ✅ 统一支持 |
| 统计信息 | ❌ 无 | ✅ 详细统计 |
| 自动清理 | ⚠️ 需手动调用 | ✅ 自动定时清理 |

### 性能提升

- 🚀 **缓存命中** - 相同资源多次加载时，直接从缓存获取
- 🚀 **自动清理** - 定时清理过期资源，避免内存占用过高
- 🚀 **引用计数** - 精确管理资源生命周期，避免过早释放
- 🚀 **按需加载** - 支持灵活的缓存策略，优化内存使用

## 📦 新增 API

### AssetLoader

```typescript
// 访问方式
ioc.loader

// 主要方法
loadSpriteFrame(path: string, bundle?: string): Promise<SpriteFrame | null>
loadPrefab(path: string, bundle?: string): Promise<Prefab | null>
loadJson(path: string, bundle?: string): Promise<JsonAsset | null>
loadAudio(path: string, bundle?: string): Promise<AudioClip | null>
// ... 更多资源类型

// 工具方法
isRemote(path: string): boolean
loadBundle(bundle: string): Promise<AssetManager.Bundle | null>
unloadBundle(bundle: string, releaseAll?: boolean): void
release(path: string, bundle?: string): void
preload(paths: string[], bundle?: string, onProgress?: Function): Promise<void>

// 配置属性
logEnabled: boolean
defaultCacheExpires: number
```

### CacheContainer

```typescript
// 访问方式
ioc.cache

// 主要方法
set(options: ICacheOptions): void
get<T>(key: string): T | null
has(key: string): boolean
delete(key: string, release?: boolean): boolean
addRef(key: string): number
decRef(key: string, autoRelease?: boolean): number
cleanup(): number
clear(release?: boolean): void
clearBySource(source: CacheSource, release?: boolean): number
getStats(): ICacheStats
keys(source?: CacheSource): string[]

// 配置属性
logEnabled: boolean
```

## 🎓 使用场景

### 场景 1: 游戏启动

```typescript
class GameStart {
  async onLoad() {
    // 预加载启动必要资源
    await ioc.loader.preload([
      "img-logo",
      "img-loading-bg",
      "aud-bgm-menu",
    ], "resources");
    
    // 进入主菜单
    this.enterMainMenu();
  }
}
```

### 场景 2: 场景切换

```typescript
class SceneManager {
  private currentSceneAssets: string[] = [];
  
  async loadScene(sceneName: string) {
    // 释放旧场景资源
    this.unloadCurrentScene();
    
    // 加载新场景资源
    const assets = this.getSceneAssets(sceneName);
    await ioc.loader.preload(assets, "shared");
    
    // 记录当前场景资源
    this.currentSceneAssets = assets;
  }
  
  unloadCurrentScene() {
    // 减少引用计数，自动释放
    this.currentSceneAssets.forEach(path => {
      ioc.cache.decRef(`local:shared@${path}`, true);
    });
    
    // 清理过期缓存
    ioc.cache.cleanup();
  }
}
```

### 场景 3: 动态内容加载

```typescript
class DynamicContent {
  async loadRemoteAvatar(url: string) {
    // 加载远程头像（短期缓存）
    const avatar = await ioc.loader.load(SpriteFrame, {
      path: url,
      cacheExpires: 60000, // 1分钟
    });
    
    return avatar;
  }
  
  async loadConfig() {
    // 加载远程配置（强制重新加载）
    const config = await ioc.loader.load(JsonAsset, {
      path: "https://api.game.com/config.json",
      forceReload: true,
    });
    
    return config;
  }
}
```

### 场景 4: 资源监控

```typescript
class ResourceMonitor {
  startMonitoring() {
    // 定期检查缓存状态
    ioc.timer.shared.loop(30, () => {
      const stats = ioc.cache.getStats();
      
      console.log("=== 资源缓存状态 ===");
      console.log(`总数: ${stats.total}`);
      console.log(`本地: ${stats.local} | 远程: ${stats.remote}`);
      console.log(`命中率: ${this.calculateHitRate(stats)}%`);
      
      // 缓存数量过多时警告
      if (stats.total > 100) {
        console.warn("⚠️ 缓存数量过多，建议清理");
        ioc.cache.cleanup();
      }
    }, this);
  }
  
  calculateHitRate(stats: ICacheStats): string {
    const total = stats.hits + stats.misses;
    return total > 0 
      ? ((stats.hits / total) * 100).toFixed(2) 
      : "0.00";
  }
}
```

## 📚 文档

- [完整使用文档](./resource-management.md)
- [示例代码](./resource-example.ts)
- [更新日志](./CHANGELOG.md)

## ⚙️ 配置建议

### 开发环境

```typescript
// 开启详细日志
ioc.loader.logEnabled = true;
ioc.cache.logEnabled = true;

// 较短的缓存时间，便于测试
ioc.loader.defaultCacheExpires = 60000; // 1分钟
```

### 生产环境

```typescript
// 关闭日志，提升性能
ioc.loader.logEnabled = false;
ioc.cache.logEnabled = false;

// 较长的缓存时间
ioc.loader.defaultCacheExpires = 300000; // 5分钟
```

## 🔄 迁移指南

### 从旧 API 迁移

#### 之前
```typescript
// 本地资源
const sprite = await ioc.res.loadSpriteFrame("img-hero", "shared");

// 远程资源
const remote = await ioc.remote.loadSpriteFrame("https://cdn.com/hero.png");
```

#### 现在
```typescript
// 统一接口（自动识别）
const sprite = await ioc.loader.loadSpriteFrame("img-hero", "shared");
const remote = await ioc.loader.loadSpriteFrame("https://cdn.com/hero.png");
```

### 兼容性

- ✅ 完全向后兼容
- ✅ 旧 API 仍然可用（`ioc.res`, `ioc.remote`）
- ✅ 推荐使用新 API（`ioc.loader`, `ioc.cache`）

## 💡 最佳实践

### 1. 资源生命周期管理

```typescript
// ✅ 推荐：使用引用计数
ioc.cache.addRef("local:shared@img-hero");
// ... 使用资源
ioc.cache.decRef("local:shared@img-hero", true);

// ❌ 不推荐：直接删除缓存
ioc.cache.delete("local:shared@img-hero", true);
```

### 2. 缓存策略

```typescript
// 永久资源（如 Logo）
await ioc.loader.load(SpriteFrame, {
  path: "img-logo",
  cacheExpires: 0, // 永不过期
});

// 常用资源（如角色）
await ioc.loader.load(SpriteFrame, {
  path: "img-hero",
  cacheExpires: 300000, // 5分钟
});

// 临时资源（如广告）
await ioc.loader.load(SpriteFrame, {
  path: "img-ad",
  cacheExpires: 30000, // 30秒
});
```

### 3. 预加载优化

```typescript
// ✅ 推荐：按场景预加载
await ioc.loader.preload([
  "img-scene-bg",
  "img-scene-ui",
  "pfb-scene-dialog",
]);

// ❌ 不推荐：一次性加载所有资源
// await ioc.loader.preload(allAssets); // 可能导致卡顿
```

### 4. 定期清理

```typescript
// ✅ 推荐：定时清理
ioc.timer.shared.loop(60, () => {
  ioc.cache.cleanup();
}, this);

// ✅ 推荐：场景切换时清理
onSceneExit() {
  ioc.cache.cleanup();
}
```

## 🐛 常见问题

### Q1: 如何查看当前缓存状态？

```typescript
const stats = ioc.cache.getStats();
console.log(stats);
```

### Q2: 如何强制重新加载资源？

```typescript
await ioc.loader.load(SpriteFrame, {
  path: "img-hero",
  forceReload: true,
});
```

### Q3: 如何禁用某个资源的缓存？

```typescript
await ioc.loader.load(SpriteFrame, {
  path: "img-temp",
  useCache: false,
});
```

### Q4: 远程资源加载失败怎么办？

```typescript
const sprite = await ioc.loader.loadSpriteFrame("https://cdn.com/hero.png");
if (!sprite) {
  // 使用本地默认资源
  const fallback = await ioc.loader.loadSpriteFrame("img-default");
}
```

### Q5: 如何清理所有远程资源缓存？

```typescript
import { CacheSource } from "../qin";
ioc.cache.clearBySource(CacheSource.Remote, true);
```

## 📈 性能监控

### 缓存命中率监控

```typescript
function monitorCachePerformance() {
  const stats = ioc.cache.getStats();
  const total = stats.hits + stats.misses;
  
  if (total > 0) {
    const hitRate = (stats.hits / total) * 100;
    
    if (hitRate < 50) {
      console.warn(`⚠️ 缓存命中率过低: ${hitRate.toFixed(2)}%`);
    } else {
      console.log(`✅ 缓存命中率: ${hitRate.toFixed(2)}%`);
    }
  }
}
```

### 内存使用监控

```typescript
function monitorMemoryUsage() {
  const stats = ioc.cache.getStats();
  
  if (stats.total > 100) {
    console.warn(`⚠️ 缓存数量过多: ${stats.total}`);
    console.log("建议执行清理操作");
    ioc.cache.cleanup();
  }
}
```

## 🎉 总结

这次资源管理优化带来了：

✅ **更简单** - 统一的加载接口，无需区分本地和远程  
✅ **更高效** - 智能缓存机制，提升加载性能  
✅ **更可控** - 引用计数和过期控制，精确管理资源  
✅ **更清晰** - 详细的统计信息，一目了然  
✅ **更自动** - 自动清理机制，减少手动维护  

开始使用新的资源管理系统，让你的游戏资源管理更加轻松高效！🚀

## 📞 反馈与支持

如有问题或建议，请参考 [contact.md](./contact.md) 文档。