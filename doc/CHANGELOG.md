# Qin Framework - 更新日志

## [Unreleased]

### 2025-01-XX - v0.1.0 资源管理优化

#### ✨ 新增功能

##### 🎯 统一资源加载器 (AssetLoader)
- 新增 `AssetLoader` 依赖容器，提供统一的资源加载接口
- 自动识别本地资源和远程资源，无需手动判断
- 支持所有常用资源类型的加载：
  - 图片资源（Image, SpriteFrame, Texture, Atlas）
  - 预制体（Prefab）
  - 配置文件（JSON, Text）
  - 音频（AudioClip）
  - 骨骼动画（Spine）
  - 字体（Font, TTFFont, BitmapFont）
  - 粒子（Particle）
  - 视频（Video）
  - 二进制（Binary）
  - 瓦片地图（TiledMap）
  - 动画片段（Animation）

##### 💾 统一缓存管理器 (CacheContainer)
- 新增 `CacheContainer` 依赖容器，统一管理所有资源缓存
- 支持资源来源区分（本地/远程）
- 支持缓存过期时间控制
- 支持引用计数管理
- 支持缓存统计信息（命中率、资源数量等）
- 自动清理过期缓存
- 支持手动清理和按来源清理

#### 🔧 优化改进

##### 资源加载优化
- 统一本地和远程资源的加载接口
- 智能缓存机制，提升资源加载性能
- 支持强制重新加载选项
- 支持禁用缓存选项
- 支持自定义缓存过期时间
- 新增预加载功能，支持批量加载和进度回调

##### 缓存管理优化
- 缓存键值自动生成（本地：`local:bundle@path`，远程：`remote:url`）
- 资源有效性自动检查
- 过期缓存自动清理
- 支持查询缓存命中率
- 支持按来源统计缓存数量

##### 性能优化
- 自动定时清理过期缓存（默认每秒检查一次）
- 引用计数为 0 时可自动释放资源
- 支持卸载资源包时自动清理相关缓存

#### 📦 新增 API

##### AssetLoader API
```typescript
// IoC 容器访问
ioc.loader: IAssetLoader

// 基础加载方法
ioc.loader.load<T>(type: Constructor<T>, options: ILoadOptions): Promise<T | null>
ioc.loader.loadImage(path: string, bundle?: string): Promise<ImageAsset | null>
ioc.loader.loadSpriteFrame(path: string, bundle?: string): Promise<SpriteFrame | null>
ioc.loader.loadAtlas(path: string, bundle?: string): Promise<SpriteAtlas | null>
ioc.loader.loadTexture(path: string, bundle?: string): Promise<Texture2D | null>
ioc.loader.loadPrefab(path: string, bundle?: string): Promise<Prefab | null>
ioc.loader.loadText(path: string, bundle?: string): Promise<TextAsset | null>
ioc.loader.loadJson(path: string, bundle?: string): Promise<JsonAsset | null>
ioc.loader.loadSpine(path: string, bundle?: string): Promise<sp.SkeletonData | null>
ioc.loader.loadFont(path: string, bundle?: string): Promise<Font | null>
ioc.loader.loadAudio(path: string, bundle?: string): Promise<AudioClip | null>
ioc.loader.loadParticle(path: string, bundle?: string): Promise<ParticleAsset | null>
ioc.loader.loadTmx(path: string, bundle?: string): Promise<TiledMapAsset | null>
ioc.loader.loadBinary(path: string, bundle?: string): Promise<BufferAsset | null>
ioc.loader.loadVideo(path: string, bundle?: string): Promise<VideoClip | null>
ioc.loader.loadAnimation(path: string, bundle?: string): Promise<AnimationClip | null>

// 资源包管理
ioc.loader.loadBundle(bundle: string): Promise<AssetManager.Bundle | null>
ioc.loader.unloadBundle(bundle: string, releaseAll?: boolean): void

// 资源释放
ioc.loader.release(path: string, bundle?: string): void

// 预加载
ioc.loader.preload(
  paths: string[],
  bundle?: string,
  onProgress?: (finished: number, total: number, item: any) => void
): Promise<void>

// 工具方法
ioc.loader.isRemote(path: string): boolean

// 配置属性
ioc.loader.logEnabled: boolean
ioc.loader.defaultCacheExpires: number
```

