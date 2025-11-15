# 富文本系统使用说明

本文档介绍 `qin` 框架内的富文本系统，包括：

- **依赖模块**：`RichTextAtlas`、`AutoAtlas`、IoC 等
- **组件**：`RichTextAtom`
- **图集等级与性能**：如何按需配置不同尺寸的图集
- **常见用法与注意事项**

---

## 1. 整体架构概览

富文本系统的目标：

- **低 DrawCall**：所有字符优先合批到自动图集中渲染
- **富样式支持**：颜色、字号、粗体、斜体、下划线、描边、阴影
- **Unicode 友好**：按 **grapheme cluster** 解析文本
- **交互能力**：支持超链接点击区域
- **打字机效果**：按字符/字形顺序渐进显示

核心组成：

- **RichTextAtlas（依赖）**：
  - 管理富文本所用的所有字符图集（`AutoAtlas`）
  - 按 `atlasKey` 区分不同用途的图集
  - 按 **图集等级** 控制单张纹理大小
  - 提供使用统计（图集数量、估算显存占用）
- **RichTextAtom（组件）**：
  - 挂在场景节点上的富文本渲染组件
  - 负责文本解析、布局与渲染
  - 通过 IoC 使用 `RichTextAtlas` 进行 glyph 缓存与图集管理

---

## 2. 依赖模块

### 2.1 IoC 与 RichTextAtlas

相关文件：

- `assets/qin/dependency/rich-text-atlas.typings.ts`
- `assets/qin/dependency/rich-text-atlas.ts`
- `assets/qin/ioc.ts`

`RichTextAtlas` 被注册为 IoC 依赖：

- 通过 `@Injectable({ name: "RichTextAtlas", priority: 220 })` 注册
- 启动时会在根节点下挂载一个用于生成字符贴图的模板节点
- 通过 `ioc.richTextAtlas` 静态访问

**主要接口（简要）：**

```ts
interface IRichTextAtlas {
  addRef(atlasKey: string): void;
  release(atlasKey: string): void;

  configureAtlas(atlasKey: string, level: RichTextAtlasLevel): void;

  getUsage(): IRichTextAtlasUsage[];

  // 其他：获取 / 创建 glyph、内部图集管理等
}
```

> 注：实际接口定义以 `rich-text-atlas.typings.ts` 为准。

### 2.2 RichTextAtlasLevel（图集等级）

`RichTextAtlasLevel` 用于控制每个 `atlasKey` 所对应的 **单张 AutoAtlas 纹理尺寸**：

```ts
enum RichTextAtlasLevel {
  Micro = 128, // 微型：128x128
  Small = 256, // 小型：256x256
  Medium = 512, // 中型：512x512（默认推荐）
  Large = 1024, // 大型：1024x1024
  XLarge = 2048, // 超大型：2048x2048
}
```

- **一个 atlasKey 对应一个等级**，一旦配置后应避免在运行中反复修改
- 每个等级的值即纹理尺寸（宽高相同）

### 2.3 AutoAtlas

相关文件：`assets/qin/foundation/auto-atlas.ts`

`AutoAtlas` 是通用的自动图集打包工具：

- 根据传入的宽高、边框、间距等参数创建一张或多张纹理
- 接收小图（glyph）并尝试打进当前纹理；放不下时自动扩展/新建页面
- 返回可用于 `Sprite` 渲染的 `SpriteFrame`

在富文本场景中：

- RichTextAtlas 按 `atlasKey` 管理多个 `AutoAtlas` 实例
- glyph（字符图像）通过 `AutoAtlas` 被打入对应的纹理中

---

## 3. RichTextAtom 组件

相关文件：`assets/qin/atom/rich-text-atom.ts`

`RichTextAtom` 是一个继承自 `Atom` 的组件，用于在场景中渲染富文本。

### 3.1 主要功能

- 文本解析
  - 支持基础文本
  - 支持简单的富文本标签（颜色、字体、大小、链接等）
  - 按 grapheme cluster 切分，避免 Emoji、合成字符被拆开
- 布局
  - 最大宽度限制
  - 行高配置
  - 水平对齐：左/中/右
  - 垂直对齐：顶部/中部/底部
  - 字间距
- 样式
  - 颜色、字体、字号
  - 粗体、斜体
  - 下划线（连续下划线合并为一条）
  - 描边、阴影
- 交互
  - 支持超链接区域点击回调
- 打字机效果
  - 支持按字符逐步显示文本内容

### 3.2 组件属性说明

#### 文本与布局

- **`text: string`**
  - 文本内容（支持换行与富文本标签）
- **`maxWidth: number`**
  - 最大宽度，`0` 表示不限制自动换行
- **`lineHeight: number`**
  - 行高（像素）
- **`letterSpacing: number`**
  - 字间距（像素）
- **`horizontalAlign: HorizontalAlign`**
  - 水平对齐方式：`LEFT / CENTER / RIGHT`
- **`verticalAlign: VerticalAlign`**
  - 垂直对齐方式：`TOP / MIDDLE / BOTTOM`

#### 字体相关

- **`ttfFont: TTFFont | null`**
  - 可选的 Cocos `TTFFont` 资源
  - 若为空，则使用系统字体
- **`fontFamily: string`**
  - 字体名称（例如：`"Arial"`、`"微软雅黑"`）
  - 当同时配置了 `ttfFont` 和 `fontFamily` 时，以实现逻辑为准（一般优先 `ttfFont`）

#### 图集相关

