import {
  js,
  sp,
  v3,
  __private,
  AudioSource,
  Button,
  Camera,
  Canvas,
  Color,
  EditBox,
  Graphics,
  Label,
  Layout,
  Mask,
  Node,
  PageView,
  ProgressBar,
  RichText,
  ScrollView,
  Size,
  Slider,
  Sprite,
  TiledMap,
  Toggle,
  UIOpacity,
  UIRenderer,
  UITransform,
  Vec2,
  VideoPlayer,
  WebView,
  Widget,
} from "cc";
import { EDITOR_NOT_IN_PREVIEW } from "cc/env";

// ========= 扩展 cc 提示声明 =========

/** 扩展节点属性 */
declare module "cc" {
  interface Node {
    uiGraphics: Graphics;
    uiLabel: Label;
    uiRichText: RichText;
    uiSprite: Sprite;
    uiButton: Button;
    uiCanvas: Canvas;
    uiEditBox: EditBox;
    uiLayout: Layout;
    uiPageView: PageView;
    uiProgressBar: ProgressBar;
    uiScrollView: ScrollView;
    uiSlider: Slider;
    uiToggle: Toggle;
    uiWidget: Widget;
    uiOpacity: UIOpacity;
    uiTransform: UITransform;
    uiMask: Mask;
    uiSpine: sp.Skeleton;
    uiCamera: Camera;
    uiVideoPlayer: VideoPlayer;
    uiTiledMap: TiledMap;
    uiWebView: WebView;
    uiAudio: AudioSource;

    /** 获取、设置节点的本地X坐标 */
    x: number;
    /** 获取、设置节点的本地Y坐标 */
    y: number;
    /** 获取、设置节点的本地Z坐标 */
    z: number;
    /** 获取节点的本地X,Y坐标 */
    xy: [number, number];
    /** 获取节点的本地X,Y,Z坐标 */
    xyz: [number, number, number];
    /** 获取、设置节点的世界X坐标 */
    wx: number;
    /** 获取、设置节点的世界Y坐标 */
    wy: number;
    /** 获取、设置节点的世界Z坐标 */
    wz: number;
    /** 获取、设置节点宽 */
    w: number;
    /** 获取、设置节点高 */
    h: number;
    /** 获取、设置节点尺寸 */
    size: Size;
    /** 获取、设置锚点 */
    pivot: Vec2;
    /** 获取、设置X轴锚点 */
    pivotX: number;
    /** 获取、设置Y轴锚点 */
    pivotY: number;
    /** 获取、设置节点透明度  */
    opacity: number;
    /** 获取、设置节点颜色  */
    color: Color;
    /** 获取、设置X轴缩放 */
    scaleX: number;
    /** 获取、设置Y轴缩放 */
    scaleY: number;
    /** 获取、设置Z轴缩放 */
    scaleZ: number;
    /** 获取、设置节点的 X 欧拉角 */
    angleX: number;
    /** 获取、设置节点的 Y 欧拉角 */
    angleY: number;
    /** 获取、设置节点的 Z 欧拉角 */
    angleZ: number;
    /** 设置节点尺寸 */
    setSize(w: number, h: number): void;
    /** 设置锚点 */
    setPivot(x: number, y: number): void;
    /** 设置缩放 */
    setZoom(x: number, y?: number, z?: number): void;
    /** 查找子节点 */
    find(path: string): Node | null;
    /** 获取组件 */
    acquire<T extends Component>(
      type: __private.__types_globals__Constructor<T>
    ): T | null;
    /** 查询组件 */
    seek<T extends Component>(
      type: __private.__types_globals__Constructor<T>
    ): T | null;
    /** 查询组件 */
    deepSeek<T extends Component>(
      type: __private.__types_globals__Constructor<T>
    ): T | null;
    /** 获取同组组件 */
    listed<T extends Component>(
      type: __private.__types_globals__Constructor<T>,
      recursive: boolean
    ): T[];
    /** 获取节点的完整路径 */
    pathOf(): string;
  }
}

