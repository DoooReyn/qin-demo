# 资源管理系统完整文档

## 📋 概述

Qin 框架提供了一套完整的资源管理系统，统一管理本地和远程资源的加载、缓存和释放。

### 核心组件

- **CacheContainer** - 统一缓存管理容器（自动清理）
- **AssetLoader** - 统一资源加载器（支持单个、批量、队列加载）
- **ResContainer** - 本地资源容器（底层）
- **RemoteContainer** - 远程资源容器（底层）

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────┐
│            AssetLoader (统一加载接口)                 │
│  ┌─────────────────────────────────────────────┐   │
│  │ 单个资源加载                                  │   │
│  │ - load(), loadSpriteFrame(), loadPrefab()... │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ 批量预加载                                    │   │
│  │ - preload([路径, 类型, bundle?])              │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ 队列加载 (新)                                 │   │
│  │ - loadSequence() 顺序加载                     │   │
│  │ - loadParallel() 并行加载 (支持并发数控制)    │   │
│  │ - loadQueue() 通用队列加载                    │   │
│  └─────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│         CacheContainer (缓存管理)                    │
│  - 统一缓存存储                                       │
│  - 引用计数管理                                       │
│  - 过期时间控制                                       │
│  - 自动定时清理                                       │
│  - 缓存统计信息                                       │
└──────────────────┬──────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         ↓                   ↓
┌─────────────────┐  ┌──────────────────┐
│  ResContainer   │  │ RemoteContainer  │
│   (本地资源)     │  │   (远程资源)      │
└─────────────────┘  └──────────────────┘
```

## ✨ 核心特性

### 1. 统一加载接口

- 自动识别本地/远程资源
- 统一的 API，无需区分来源
- 自动缓存管理

### 2. 智能缓存管理

- 自动缓存加载的资源
- 缓存命中率统计
- 过期时间控制
- 引用计数管理
- 自动定时清理

### 3. 多种加载模式

- 单个资源加载
- 批量预加载
- 顺序队列加载（串行）
- 并行队列加载（支持并发数控制）

### 4. 任务状态管理

- 5 种任务状态（等待、加载中、完成、失败、取消）
- 实时进度追踪
- 支持取消队列

## 🚀 快速开始

### 1. 基础加载

```typescript
import { ioc } from "../qin";

// 加载精灵帧
const sprite = await ioc.loader.loadSpriteFrame("l:resources@img-hero");

// 加载预制体
const prefab = await ioc.loader.loadPrefab("l:resources@pfb-dialog");

// 加载 JSON
const config = await ioc.loader.loadJson("l:resources@cfg-game");

// 加载音频
const audio = await ioc.loader.loadAudio("l:resources@aud-bgm");
```

### 2. 指定资源包

```typescript
// 从指定资源包加载
const sprite = await ioc.loader.loadSpriteFrame("l:shared@img-hero");
```

### 3. 预加载

```typescript
import { SpriteFrame, Prefab, AudioClip } from "cc";

await ioc.loader.preload(
  [
    [SpriteFrame, "l:resources@img-hero"],
    [SpriteFrame, "l:resources@img-enemy"],
    [Prefab, "l:resources@pfb-dialog"],
    [AudioClip, "l:resources@aud-bgm"],
  ],
  (finished, total, path, loaded) => {
    console.log(`加载进度: ${finished}/${total}`);
  },
);
```

## 📦 单个资源加载

### 基础用法

```typescript
import { ioc } from "../qin";

// 加载各种类型的资源
const image = await ioc.loader.loadImage("l:resources@img-hero");
const spriteFrame = await ioc.loader.loadSpriteFrame("l:resources@img-hero");
const atlas = await ioc.loader.loadAtlas("l:resources@atl-ui");
const texture = await ioc.loader.loadTexture("l:resources@img-bg");
const prefab = await ioc.loader.loadPrefab("l:resources@pfb-dialog");
const text = await ioc.loader.loadText("l:resources@data-config");
const json = await ioc.loader.loadJson("l:resources@cfg-game");
const spine = await ioc.loader.loadSpine("l:resources@ani-hero");
const font = await ioc.loader.loadFont("l:resources@fnt-custom");
const audio = await ioc.loader.loadAudio("l:resources@aud-bgm");
const particle = await ioc.loader.loadParticle("l:resources@ptc-fire");
const tmx = await ioc.loader.loadTmx("l:resources@map-level1");
const binary = await ioc.loader.loadBinary("l:resources@data-save");
const video = await ioc.loader.loadVideo("l:resources@vid-intro");
const animation = await ioc.loader.loadAnimation("l:resources@ani-walk");
```

### 高级选项

```typescript
import { SpriteFrame } from "cc";

