# 资源管理优化文档

## 概述

Qin 框架的资源管理系统已经过优化，现在提供了统一的资源加载和缓存管理机制。新架构包含以下核心组件：

- **CacheContainer** - 统一缓存管理容器
- **AssetLoader** - 统一资源加载器
- **ResContainer** - 本地资源容器（底层）
- **RemoteContainer** - 远程资源容器（底层）

## 架构设计

```
┌─────────────────────────────────────────┐
│          AssetLoader (统一接口)          │
│  - 自动判断本地/远程                      │
│  - 统一加载接口                           │
│  - 自动缓存管理                           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       CacheContainer (缓存管理)          │
│  - 统一缓存存储                           │
│  - 引用计数管理                           │
│  - 过期时间控制                           │
│  - 缓存统计信息                           │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌─────────────┐  ┌─────────────┐
│ResContainer │  │RemoteContainer│
│  (本地资源)  │  │  (远程资源)   │
└─────────────┘  └─────────────┘
```

## 核心特性

### 1. 统一加载接口

无需关心资源来源（本地/远程），使用统一的 API 加载资源：

```typescript
import qin, { ioc } from "../qin";

// 加载本地资源
const sprite = await ioc.loader.loadSpriteFrame("img-hero", "shared");

// 加载远程资源（自动识别）
const remoteSprite = await ioc.loader.loadSpriteFrame("https://cdn.example.com/hero.png");
```

### 2. 智能缓存管理

- 自动缓存加载的资源
- 支持缓存命中/未命中统计
- 支持过期时间控制
- 支持引用计数管理

### 3. 资源来源区分

缓存系统自动区分资源来源：

- `CacheSource.Local` - 本地资源
- `CacheSource.Remote` - 远程资源

### 4. 自动清理机制

- 定时清理过期缓存
- 支持手动清理
- 支持按来源清理

## 使用指南

### 基础用法

#### 1. 加载资源

```typescript
import { ioc } from "../qin";

// 加载精灵帧
const sprite = await ioc.loader.loadSpriteFrame("img-hero");

// 加载预制体
const prefab = await ioc.loader.loadPrefab("pfb-dialog");

// 加载 JSON 配置
const config = await ioc.loader.loadJson("cfg-game");

// 加载音频
const audio = await ioc.loader.loadAudio("aud-bgm");
```

#### 2. 指定资源包

```typescript
// 从指定资源包加载
const sprite = await ioc.loader.loadSpriteFrame("img-hero", "resources");
```

#### 3. 高级加载选项

```typescript
import { ioc, SpriteFrame } from "../qin";

// 使用完整配置
const sprite = await ioc.loader.load(SpriteFrame, {
  path: "img-hero",
  bundle: "shared",
  useCache: true,           // 是否使用缓存
  cacheExpires: 60000,      // 缓存过期时间（毫秒）
  forceReload: false,       // 是否强制重新加载
});
```

#### 4. 加载远程资源

```typescript
// 加载远程图片
const remoteSprite = await ioc.loader.loadSpriteFrame(
  "https://cdn.example.com/images/hero.png"
);

// 加载远程 JSON
const remoteConfig = await ioc.loader.loadJson(
  "https://api.example.com/config.json"
);
```

### 缓存管理

#### 1. 手动设置缓存

```typescript
import { ioc, CacheSource } from "../qin";

// 手动添加到缓存
ioc.cache.set({
  key: "my-asset",
  asset: myAsset,
  source: CacheSource.Local,
  expires: 120000,  // 2分钟后过期
  refCount: 0,
});
```

#### 2. 获取缓存

```typescript
// 获取缓存的资源
const cached = ioc.cache.get<SpriteFrame>("local:shared@img-hero");

if (cached) {
  console.log("缓存命中");
}
```

#### 3. 检查缓存

```typescript
// 检查缓存是否存在
if (ioc.cache.has("local:shared@img-hero")) {
  console.log("缓存存在");
}
```

#### 4. 删除缓存