if (!EDITOR_NOT_IN_PREVIEW) {
  // Create the mixin object with all Node extensions
  js.mixin(Node.prototype, {
    // UI Component getters - read-only properties
    get uiGraphics() {
      return this.getComponent(Graphics);
    },
    get uiLabel() {
      return this.getComponent(Label);
    },
    get uiRichText() {
      return this.getComponent(RichText);
    },
    get uiSprite() {
      return this.getComponent(Sprite);
    },
    get uiButton() {
      return this.getComponent(Button);
    },
    get uiCanvas() {
      return this.getComponent(Canvas);
    },
    get uiEditBox() {
      return this.getComponent(EditBox);
    },
    get uiLayout() {
      return this.getComponent(Layout);
    },
    get uiPageView() {
      return this.getComponent(PageView);
    },
    get uiProgressBar() {
      return this.getComponent(ProgressBar);
    },
    get uiScrollView() {
      return this.getComponent(ScrollView);
    },
    get uiSlider() {
      return this.getComponent(Slider);
    },
    get uiToggle() {
      return this.getComponent(Toggle);
    },
    get uiWidget() {
      return this.getComponent(Widget);
    },
    get uiOpacity() {
      return this.getComponent(UIOpacity);
    },
    get uiTransform() {
      return this.getComponent(UITransform);
    },
    get uiMask() {
      return this.getComponent(Mask);
    },
    get uiAudio() {
      return this.getComponent(AudioSource);
    },
    get uiSpine() {
      return this.getComponent(sp.Skeleton);
    },
    get uiCamera() {
      return this.getComponent(Camera);
    },
    get uiTiledMap() {
      return this.getComponent(TiledMap);
    },
    get uiWebView() {
      return this.getComponent(WebView);
    },
    get uiVideoPlayer() {
      return this.getComponent(VideoPlayer);
    },

    // Position properties
    /** 获取、设置节点的 X 坐标 */
    get x() {
      return this.position.x;
    },
    set x(value: number) {
      this.setPosition(value, this.position.y, this.position.z);
    },

    /** 获取、设置节点的 Y 坐标 */
    get y() {
      return this.position.y;
    },
    set y(value: number) {
      this.setPosition(this.position.x, value, this.position.z);
    },

    /** 获取、设置节点的 Z 坐标 */
    get z() {
      return this.position.z;
    },
    set z(value: number) {
      this.setPosition(this.position.x, this.position.y, value);
    },

    /** 获取节点的 X,Y 坐标 */
    get xy() {
      return [this.x, this.y];
    },

    /** 获取节点的 X,Y,Z 坐标 */
    get xyz() {
      return [this.x, this.y, this.z];
    },

    /** 获取、设置节点的世界 X 坐标 */
    get wx() {
      return this.worldPosition.x;
    },
    set wx(value: number) {
      this.setWorldPosition(value, this.worldPosition.y, this.worldPosition.z);
    },

    /** 获取、设置节点的世界 Y 坐标 */
    get wy() {
      return this.worldPosition.y;
    },
    set wy(value: number) {
      this.setWorldPosition(this.worldPosition.x, value, this.worldPosition.z);
    },

    /** 获取、设置节点的世界 Z 坐标 */
    get wz() {
      return this.worldPosition.z;
    },
    set wz(value: number) {
      this.setWorldPosition(this.worldPosition.x, this.worldPosition.y, value);
    },

    // Size properties
    /** 获取、设置节点宽 */
    get w() {
      return this.getComponent(UITransform)?.width ?? 0;
    },
    set w(value: number) {
      (this.getComponent(UITransform) || this.addComponent(UITransform)).width =
        value;
    },

    /** 获取、设置节点高 */
    get h() {
      return this.getComponent(UITransform)?.height ?? 0;
    },
    set h(value: number) {
      (
        this.getComponent(UITransform) || this.addComponent(UITransform)
      ).height = value;
    },

    /** 获取、设置节点尺寸 */
    get size() {
      let uiTransform = this.getComponent(UITransform)!;
      return new Size(uiTransform.width, uiTransform.height);
    },
    set size(value: Size) {
      let uiTransform =
        this.getComponent(UITransform) || this.addComponent(UITransform);
      uiTransform.width = value.width;
      uiTransform.height = value.height;
    },

    // Visual properties
    /** 获取、设置节点透明度 */
    get opacity() {
      let op = this.getComponent(UIOpacity);
      if (op != null) {
        return op.opacity;
      }
      let render = this.getComponent(UIRenderer);
      if (render) {
        return render.color.a;
      }
      return 255;
    },
    set opacity(value: number) {
      let op = this.getComponent(UIOpacity);
      if (op != null) {
        op.opacity = value;
        return;
      }
      let render = this.getComponent(UIRenderer);
      if (render) {
        if (!this.$__color__) {
          this.$__color__ = new Color(
            render.color.r,
            render.color.g,
            render.color.b,
            value
          );
        } else {
          this.$__color__.a = value;
        }
        render.color = this.$__color__;
      } else {
        this.addComponent(UIOpacity).opacity = value;
      }
    },

    /** 获取、设置节点颜色 */
    get color() {
      return this.getComponent(UIRenderer)?.color;
    },
    set color(value: Color) {
      let render = this.getComponent(UIRenderer);
      render && (render.color = value);
    },

    // Scale properties
    /** 获取、设置节点的 X 缩放系数 */
    get scaleX() {
      return this.scale.x;
    },
    set scaleX(value: number) {
      this.scale = v3(value, this.scale.y, this.scale.z);
    },

    /** 获取、设置节点的 Y 缩放系数 */
    get scaleY() {
      return this.scale.y;
    },
    set scaleY(value: number) {
      this.scale = v3(this.scale.x, value, this.scale.z);
    },

    /** 获取、设置节点的 Z 缩放系数 */
    get scaleZ() {
      return this.scale.z;
    },
    set scaleZ(value: number) {
      this.scale = v3(this.scale.x, this.scale.y, value);
    },

    // Pivot properties
    /** 获取、设置锚点 */
    get pivot() {
      let anchor = this.getComponent(UITransform)!.anchorPoint;
      return new Vec2(anchor.x, anchor.y);
    },
    set pivot(value: Vec2) {
      (
        this.getComponent(UITransform) || this.addComponent(UITransform)
      ).anchorPoint = value;
    },

    /** 获取、设置 X轴锚点 */
    get pivotX() {
      return this.getComponent(UITransform)?.anchorX ?? 0.5;
    },
    set pivotX(value: number) {
      (
        this.getComponent(UITransform) || this.addComponent(UITransform)
      ).anchorX = value;
    },

    /** 获取、设置 Y轴锚点 */
    get pivotY() {
      return this.getComponent(UITransform)?.anchorY ?? 0.5;
    },
    set pivotY(value: number) {
      (
        this.getComponent(UITransform) || this.addComponent(UITransform)
      ).anchorY = value;
    },

    // Angle properties
    /** 获取、设置节点的 X 欧拉角 */
    get angleX() {
      return this.eulerAngles.x;
    },
    set angleX(value: number) {
      this.setRotationFromEuler(value, this.eulerAngles.y, this.eulerAngles.z);
    },

    /** 获取、设置节点的 Y 欧拉角 */
    get angleY() {
      return this.eulerAngles.y;
    },
    set angleY(value: number) {
      this.setRotationFromEuler(this.eulerAngles.x, value, this.eulerAngles.z);
    },

    /** 获取、设置节点的 Z 欧拉角 */
    get angleZ() {
      return this.eulerAngles.z;
    },
    set angleZ(value: number) {
      this.setRotationFromEuler(this.eulerAngles.x, this.eulerAngles.y, value);
    },

    // Utility methods
    /**
     * 设置节点的尺寸
     * @param width 宽度
     * @param height 高度
     */
    setSize(width: number, height: number) {
      let uiTransform =
        this.getComponent(UITransform) || this.addComponent(UITransform);
      uiTransform.width = width;
      uiTransform.height = height;
    },

    /**
     * 设置节点的锚点
     * @param x X轴锚点
     * @param y Y轴锚点
     */
    setPivot(x: number, y: number) {
      let uiTransform =
        this.getComponent(UITransform) || this.addComponent(UITransform);
      uiTransform.setAnchorPoint(x, y);
    },

    /**
     * 设置节点的缩放
     * @param x X轴缩放
     * @param y Y轴缩放
     * @param z Z轴缩放
     */
    setZoom(x: number, y?: number, z?: number) {
      let xx = x ?? this.scale.x;
      let yy = y ?? this.scale.y;
      let zz = z ?? this.scale.z;
      this.setScale(xx, yy, zz);
    },

    /**
     * 查找子节点，返回子节点
     * @param path 子节点路径
     */
    find(path: string) {
      return this.getChildByPath(path);
    },

    /**
     * 获取组件
     * @param type 组件类型
     */
    acquire(type: any) {
      return this.getComponent(type) || this.addComponent(type);
    },

    /**
     * 查询组件
     * @param type 组件类型
     */
    seek(type: any) {
      return this.getComponent(type);
    },

    /**
     * 查询组件
     * @param type 组件类型
     */
    deepSeek(type: any) {
      return this.getComponent(type) || this.getComponentInChildren(type);
    },

    /**
     * 获取同组组件
     * @param type 组件类型
     * @param recursive 是否递归查找
     */
    listed(type: any, recursive: boolean = false) {
      let list = this.getComponents(type);
      if (recursive) {
        list = list.concat(...this.getComponentsInChildren(type));
      }
      return list as any[];
    },

    /**
     * 获取节点的完整路径
     * @returns
     */
    pathOf() {
      let node = this;
      const path: string[] = [];
      while (node.parent) {
        path.unshift(node.name);
        node = node.parent;
      }
      return path.join("/");
    },
  });
}