// 使用完整配置
const sprite = await ioc.loader.load(SpriteFrame, {
  path: "l:resources@img-hero",
  cacheExpires: 300000, // 缓存过期时间（毫秒）
});
```

### 加载远程资源

```typescript
// 加载远程图片（自动识别）
const remoteSprite = await ioc.loader.loadSpriteFrame("l:images/hero.png");
```

## 🔄 队列加载系统

### 1. 顺序加载（串行）

一个接一个加载，保证加载顺序。

```typescript
import { ioc } from "../qin";
import { SpriteFrame, Prefab, AudioClip } from "cc";

// 顺序加载资源
const result = await ioc.loader.loadSequence(
  [
    [SpriteFrame, { path: "l:resources@img-bg" }],
    [SpriteFrame, { path: "l:resources@img-hero" }],
    [Prefab, { path: "l:resources@pfb-dialog" }],
    [AudioClip, { path: "l:resources@aud-bgm" }],
  ],
  (progress) => {
    console.log(`进度: ${(progress.progress * 100).toFixed(0)}%`);
    console.log(`已完成: ${progress.finished}/${progress.total}`);
  },
);

// 检查结果
if (result.succeeded === result.total) {
  console.log("✅ 所有资源加载成功");
} else {
  console.warn(`⚠️ 部分资源加载失败: ${result.failed}`);
}
```

### 2. 并行加载（支持并发数控制）

同时加载多个资源，可以限制并发数量。

```typescript
import { ioc } from "../qin";
import { SpriteFrame, Prefab } from "cc";

// 无限制并发（适合少量资源）
const result1 = await ioc.loader.loadParallel(
  [
    [SpriteFrame, { path: "l:resources@img-bg" }],
    [SpriteFrame, { path: "l:resources@img-hero" }],
    [Prefab, { path: "l:resources@pfb-dialog" }],
  ],
  Infinity,
  (progress) => {
    console.log(`进度: ${(progress.progress * 100).toFixed(0)}%`);
  },
);

// 限制并发数为 3（推荐，适合大量资源）
const result2 = await ioc.loader.loadParallel(
  [
    [SpriteFrame, { path: "l:resources@img-1" }],
    [SpriteFrame, { path: "l:resources@img-2" }],
    [SpriteFrame, { path: "l:resources@img-3" }],
    [SpriteFrame, { path: "l:resources@img-4" }],
    [SpriteFrame, { path: "l:resources@img-5" }],
    [SpriteFrame, { path: "l:resources@img-6" }],
    [SpriteFrame, { path: "l:resources@img-7" }],
    [SpriteFrame, { path: "l:resources@img-8" }],
  ],
  3,
  (progress) => {
    console.log(`加载中: ${progress.finished}/${progress.total}`);
  },
);
```

## 💾 缓存管理

### 1. 手动设置缓存

```typescript
import { ioc, CacheSource } from "../qin";

ioc.cache.set({
  key: "my-asset",
  asset: myAsset,
  source: CacheSource.Local,
  expires: 120000, // 2分钟后过期
  refCount: 0,
});
```

### 2. 获取缓存

```typescript
// 获取缓存的资源
const cached = ioc.cache.get<SpriteFrame>("l:shared@img-hero");

if (cached) {
  console.log("✅ 缓存命中");
}
```

### 3. 检查缓存

```typescript
if (ioc.cache.has("l:shared@img-hero")) {
  console.log("缓存存在");
}
```

### 4. 删除缓存

```typescript
// 删除缓存（不释放资源）
ioc.cache.delete("l:shared@img-hero", false);

// 删除缓存并释放资源
ioc.cache.delete("l:shared@img-hero", true);
```

### 5. 引用计数管理

```typescript
// 增加引用计数
ioc.cache.addRef("l:shared@img-hero");

// 减少引用计数（引用为0时自动释放）
ioc.cache.decRef("l:shared@img-hero", true);
```

### 6. 清理缓存

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

### 7. 获取统计信息

```typescript
// 获取缓存统计
const stats = ioc.cache.getStats();
console.log("总缓存数:", stats.total);
console.log("本地资源:", stats.local);
console.log("远程资源:", stats.remote);
console.log("永久缓存:", stats.permanent);
console.log("临时缓存:", stats.temporary);
```

## ⚙️ 配置选项

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

// 注意：CacheContainer 会自动注册定时清理任务
// 默认每秒检查一次过期缓存（PRESET.TIME.LAZY_CLEANUP_S）
// 无需手动配置，依赖容器初始化时自动启动
```