```typescript
// 删除缓存（不释放资源）
ioc.cache.delete("local:shared@img-hero", false);

// 删除缓存并释放资源
ioc.cache.delete("local:shared@img-hero", true);
```

#### 5. 引用计数管理

```typescript
// 增加引用计数
ioc.cache.addRef("local:shared@img-hero");

// 减少引用计数（引用为0时自动释放）
ioc.cache.decRef("local:shared@img-hero", true);
```

#### 6. 清理缓存

```typescript
// 清理过期缓存
const count = ioc.cache.cleanup();
console.log(`清理了 ${count} 个过期缓存`);

// 清空所有缓存
ioc.cache.clear(true);

// 清理指定来源的缓存
import { CacheSource } from "../qin";
ioc.cache.clearBySource(CacheSource.Remote, true);
```

#### 7. 获取统计信息

```typescript
// 获取缓存统计
const stats = ioc.cache.getStats();
console.log("总缓存数:", stats.total);
console.log("本地资源:", stats.local);
console.log("远程资源:", stats.remote);
console.log("缓存命中:", stats.hits);
console.log("缓存未命中:", stats.misses);
console.log("命中率:", (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2) + "%");
```

### 资源释放

#### 1. 释放单个资源

```typescript
// 通过加载器释放
ioc.loader.release("img-hero", "shared");

// 或直接操作缓存
ioc.cache.delete("local:shared@img-hero", true);
```

#### 2. 卸载资源包

```typescript
// 卸载资源包（自动清理缓存）
ioc.loader.unloadBundle("shared", true);
```

### 预加载

```typescript
// 预加载资源列表
const paths = [
  "img-hero",
  "img-enemy",
  "pfb-dialog",
  "aud-bgm",
];

await ioc.loader.preload(paths, "shared", (finished, total, item) => {
  console.log(`加载进度: ${finished}/${total}`);
});
```

## 配置选项

### AssetLoader 配置

```typescript
import { ioc } from "../qin";

// 开启日志
ioc.loader.logEnabled = true;

// 设置默认缓存过期时间（毫秒）
ioc.loader.defaultCacheExpires = 300000; // 5分钟
```

### CacheContainer 配置

```typescript
import { ioc } from "../qin";

// 开启日志
ioc.cache.logEnabled = true;
```

## 最佳实践

### 1. 资源生命周期管理

```typescript
class GameScene {
  private __loadedAssets: string[] = [];

  async onLoad() {
    // 加载场景资源
    const hero = await ioc.loader.loadSpriteFrame("img-hero");
    this.__loadedAssets.push("img-hero");

    // 增加引用计数
    ioc.cache.addRef("local:shared@img-hero");
  }

  onDestroy() {
    // 释放场景资源
    this.__loadedAssets.forEach(path => {
      ioc.cache.decRef(`local:shared@${path}`, true);
    });
  }
}
```

### 2. 按需加载

```typescript
// 游戏启动时只加载必要资源
async onGameStart() {
  await ioc.loader.loadSpriteFrame("img-loading");
  
  // 进入场景后再加载场景资源
  this.enterScene();
}

async enterScene() {
  await ioc.loader.preload([
    "img-hero",
    "img-enemy",
    "pfb-dialog",
  ]);
}
```

### 3. 远程资源管理

```typescript
// 远程资源通常设置较短的缓存时间
const remoteAsset = await ioc.loader.load(SpriteFrame, {
  path: "https://cdn.example.com/hero.png",
  cacheExpires: 60000, // 1分钟
});
```

### 4. 缓存策略

```typescript
// 永久资源（不过期）
const logo = await ioc.loader.load(SpriteFrame, {
  path: "img-logo",
  cacheExpires: 0, // 永不过期
});

// 临时资源（短期缓存）
const ad = await ioc.loader.load(SpriteFrame, {
  path: "img-ad",
  cacheExpires: 30000, // 30秒
});
```

### 5. 定期清理

```typescript
// 在适当的时机清理缓存
class ResourceManager {
  startCleanupTimer() {
    ioc.timer.schedule({
      name: "cache-cleanup",
      interval: 60, // 每60秒
      repeat: -1,   // 无限重复
      handle: () => {
        const count = ioc.cache.cleanup();
        if (count > 0) {
          console.log(`自动清理了 ${count} 个过期缓存`);
        }
      },
    });
  }
}
```