##### CacheContainer API
```typescript
// IoC 容器访问
ioc.cache: ICacheContainer

// 缓存操作
ioc.cache.set(options: ICacheOptions): void
ioc.cache.get<T>(key: string): T | null
ioc.cache.has(key: string): boolean
ioc.cache.delete(key: string, release?: boolean): boolean

// 引用计数
ioc.cache.addRef(key: string): number
ioc.cache.decRef(key: string, autoRelease?: boolean): number

// 缓存清理
ioc.cache.cleanup(): number
ioc.cache.clear(release?: boolean): void
ioc.cache.clearBySource(source: CacheSource, release?: boolean): number

// 统计信息
ioc.cache.getStats(): ICacheStats
ioc.cache.keys(source?: CacheSource): string[]

// 配置属性
ioc.cache.logEnabled: boolean
```

##### 新增类型定义
```typescript
// 缓存来源
enum CacheSource {
  Local = "local",
  Remote = "remote",
}

// 加载选项
interface ILoadOptions {
  path: string;
  bundle?: string;
  useCache?: boolean;
  cacheExpires?: number;
  forceReload?: boolean;
}

// 缓存选项
interface ICacheOptions {
  key: string;
  asset: Asset;
  source: CacheSource;
  expires?: number;
  refCount?: number;
}

// 缓存统计
interface ICacheStats {
  total: number;
  local: number;
  remote: number;
  permanent: number;
  temporary: number;
  hits: number;
  misses: number;
}
```

#### 📚 新增文档

- `doc/resource-management.md` - 详细的资源管理使用文档
- `doc/resource-example.ts` - 15个实用示例代码

#### 🔄 IoC 容器更新

在 `ioc` 中新增以下访问器：
- `ioc.cache` - 缓存容器
- `ioc.loader` - 资源加载器

#### ⚠️ 兼容性说明

- ✅ 完全向后兼容，原有的 `ResContainer` 和 `RemoteContainer` 仍可正常使用
- ✅ 推荐使用新的 `AssetLoader` 统一接口
- ✅ 所有资源自动通过 `CacheContainer` 管理

#### 💡 使用建议

1. **统一使用 AssetLoader**
   ```typescript
   // 推荐
   await ioc.loader.loadSpriteFrame("img-hero");
   
   // 不推荐（虽然仍可用）
   await ioc.res.loadSpriteFrame("img-hero");
   ```

2. **合理配置缓存时间**
   - 永久资源：`cacheExpires: 0`
   - 常用资源：`cacheExpires: 300000` (5分钟)
   - 临时资源：`cacheExpires: 60000` (1分钟)

3. **及时释放资源**
   - 使用引用计数管理资源生命周期
   - 场景切换时清理旧场景资源
   - 定期执行 `ioc.cache.cleanup()`

4. **监控缓存状态**
   ```typescript
   const stats = ioc.cache.getStats();
   console.log(`缓存命中率: ${(stats.hits / (stats.hits + stats.misses) * 100).toFixed(2)}%`);
   ```

---

## [0.0.1] - 2025-01-XX

### 初始版本

#### ✨ 核心功能

- 依赖注入系统（IoC）
- 事件总线（EventBus）
- 日志系统（Logcat）
- 应用循环系统（Looper）
- 定时器容器（Timer）
- 对象池容器（ObPoC）
- 节点池容器（NodePoC）
- 本地资源容器（ResContainer）
- 远程资源容器（RemoteContainer）
- 资源自动释放池（ReleasableContainer）
- 音频播放器（AudioPlayer）
- 启动器（Launcher）
- 环境参数解析器（Environment）
- 递增ID生成器（Incremental）
- 敏感词过滤器（Sensitives）
- ASTC 纹理解析器（ASTC）

#### 📦 基础架构

- 原子组件系统（Atom）
- 基础能力模块（Ability）
- 辅助功能模块（Foundation）
- 类型定义（Typings）
- 预设配置（Preset）

#### 📚 文档

- `doc/agent.md` - 开发路线图
- `doc/contact.md` - 编码规范

---

## 版本规范

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范。

版本格式：`主版本号.次版本号.修订号`

- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

---

## 更新类型说明

- ✨ **新增功能** (Features) - 新增的功能特性
- 🔧 **优化改进** (Improvements) - 现有功能的优化
- 🐛 **问题修复** (Bug Fixes) - 修复的 bug
- 📚 **文档更新** (Documentation) - 文档的更新
- ⚠️ **破坏性变更** (Breaking Changes) - 不兼容的更新
- 🗑️ **废弃标记** (Deprecated) - 即将废弃的功能
- 🔒 **安全修复** (Security) - 安全相关的修复
- 🎨 **代码样式** (Style) - 代码格式化等不影响功能的修改
- ♻️ **代码重构** (Refactor) - 既不是新增功能也不是修复bug的代码变动
- ⚡ **性能优化** (Performance) - 提升性能的代码更改
- 🔥 **移除功能** (Remove) - 移除的功能或文件