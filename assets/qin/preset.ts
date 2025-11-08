import {
  __private, Animation, AudioSource, Button, EditBox, Input, Node, PageView, ScrollView, Sprite,
  UITransform, Vec2, Vec3, VideoPlayer, WebView
} from "cc";

/**
 * 预设集
 */
export const PRESET = {
  /** 常量宏定义 */
  MACRO: {
    STAGE: "root",
    CAMERA_UI: "camera-ui",
    AUDIO_PLAYER: "audio-player",
  },
  /** 常用预制体 */
  PREFAB: {
    /** 全局等待模板 */
    GLOBAL_WAITING: "resources@pfb-tpl-global-waiting",
    /** 文本模块模板 */
    LABEL: "resources@pfb-tpl-label",
  },
  /** 节点池 */
  ITEM_POOL: {
    /** 文本 */
    LABEL: "pfb-tpl-label",
  },
  /** 时间 */
  TIME: {
    /** 懒清理间隔时间（秒） */
    LAZY_CLEANUP_S: 1,
    /** 自动释放池过期时间（毫秒） */
    AUTO_RELEASE_MS: 120_000,
    /** 每次点击最短间隔时间（毫秒） */
    CLICK_INTERVAL_MS: 200,
  },
  /** 内置事件 */
  EVENT: {
    /** Qin 框架事件 */
    QIN: {
      APP_BEFORE_LAUNCHED: "qin:app:before-launched",
      APP_AFTER_LAUNCHED: "qin:app:after-launched",
      APP_ARGS_APPLIED: "qin:app:args-applied",
      DEP_BEFORE_INITIALIZED: "qin:dep:before-initialized",
      DEP_AFTER_INITIALIZED: "qin:dep:after-initialized",
    },
    /** 窗口尺寸变化 */
    SCREEN_SIZE_CHANGED: "window-resize" as __private._pal_screen_adapter_enum_type_screen_event__PalScreenEvent,
    /** 全屏状态变化 */
    SCREEN_FULL_CHANGED: "fullscreen-change" as __private._pal_screen_adapter_enum_type_screen_event__PalScreenEvent,
    /** 设备朝向变化 */
    SCREEN_ORIENTATION_CHANGED:
      "orientation-change" as __private._pal_screen_adapter_enum_type_screen_event__PalScreenEvent,
    /** 语种变化 */
    LANGUAGE_CHANGED: "language-change",
    /** 精灵帧变化 */
    SPRITE_FRAME_CHANGED: Sprite.EventType.SPRITE_FRAME_CHANGED,
    /** 精灵帧变化 */
    CLICK: Button.EventType.CLICK,
    /** 滑块滑动事件 */
    SLIDE: "slide",
    /** 节点事件 */
    NODE: Node.EventType,
    /** UI变换组件事件（集合） */
    TRANSFORM: UITransform.EventType,
    /** 输入文本组件事件（集合） */
    EDIT_BOX: EditBox.EventType,
    /** 动画组件事件（集合） */
    ANIMATION: Animation.EventType,
    /** 音频组件事件（集合） */
    AUDIO: AudioSource.EventType,
    /** 输入事件（集合） */
    INPUT: Input.EventType,
    /** 翻页视图组件事件（集合） */
    PAGE: PageView.EventType,
    /** 滚动视图组件事件（集合） */
    SCROLL: ScrollView.EventType,
    /** 网页视图组件事件（集合） */
    WEB: WebView.EventType,
    /** 视频组件事件（集合） */
    VIDEO: VideoPlayer.EventType,
  },
  /** 常用二维点 */
  POINT2D: {
    /** 左下角 */
    LEFT_BOTTOM: new Vec2(0, 0),
    /** 右下角 */
    RIGHT_BOTTOM: new Vec2(1, 0),
    /** 左上角 */
    LEFT_TOP: new Vec2(0, 1),
    /** 右上角 */
    RIGHT_TOP: new Vec2(1, 1),
    /** 中点 */
    CENTER_CENTER: new Vec2(0.5, 0.5),
    /** 左中点 */
    LEFT_CENTER: new Vec2(0, 0.5),
    /** 右中点 */
    RIGHT_CENTER: new Vec2(1, 0.5),
    /** 上中点 */
    TOP_CENTER: new Vec2(0.5, 1),
    /** 下中点 */
    BOTTOM_CENTER: new Vec2(0.5, 0),
  },
  /** 常用三维点 */
  POINT3D: {
    /** 左下角 */
    LEFT_BOTTOM: new Vec3(0, 0),
    /** 右下角 */
    RIGHT_BOTTOM: new Vec3(1, 0),
    /** 左上角 */
    LEFT_TOP: new Vec3(0, 1),
    /** 右上角 */
    RIGHT_TOP: new Vec3(1, 1),
    /** 中点 */
    CENTER_CENTER: new Vec3(0.5, 0.5),
    /** 左中点 */
    LEFT_CENTER: new Vec3(0, 0.5),
    /** 右中点 */
    RIGHT_CENTER: new Vec3(1, 0.5),
    /** 上中点 */
    TOP_CENTER: new Vec3(0.5, 1),
    /** 下中点 */
    BOTTOM_CENTER: new Vec3(0.5, 0),
  },
  /** 常用色码映射 */
  COLOR: {
    /** 浅粉红 */
    LIGHT_PINK: "#FFB6C1",
    /** 粉红 */
    PINK: "#FFC0CB",
    /** 猩红 */
    CRIMSON: "#DC143C",
    /** 脸红的淡紫色 */
    LAVENDER_BLUSH: "#FFF0F5",
    /** 苍白的紫罗兰红色 */
    PALE_VIOLET_RED: "#DB7093",
    /** 热情的粉红 */
    HOT_PINK: "#FF69B4",
    /** 深粉色 */
    DEEP_PINK: "#FF1493",
    /** 适中的紫罗兰红色 */
    MEDIUM_VIOLET_RED: "#C71585",
    /** 兰花的紫色 */
    ORCHID: "#DA70D6",
    /** 蓟 */
    THISTLE: "#D8BFD8",
    /** 李子 */
    PLUM: "#DDA0DD",
    /** 紫罗兰 */
    VIOLET: "#EE82EE",
    /** 洋红 */
    MAGENTA: "#FF00FF",
    /** 灯笼海棠 */
    FUCHSIA: "#FF00FF",
    /** 深洋红色 */
    DARK_MAGENTA: "#8B008B",
    /** 紫色 */
    PURPLE: "#800080",
    /** 适中的兰花紫 */
    MEDIUM_ORCHID: "#BA55D3",
    /** 深紫罗兰色 */
    DARK_VIOLET: "#9400D3",
    /** 深兰花紫 */
    DARK_ORCHID: "#9932CC",
    /** 靛青 */
    INDIGO: "#4B0082",
    /** 深紫罗兰的蓝色 */
    BLUE_VIOLET: "#8A2BE2",
    /** 适中的紫色 */
    MEDIUM_PURPLE: "#9370DB",
    /** 适中的板岩暗蓝灰色 */
    MEDIUM_SLATE_BLUE: "#7B68EE",
    /** 板岩暗蓝灰色 */
    SLATE_BLUE: "#6A5ACD",
    /** 深岩暗蓝灰色 */
    DARK_SLATE_BLUE: "#483D8B",
    /** 熏衣草花的淡紫色 */
    LAVENDER: "#E6E6FA",
    /** 幽灵的白色 */
    GHOST_WHITE: "#F8F8FF",
    /** 纯蓝 */
    BLUE: "#0000FF",
    /** 适中的蓝色 */
    MEDIUM_BLUE: "#0000CD",
    /** 午夜的蓝色 */
    MIDNIGHT_BLUE: "#191970",
    /** 深蓝色 */
    DARK_BLUE: "#00008B",
    /** 海军蓝 */
    NAVY: "#000080",
    /** 皇家蓝 */
    ROYAL_BLUE: "#4169E1",
    /** 矢车菊的蓝色 */
    CORNFLOWER_BLUE: "#6495ED",
    /** 淡钢蓝 */
    LIGHT_STEEL_BLUE: "#B0C4DE",
    /** 浅石板灰 */
    LIGHT_SLATE_GRAY: "#778899",
    /** 石板灰 */
    SLATE_GRAY: "#708090",
    /** 道奇蓝 */
    DODGER_BLUE: "#1E90FF",
    /** 爱丽丝蓝 */
    ALICE_BLUE: "#F0F8FF",
    /** 钢蓝 */
    STEEL_BLUE: "#4682B4",
    /** 淡蓝色 */
    LIGHT_SKY_BLUE: "#87CEFA",
    /** 天蓝色 */
    SKY_BLUE: "#87CEEB",
    /** 深天蓝 */
    DEEP_SKY_BLUE: "#00BFFF",
    /** 淡蓝 */
    LIGHT_B_LUE: "#ADD8E6",
    /** 火药蓝 */
    POW_DER_BLUE: "#B0E0E6",
    /** 军校蓝 */
    CADET_BLUE: "#5F9EA0",
    /** 蔚蓝色 */
    AZURE: "#F0FFFF",
    /** 淡青色 */
    LIGHT_CYAN: "#E1FFFF",
    /** 苍白的绿宝石 */
    PALE_TURQUOISE: "#AFEEEE",
    /** 青色 */
    CYAN: "#00FFFF",
    /** 水绿色 */
    AQUA: "#D4F2E7",
    /** 深绿宝石 */
    DARK_TURQUOISE: "#00CED1",
    /** 深石板灰 */
    DARK_SLATE_GRAY: "#2F4F4F",
    /** 深青色 */
    DARK_CYAN: "#008B8B",
    /** 水鸭色 */
    TEAL: "#008080",
    /** 适中的绿宝石 */
    MEDIUM_TURQUOISE: "#48D1CC",
    /** 浅海洋绿 */
    LIGHT_SEA_GREEN: "#20B2AA",
    /** 绿宝石 */
    TURQUOISE: "#40E0D0",
    /** 绿玉 */
    AQUAMARINE: "#7FFFAA",
    /** 适中的碧绿色 */
    MEDIUM_AQUAMARINE: "#00FA9A",
    /** 适中的春天的绿色 */
    MEDIUM_SPRING_GREEN: "#00FF7F",
    /** 薄荷奶油 */
    MINT_CREAM: "#F5FFFA",
    /** 春天的绿色 */
    SPRING_GREEN: "#3CB371",
    /** 海洋绿 */
    SEA_GREEN: "#2E8B57",
    /** 蜂蜜 */
    HONEYDEW: "#F0FFF0",
    /** 淡绿色 */
    LIGHT_GREEN: "#90EE90",
    /** 苍白的绿色 */
    PALE_GREEN: "#98FB98",
    /** 深海洋绿 */
    DARK_SEA_GREEN: "#8FBC8F",
    /** 酸橙绿 */
    LIME_GREEN: "#32CD32",
    /** 酸橙色 */
    LIME: "#00FF00",
    /** 森林绿 */
    FOREST_GREEN: "#228B22",
    /** 纯绿 */
    GREEN: "#008000",
    /** 深绿色 */
    DARK_GREEN: "#006400",
    /** 查特酒绿 */
    CHARTREUSE: "#7FFF00",
    /** 草坪绿 */
    LAWN_GREEN: "#7CFC00",
    /** 绿黄色 */
    GREEN_YELLOW: "#ADFF2F",
    /** 橄榄土褐色 */
    OLIVE_DRAB: "#556B2F",
    /** 米色 */
    BEIGE: "#F5F5DC",
    /** 浅秋麒麟黄 */
    LIGHT_GOLDENROD_YELLOW: "#FAFAD2",
    /** 象牙 */
    IVORY: "#FFFFF0",
    /** 浅黄色 */
    LIGHT_YELLOW: "#FFFFE0",
    /** 纯黄 */
    YELLOW: "#FFFF00",
    /** 橄榄 */
    OLIVE: "#808000",
    /** 深卡其布 */
    DARK_KHAKI: "#BDB76B",
    /** 柠檬薄纱 */
    LEMON_CHIFFON: "#FFFACD",
    /** 灰秋麒麟 */
    PALE_GOLDENROD: "#EEE8AA",
    /** 卡其布 */
    KHAKI: "#F0E68C",
    /** 金 */
    GOLD: "#FFD700",
    /** 玉米色 */
    CORN_SILK: "#FFF8DC",
    /** 秋麒麟 */
    GOLDENROD: "#DAA520",
    /** 花的白色 */
    FLORAL_WHITE: "#FFFAF0",
    /** 老饰带 */
    OLD_LACE: "#FDF5E6",
    /** 小麦色 */
    WHEAT: "#F5DEB3",
    /** 鹿皮鞋 */
    MOCCASIN: "#FFE4B5",
    /** 橙色 */
    ORANGE: "#FFA500",
    /** 番木瓜 */
    PAPAYA_WHIP: "#FFEFD5",
    /** 漂白的杏仁 */
    BLANCHED_ALMOND: "#FFEBCD",
    /** 纳瓦霍白 */
    NAVAJO_WHITE: "#FFDEAD",
    /** 古代的白色 */
    ANTIQUE_WHITE: "#FAEBD7",
    /** 晒黑 */
    TAN: "#D2B48C",
    /** 结实的树 */
    BURLY_WOOD: "#DEB887",
    /** 浓汤 */
    BISQUE: "#FFE4C4",
    /** 深橙色 */
    DARK_ORANGE: "#FF8C00",
    /** 亚麻布 */
    LINEN: "#FAF0E6",
    /** 秘鲁 */
    PERU: "#CD853F",
    /** 桃色 */
    PEACH_PUFF: "#FFDAB9",
    /** 沙棕色 */
    SANDY_BROWN: "#F4A460",
    /** 巧克力 */
    CHOCOLATE: "#D2691E",
    /** 马鞍棕色 */
    SADDLE_BROWN: "#8B4513",
    /** 海贝壳 */
    SEA_SHELL: "#FFF5EE",
    /** 黄土赭色 */
    SIENNA: "#A0522D",
    /** 浅鲜肉 */
    LIGHT_SALMON: "#FFA07A",
    /** 珊瑚 */
    CORAL: "#FF7F50",
    /** 橙红色 */
    ORANGE_RED: "#FF4500",
    /** 深鲜肉 */
    DARK_SALMON: "#E9967A",
    /** 番茄 */
    TOMATO: "#FF6347",
    /** 薄雾玫瑰 */
    MISTY_ROSE: "#FFE4E1",
    /** 鲜肉 */
    SALMON: "#FA8072",
    /** 雪 */
    SNOW: "#FFFAFA",
    /** 淡珊瑚色 */
    LIGHT_CORAL: "#F08080",
    /** 玫瑰棕色 */
    ROSY_BROWN: "#BC8F8F",
    /** 印度红 */
    INDIAN_RED: "#CD5C5C",
    /** 纯红 */
    RED: "#FF0000",
    /** 棕色 */
    BROWN: "#A52A2A",
    /** 耐火砖 */
    FIRE_BRICK: "#B22222",
    /** 深红色 */
    DARK_RED: "#8B0000",
    /** 栗色 */
    MAROON: "#800000",
    /** 纯白 */
    WHITE: "#FFFFFF",
    /** 白烟 */
    WHITE_SMOKE: "#F5F5F5",
    /** 亮灰色 */
    GAINSBORO: "#DCDCDC",
    /** 浅灰色 */
    LIGHT_GREY: "#D3D3D3",
    /** 银白色 */
    SILVER: "#C0C0C0",
    /** 深灰色 */
    DARK_GRAY: "#A9A9A9",
    /** 灰色 */
    GRAY: "#808080",
    /** 暗淡的灰色 */
    DIM_GRAY: "#696969",
    /** 纯黑 */
    BLACK: "#000000",
  },
} as const;