- **`atlasKey: string`**
  - 自动图集标识
  - tooltip：`自动图集标识（请合理区分不同用途文本，避免所有文本使用同一个标识）`
  - 建议：不同用途 / 尺寸段的文本使用不同的 `atlasKey`，例如：
    - `ui-richtext-default`
    - `ui-richtext-title`
    - `battle-richtext-float`
- **`atlasLevel: AtlasLevel`**
  - 图集等级（编辑器中使用本地枚举 `AtlasLevel` 映射到 `RichTextAtlasLevel`）
  - 选项：`Micro / Small / Medium / Large / XLarge`
  - 默认值：`Medium`
  - 功能：控制当前 `atlasKey` 所使用图集的单张纹理尺寸

组件启动时会执行：

```ts
protected _doStart(): void {
  ioc.richTextAtlas.configureAtlas(this.atlasKey, this.atlasLevel as RichTextAtlasLevel);
  ioc.richTextAtlas.addRef(this.atlasKey);
  // ...
}
```

> 注意：如果某个 `atlasKey` 已在其他地方配置过等级，
> `configureAtlas` 会在日志中给出警告并忽略后续重复配置，请尽量在工程内统一管理 key 和等级。

#### 打字机效果

- **`typewriterTime: number`**
  - 打字机效果：**单个字符出现的时间（毫秒）**
  - `0` 表示关闭打字机效果，直接显示全部文字

#### 交互

- **`onLinkClick: Triggers`**
  - 链接点击事件
  - 当文本中存在带链接的片段时，点击文本会触发该事件
  - 回调参数视实现而定（一般包含链接标识、文本内容等）

---

## 4. 图集等级与性能建议

### 4.1 为何需要图集等级

- 字符渲染依赖 `AutoAtlas`，每个 `atlasKey` 对应一组纹理
- 纹理越大，**单图能装的字符越多**，但 **显存占用也越大**
- 通过图集等级可以：
  - 为**文本量少**的场景使用小图集，减少显存浪费
  - 为**文本量大 / 大字号**的场景使用大图集，减少拆分和重建带来的开销

### 4.2 等级选择建议

- **Micro (128x128)**
  - 测试用、小图标、极少数字/字母
- **Small (256x256)**
  - 小段提示文本、按钮文案等
- **Medium (512x512)** **（默认）**
  - 一般 UI 文本
  - 适合大多数普通界面
- **Large (1024x1024)**
  - 大量文案、长段落文本
  - 或者有较多大字号标题的界面
- **XLarge (2048x2048)**
  - 特殊需求：超多文字、大字号特效文本
  - 建议谨慎使用，并配合独立 `atlasKey`

### 4.3 关于 atlasKey 的分配

**强烈建议**：不要将所有富文本都绑定到同一个 `atlasKey` 上。

建议策略：

- 按 **系统/模块** 切分：
  - `ui-richtext-default`（通用 UI）
  - `ui-richtext-dialog`（对话框）
  - `battle-richtext-float`（战斗飘字）
- 按 **字体/字号类型** 切分：
  - 大标题、大字号使用单独的 key，并配置更高等级
  - 小字号文案使用较小等级

在 `configureAtlas` 内部，当一个 `atlasKey` 已经配置过等级时，若再次配置将得到类似日志：

> 富文本图集：xxx 已配置为 Medium，请注意合理分配图集标识和等级

这用于提醒工程内避免反复修改同一 key 的等级。

---

## 5. 使用示例

### 5.1 在场景中使用 RichTextAtom

1. 在场景中创建一个空节点
2. 挂载 `RichTextAtom` 组件
3. 配置属性：
   - `text`：填写富文本内容
   - `maxWidth`：根据 UI 布局设置换行宽度
   - `atlasKey`：如 `ui-richtext-default`
   - `atlasLevel`：默认 `Medium`，如有特殊需要可调整
   - `typewriterTime`：需要打字机效果时设置为大于 0 的值

### 5.2 代码控制打字机效果

（伪代码，仅说明调用方式）

```ts
// 从节点上获取组件
const richText = node.getComponent(RichTextAtom)!;

// 使用时间线控制进度
richText.setTypewriterProgress(0);
// 配合 Tweener / Tween 在一段时间内将进度从 0 推到 1
```

### 5.3 查询图集使用情况

`RichTextAtlas` 提供了 `getUsage()` 用于查询当前所有富文本图集的使用信息：

- atlasKey
- 配置的等级和纹理尺寸
- 图集中 glyph 数量
- 估算显存占用

可用于：

- 开发阶段观察哪些 key 占用较大
- 调整 `atlasKey` 划分与 `atlasLevel` 选择

---

## 6. 常见问题与建议

- **Q：为什么默认图集等级是 Medium ？**
  - A：`512x512` 在显存占用与容纳字数之间较为均衡，适合作为通用默认值。
- **Q：什么时候需要显式配置 XLarge？**
  - A：只有在确认某个 `atlasKey` 下的字符非常多、且需要大字号/特效字时才建议使用，并应确保该 key 只用于特定场景。
- **Q：为什么会看到重复配置 key 的警告？**
  - A：说明同一个 `atlasKey` 在多个地方被调用 `configureAtlas` 且等级不一致。建议统一管理并只在一处确定等级。

---

如需扩展功能（例如新增富文本标签、更多对齐方式等），建议：

- 优先在 `RichTextAtom` 中扩展解析与布局逻辑
- 保持 `RichTextAtlas` 的职责仅聚焦于：**glyph 缓存 + 图集管理 + 使用统计**