## 💡 最佳实践

### 1. 选择合适的加载模式

```typescript
// ✅ 推荐：重要资源使用顺序加载（确保加载顺序）
await ioc.loader.loadSequence([
  [SpriteFrame, { path: "l:resources@img-logo" } ],
  [JsonAsset, { path: "l:resources@cfg-game" } ],
  [SpriteFrame, { path: "l:resources@img-loading" } ],
]);

// ✅ 推荐：普通资源使用并行加载（提高速度）
await ioc.loader.loadParallel(
  [
    [SpriteFrame, { path: "l:resources@img-logo" } ],
    [JsonAsset, { path: "l:resources@cfg-game" } ],
    [SpriteFrame, { path: "l:resources@img-loading" } ],
  ],
  4,
); // 限制并发数
```

### 2. 合理设置并发数

```typescript
// ✅ 推荐：图片资源限制并发数 3-5（避免内存压力）
await ioc.loader.loadParallel(imageItems, 4);

// ✅ 推荐：小资源可以更高并发 10-20
await ioc.loader.loadParallel(configItems, 10);

// ⚠️ 不推荐：所有资源都无限制并发（可能导致性能问题）
await ioc.loader.loadParallel(allItems, Infinity);
```

### 3. 合理设置缓存时间

```typescript
// 永久资源（不过期）
const logo = await ioc.loader.load(SpriteFrame, {
  path: "img-logo",
  cacheExpires: 0, // 永不过期
});

// 常用资源（较长时间）
const hero = await ioc.loader.load(SpriteFrame, {
  path: "img-hero",
  cacheExpires: 300000, // 5分钟
});

// 临时资源（短期缓存）
const ad = await ioc.loader.load(SpriteFrame, {
  path: "img-ad",
  cacheExpires: 30000, // 30秒
});
```

### 4. 及时释放资源

```typescript
// 切换场景时释放旧场景资源
onSceneExit() {
  // 方式1: 按来源清理
  ioc.cache.clearBySource(CacheSource.Local, true);

  // 方式2: 使用引用计数
  this.__loadedAssets.forEach(path => {
    ioc.cache.decRef(`local:shared@${path}`, true);
  });

  // 方式3: 清理过期缓存
  ioc.cache.cleanup();
}
```

### 6. 监控缓存状态

```typescript
// 定期检查缓存状态
ioc.timer.shared.loop(
  60,
  () => {
    const stats = ioc.cache.getStats();

    console.log("=== 缓存状态 ===");
    console.log(`总数: ${stats.total}`);
    console.log(`本地: ${stats.local} | 远程: ${stats.remote}`);
    // 缓存数量过多时警告
    if (stats.total > 100) {
      console.warn("⚠️ 缓存数量过多，触发清理");
      ioc.cache.cleanup();
    }
  },
  this,
);
```

## 📊 性能对比

### 并发数建议

| 资源类型 | 推荐并发数 | 原因             |
| -------- | ---------- | ---------------- |
| 大图片   | 3-5        | 避免内存压力     |
| 小图片   | 5-10       | 平衡速度和内存   |
| 配置文件 | 10-20      | 文件小，可高并发 |
| 音频文件 | 3-5        | 文件较大         |
| 预制体   | 5-8        | 中等资源         |

## ⚠️ 注意事项

### 1. 资源键值规则

- 本地资源：`l:bundle@path`
- 远程资源：`r:url`

### 2. 引用计数

- 使用 `addRef` 和 `decRef` 管理资源生命周期
- `decRef` 到 0 时可自动释放

### 3. 自动清理机制

- `CacheContainer` 在初始化时会自动注册清理任务
- 默认每秒检查一次过期缓存（可在 `PRESET.TIME.LAZY_CLEANUP_S` 修改）
- 也可以随时手动调用 `ioc.cache.cleanup()` 清理
- 容器销毁时会自动注销清理任务

### 4. 日志开关

- 开发阶段建议开启日志：
  - `ioc.loader.logEnabled = true`
  - `ioc.cache.logEnabled = true`
- 生产环境建议关闭日志以提升性能
