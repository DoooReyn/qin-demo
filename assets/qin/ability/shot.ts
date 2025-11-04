import {
  Node,
  Camera,
  view,
  RenderTexture,
  director,
  SpriteFrame,
  ImageAsset,
  Texture2D,
  Canvas,
} from "cc";
import { platform } from "./platform";
import { IAbility } from "./ability";

/** 截图数据 */
export interface ScreenShot {
  buffer: Uint8Array<ArrayBuffer>;
  w: number;
  h: number;
}

/**
 * 截图能力接口
 * @description 提供截图能力
 */
export interface IShot extends IAbility {
  /**
   * 截图
   * @param options 选项
   * @param options.x 截图的x坐标
   * @param options.y 截图的y坐标
   * @param options.width 截图的宽度
   * @param options.height 截图的高度
   * @param options.camera 截图用的相机
   * @returns
   */
  capture(options: {
    camera: Camera;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
  }): Promise<ScreenShot>;
  /**
   * 截取目标节点 (像素数据)
   * @param targetNode 目标节点
   * @param camera 相机
   * @returns
   */
  captureNodeBuffer(targetNode: Node, camera?: Camera): Promise<ScreenShot>;
  /**
   * 截取目标节点 (SpriteFrame)
   * @param targetNode 目标节点
   * @param camera 相机
   * @returns
   */
  captureNode(targetNode: Node, camera?: Camera): Promise<SpriteFrame>;
  /**
   * 截屏 (像素数据)
   */
  captureScreenBuffer(): Promise<ScreenShot>;
  /**
   * 截屏 (SpriteFrame)
   */
  captureScreen(): Promise<SpriteFrame>;
  /**
   * 从像素数据创建图像
   * @param buffer 图片像素数据
   * @param width 图片宽度
   * @param height 图片高度
   * @returns
   */
  createSpriteFrameFromBuffer(
    buffer: Uint8Array,
    width: number,
    height: number
  ): SpriteFrame;
  /**
   * 绕 X 轴翻转图片
   * @param data 图片像素数据
   * @param width 图片宽度
   * @param height 图片高度
   */
  flipImageX(
    data: Uint8Array,
    width: number,
    height: number
  ): Uint8Array<ArrayBuffer>;
  /**
   * 绕 Y 轴翻转图片
   * @param data 图片像素数据
   * @param width 图片宽度
   * @param height 图片高度
   */
  flipImageY(
    data: Uint8Array,
    width: number,
    height: number
  ): Uint8Array<ArrayBuffer>;
  /**
   * 保存截图
   * @warn 仅适用于 Web 平台
   * @param options 选项
   * @param options.filename 文件名称
   * @param options.quality 质量
   * @returns
   */
  captureToWeb(options: { filename?: string; quality?: number }): Promise<void>;
}

/**
 * 截图能力实现
 */
export const shot: IShot = {
  name: "Shot",
  description: "截图工具",
  async capture(options: {
    camera: Camera;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
  }): Promise<ScreenShot> {
    return new Promise<ScreenShot>((resolve) => {
      const { width, height } = view.getVisibleSize();
      const x = options.x ?? 0;
      const y = options.y ?? 0;
      const w = options.w ?? width;
      const h = options.h ?? height;
      const camera = options.camera;
      const originalTexture = camera.targetTexture;
      let rt = new RenderTexture();
      rt.initialize({ width, height });
      camera.targetTexture = rt;
      director.root?.frameMove(0);
      camera.targetTexture = originalTexture;
      let raw = rt.readPixels(x, y, w, h)!;
      let buffer = shot.flipImageX(raw, w, h);
      rt.destroy();
      resolve({ buffer, w, h });
    });
  },
  async captureNodeBuffer(
    targetNode: Node,
    camera?: Camera
  ): Promise<ScreenShot> {
    const nb = targetNode._uiProps.uiTransformComp.getBoundingBoxToWorld();
    const { x, y, width: w, height: h } = nb;
    return shot.capture({ x, y, w, h, camera });
  },
  async captureNode(targetNode: Node, camera?: Camera): Promise<SpriteFrame> {
    return new Promise<SpriteFrame>(async (resolve) => {
      let { buffer, w, h } = await shot.captureNodeBuffer(targetNode, camera);
      const spf = shot.createSpriteFrameFromBuffer(buffer, w, h);
      resolve(spf);
    });
  },
  async captureScreenBuffer(): Promise<ScreenShot> {
    const node = director.getScene().getComponentInChildren(Canvas).node;
    return shot.captureNodeBuffer(node);
  },
  async captureScreen(): Promise<SpriteFrame> {
    const node = director.getScene().getComponentInChildren(Canvas).node;
    return shot.captureNode(node);
  },
  createSpriteFrameFromBuffer(
    buffer: Uint8Array,
    width: number,
    height: number
  ): SpriteFrame {
    let img = new ImageAsset();
    img.reset({
      _data: buffer,
      width: width,
      height: height,
      format: Texture2D.PixelFormat.RGBA8888,
      _compressed: false,
    });
    const texture = new Texture2D();
    texture.image = img;
    texture.setWrapMode(
      Texture2D.WrapMode.CLAMP_TO_EDGE,
      Texture2D.WrapMode.CLAMP_TO_EDGE
    );
    const spf = new SpriteFrame();
    spf.texture = texture;
    spf.packable = false;
    return spf;
  },
  flipImageX(
    data: Uint8Array,
    width: number,
    height: number
  ): Uint8Array<ArrayBuffer> {
    let newData = new Uint8Array(data.length);
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        let index = (width * i + j) * 4;
        let newIndex = (width * (height - i - 1) + j) * 4;
        newData[newIndex] = data[index];
        newData[newIndex + 1] = data[index + 1];
        newData[newIndex + 2] = data[index + 2];
        newData[newIndex + 3] = data[index + 3];
      }
    }
    return newData;
  },
  flipImageY(
    data: Uint8Array,
    width: number,
    height: number
  ): Uint8Array<ArrayBuffer> {
    let newData = new Uint8Array(data.length);
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        let newIndex = (width * i + j) * 4;
        let index = (width - j + i * width) * 4;
        newData[newIndex] = data[index];
        newData[newIndex + 1] = data[index + 1];
        newData[newIndex + 2] = data[index + 2];
        newData[newIndex + 3] = data[index + 3];
      }
    }
    return newData;
  },
  async captureToWeb(options: {
    filename?: string;
    quality?: number;
  }): Promise<void> {
    if (!platform.browser) return;

    options ??= {};
    options.filename ??= `screenshot_${Date.now()}.png`;
    options.quality ??= 80;

    let { buffer, w, h } = await shot.captureScreenBuffer();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = w;
    canvas.height = h;
    const img = ctx.createImageData(w, h);
    for (let i = 0; i < buffer.length; i++) {
      img.data[i] = buffer[i];
    }
    ctx.putImageData(img, 0, 0);
    canvas.toBlob(
      (blob) => {
        let url = URL.createObjectURL(blob!);
        let link = document.createElement("a");
        link.href = url;
        link.download = options.filename!;
        link.style.display = "none";
        link.click();
        URL.revokeObjectURL(url);
        link.click();
      },
      "image/png",
      options.quality
    );
  },
};