## 迁移指南

### 从旧 API 迁移到新 API

#### 旧方式：

```typescript
// 旧方式 - 直接使用 ResContainer
const sprite = await ioc.res.loadSpriteFrame("img-hero", "shared");

// 旧方式 - 直接使用 RemoteContainer
const remote = await ioc.remote.loadSpriteFrame("https://cdn.com/hero.png");
```

#### 新方式：

```typescript
// 新方式 - 使用统一的 AssetLoader
const sprite = await ioc.loader.loadSpriteFrame("img-hero", "shared");

// 远程资源也使用相同接口（自动判断）
const remote = await ioc.loader.loadSpriteFrame("https://cdn.com/hero.png");
```

### 兼容性说明

- 旧的 `ResContainer` 和 `RemoteContainer` 仍然可用
- 新的 `AssetLoader` 是推荐的统一接口
- 所有资源都会通过 `CacheContainer` 统一管理

## 性能优化建议

### 1. 合理设置缓存时间

```typescript
// 根据资源使用频率设置缓存时间
- 高频资源：永不过期（0）
- 中频资源：较长时间（5-10分钟）
- 低频资源：较短时间（1-2分钟）
```

### 2. 预加载关键资源

```typescript
// 在等待界面预加载下一个场景的资源
async preloadNextScene() {
  await ioc.loader.preload([
    "img-scene-bg",
    "img-scene-character",
    "pfb-scene-ui",
  ], "shared");
}
```

### 3. 及时释放不用的资源

```typescript
// 切换场景时释放旧场景资源
onSceneExit() {
  ioc.cache.clearBySource(CacheSource.Local, true);
}
```

### 4. 监控缓存状态

```typescript
// 定期检查缓存状态
setInterval(() => {
  const stats = ioc.cache.getStats();
  if (stats.total > 100) {
    console.warn("缓存数量过多，建议清理");
    ioc.cache.cleanup();
  }
}, 30000);
```

## 注意事项

1. **资源键值规则**：
   - 本地资源：`local:bundle@path`
   - 远程资源：`remote:url`

2. **引用计数**：
   - 使用 `addRef` 和 `decRef` 管理资源生命周期
   - `decRef` 到 0 时可自动释放

3. **缓存清理**：
   - 系统会自动定时清理过期缓存
   - 也可以手动调用 `cleanup()` 清理

4. **日志开关**：
   - 开发阶段建议开启日志：`ioc.loader.logEnabled = true`
   - 生产环境建议关闭日志以提升性能

## 常见问题

### Q1: 如何禁用缓存？

```typescript
const asset = await ioc.loader.load(SpriteFrame, {
  path: "img-hero",
  useCache: false,
});
```

### Q2: 如何强制重新加载资源？

```typescript
const asset = await ioc.loader.load(SpriteFrame, {
  path: "img-hero",
  forceReload: true,
});
```

### Q3: 如何查看缓存命中率？

```typescript
const stats = ioc.cache.getStats();
const hitRate = (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2);
console.log(`缓存命中率: ${hitRate}%`);
```

### Q4: 远程资源加载失败怎么办？

```typescript
try {
  const asset = await ioc.loader.loadSpriteFrame("https://cdn.com/hero.png");
  if (!asset) {
    console.error("加载失败，使用默认资源");
    // 使用本地默认资源
    const fallback = await ioc.loader.loadSpriteFrame("img-default");
  }
} catch (error) {
  console.error("加载异常:", error);
}
```

## 总结

新的资源管理系统提供了：

✅ 统一的加载接口  
✅ 智能缓存管理  
✅ 自动来源识别  
✅ 引用计数支持  
✅ 过期时间控制  
✅ 详细的统计信息  
✅ 灵活的清理策略  

通过使用 `AssetLoader` 和 `CacheContainer`，你可以更方便地管理游戏资源，提升游戏性能和用户体验。