import {
  __private,
  Animation,
  AudioSource,
  Button,
  EditBox,
  Input,
  Node,
  PageView,
  ScrollView,
  Sprite,
  UITransform,
  Vec2,
  Vec3,
  VideoPlayer,
  WebView,
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
  /** 存储键 */
  STORE: {
    LANG: "lang",
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
  /** UI 相关配置 */
  UI: {
    /** Page LRU 缓存容量 */
    PAGE_CACHE_CAPACITY: 3,
    /** Popup LRU 缓存容量 */
    POPUP_CACHE_CAPACITY: 5,
    /** Toast 对应的 UIConfig.key */
    TOAST_CONFIG_KEY: "ui-toast",
  },
  /** 内置事件 */
  EVENT: {
    // ----------------------- APP Tier -----------------------
    /** 应用即将启动 */
    APP_BEFORE_LAUNCHED: "app:before-launched",
    /** 应用已启动 */
    APP_AFTER_LAUNCHED: "app:after-launched",
    /** 应用参数已应用 */
    APP_ARGS_APPLIED: "app:args-applied",
    /** 依赖即将挂载 */
    APP_DEP_BEFORE_MOUNTED: "app:dep-before-mounted",
    /** 依赖已挂载 */
    APP_DEP_AFTER_MOUNTED: "app:dep-after-mounted",
    /** 应用进入前台 */
    APP_ENTER_FOREGROUND: "app:enter-foreground",
    /** 应用进入后台 */
    APP_ENTER_BACKGROUND: "app:enter-background",
    /** UI 根节点已创建 */
    APP_UI_ROOT_ENSURED: "app:ui-root-ensured",
    /** 应用内存不足 */
    APP_LOW_MEMORY: "app:low-memory",
    /** 应用窗口尺寸变化 */
    APP_SCREEN_SIZE_CHANGED: "window-resize" as __private._pal_screen_adapter_enum_type_screen_event__PalScreenEvent,
    /** 应用全屏状态变化 */
    APP_SCREEN_FULL_CHANGED:
      "fullscreen-change" as __private._pal_screen_adapter_enum_type_screen_event__PalScreenEvent,
    /** 应用设备朝向变化 */
    APP_SCREEN_ORIENTATION_CHANGED:
      "orientation-change" as __private._pal_screen_adapter_enum_type_screen_event__PalScreenEvent,
    /** 应用语种变化 */
    APP_LANGUAGE_CHANGED: "app:language-changed",
    /** 应用屏幕点击 */
    APP_SCREEN_TAPPED: "app:screen-tapped",
    // ----------------------- GUI Tier -----------------------
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
    /** 粉红 */
    PINK: "#FFC0CB",
    /** 浅粉红 */
    LIGHT_PINK: "#FFB6C1",
    /** 深粉红 */
    DEEP_PINK: "#FF1493",
    /** 紫罗兰 */
    VIOLET: "#EE82EE",
    /** 深紫罗兰色 */
    DARK_VIOLET: "#9400D3",
    /** 深紫罗兰的蓝色 */
    BLUE_VIOLET: "#8A2BE2",
    /** 紫色 */
    PURPLE: "#800080",
    /** 适中的紫色 */
    MEDIUM_PURPLE: "#9370DB",
    /** 纯蓝 */
    BLUE: "#0000FF",
    /** 适中的蓝色 */
    MEDIUM_BLUE: "#0000CD",
    /** 深蓝色 */
    DARK_BLUE: "#00008B",
    /** 海军蓝 */
    NAVY_BLUE: "#000080",
    /** 淡蓝色 */
    LIGHT_SKY_BLUE: "#87CEFA",
    /** 天蓝色 */
    SKY_BLUE: "#87CEEB",
    /** 深天蓝 */
    DEEP_SKY_BLUE: "#00BFFF",
    /** 淡蓝 */
    LIGHT_BLUE: "#ADD8E6",
    /** 青色 */
    CYAN: "#00FFFF",
    /** 淡青色 */
    LIGHT_CYAN: "#E1FFFF",
    /** 深青色 */
    DARK_CYAN: "#008B8B",
    /** 纯绿 */
    GREEN: "#008000",
    /** 水绿色 */
    AQUA: "#D4F2E7",
    /** 酸橙色 */
    LIME: "#00FF00",
    /** 春天的绿色 */
    SPRING_GREEN: "#3CB371",
    /** 适中的春天的绿色 */
    MEDIUM_SPRING_GREEN: "#00FF7F",
    /** 淡绿色 */
    LIGHT_GREEN: "#90EE90",
    /** 酸橙绿 */
    LIME_GREEN: "#32CD32",
    /** 森林绿 */
    FOREST_GREEN: "#228B22",
    /** 深绿色 */
    DARK_GREEN: "#006400",
    /** 草坪绿 */
    LAWN_GREEN: "#7CFC00",
    /** 绿黄色 */
    GREEN_YELLOW: "#ADFF2F",
    /** 纯黄 */
    YELLOW: "#FFFF00",
    /** 浅黄色 */
    LIGHT_YELLOW: "#FFFFE0",
    /** 深卡其色 */
    DARK_KHAKI: "#BDB76B",
    /** 卡其色 */
    KHAKI: "#F0E68C",
    /** 金 */
    GOLD: "#FFD700",
    /** 橙色 */
    ORANGE: "#FFA500",
    /** 深橙色 */
    DARK_ORANGE: "#FF8C00",
    /** 橙红色 */
    ORANGE_RED: "#FF4500",
    /** 番茄 */
    TOMATO: "#FF6347",
    /** 鲜肉 */
    SALMON: "#FA8072",
    /** 纯红 */
    RED: "#FF0000",
    /** 印度红 */
    INDIAN_RED: "#CD5C5C",
    /** 深红色 */
    DARK_RED: "#8B0000",
    /** 栗色 */
    MAROON: "#800000",
    /** 棕色 */
    BROWN: "#654321",
    /** 巧克力 */
    CHOCOLATE: "#D2691E",
    /** 纯白 */
    WHITE: "#FFFFFF",
    /** 雪 */
    SNOW: "#FFFAFA",
    /** 幽灵的白色 */
    GHOST_WHITE: "#F8F8FF",
    /** 花的白色 */
    FLORAL_WHITE: "#FFFAF0",
    /** 米色 */
    BEIGE: "#F5F5DC",
    /** 象牙 */
    IVORY: "#FFFFF0",
    /** 白烟 */
    WHITE_SMOKE: "#F5F5F5",
    /** 银白色 */
    SILVER: "#C0C0C0",
    /** 灰色 */
    GRAY: "#808080",
    /** 浅灰色 */
    LIGHT_GRAY: "#D3D3D3",
    /** 深灰色 */
    DARK_GRAY: "#A9A9A9",
    /** 暗淡的灰色 */
    DIM_GRAY: "#696969",
    /** 纯黑 */
    BLACK: "#000000",
    /** 木炭黑 */
    CHARCOAL_BLACK: "#36454F",
    /** 墨黑色 */
    INK_BLACK: "#343434",
    /** 黑色，半透明 */
    BLACK_50: "#00000080",
    /** 黑色，四分之一透明 */
    BLACK_25: "#00000040",
  },
} as const;
