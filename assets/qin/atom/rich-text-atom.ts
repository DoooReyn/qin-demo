import { Color, Enum, EventTouch, Node, Sprite, SpriteFrame, TTFFont, UITransform, Vec2, _decorator } from "cc";

import { grapheme, mock } from "../ability";
import { Atom } from "./atom";
import { Triggers } from "../foundation";
import ioc from "../ioc";

const { property } = _decorator;

/**
 * 水平对齐方式
 */
enum HorizontalAlign {
  LEFT,
  CENTER,
  RIGHT,
}

/**
 * 垂直对齐方式
 */
enum VerticalAlign {
  TOP,
  MIDDLE,
  BOTTOM,
}

/**
 * 富文本样式
 */
export interface IRichTextStyle {
  fontFamily: string;
  fontSize: number;
  color: Color;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strokeColor: Color | null;
  strokeWidth: number;
  shadowColor: Color | null;
  shadowOffset: Vec2;
  shadowBlur: number;
  linkId: string | null;
}

/**
 * 富文本字符信息
 */
interface IRichGlyph {
  ch: string;
  style: IRichTextStyle;
}

/**
 * 布局后的 glyph
 */
interface ILaidOutGlyph extends IRichGlyph {
  x: number;
  y: number;
  glyphKey: string;
}

/**
 * 富文本组件（低 DC 版本）
 */
@mock.decorator.ccclass("RichTextAtom")
export class RichTextAtom extends Atom {
  @property({ multiline: true })
  public text: string = "";

  @property
  public maxWidth: number = 0;

  @property
  public lineHeight: number = 30;

  @property
  public atlasKey: string = "richtext-default";

  @property(TTFFont)
  public ttfFont: TTFFont | null = null;

  @property
  public fontFamily: string = "sans-serif";

  @property
  public letterSpacing: number = 0;

  @property({ type: Enum(HorizontalAlign) })
  public horizontalAlign: HorizontalAlign = HorizontalAlign.LEFT;

  @property({ type: Enum(VerticalAlign) })
  public verticalAlign: VerticalAlign = VerticalAlign.TOP;

  private __glyphNodes: Node[] = [];

  public readonly onLinkClick: Triggers = new Triggers();

  protected _doStart(): void {
    ioc.richTextAtlas.addRef(this.atlasKey);
    super._doStart();
    this.__updateView();
  }

  protected _doActivate(): void {
    this.node.on(Node.EventType.TOUCH_END, this.__onTouchEnded, this);
    super._doActivate();
  }

  protected _doDeactivate(): void {
    this.node.off(Node.EventType.TOUCH_END, this.__onTouchEnded, this);
    this.__clearNodes();
    super._doDeactivate();
  }

  protected _doEnd(): void {
    this.__clearNodes();
    this.onLinkClick.clear();
    ioc.richTextAtlas.decRef(this.atlasKey);
    super._doEnd();
  }

  /**
   * 设置文本并刷新
   */
  public setString(str: string): void {
    if (this.text === str) {
      return;
    }
    this.text = str;
    this.__updateView();
  }

  /**
   * 刷新显示
   */
  private __updateView(): void {
    this.__clearNodes();
    if (!this.node || !this.node.isValid) {
      return;
    }

    if (this.text.length == 0) {
      return;
    }

    const glyphs = this.__parseText(this.text);
    const laidOut = this.__layoutGlyphs(glyphs);

    for (const g of laidOut) {
      const glyphKey = g.glyphKey;
      const frame: SpriteFrame | null = ioc.richTextAtlas.acquireGlyph(this.atlasKey, glyphKey, g.ch, g.style);
      if (!frame) {
        continue;
      }

      const n = new Node("glyph");
      const ui = n.addComponent(UITransform);
      const sp = n.addComponent(Sprite);
      sp.spriteFrame = frame;
      ui.setContentSize(frame.rect.width, frame.rect.height);
      ui.setAnchorPoint(0, 0);
      n.setPosition(g.x, g.y);
      n.parent = this.node;
      (n as Node & { __richStyle?: IRichTextStyle }).__richStyle = g.style;
      this.__glyphNodes.push(n);
    }
  }

  private __clearNodes(): void {
    for (const n of this.__glyphNodes) {
      if (n && n.isValid) {
        n.destroy();
      }
    }
    this.__glyphNodes.length = 0;
  }

  private __onTouchEnded(event: EventTouch): void {
    if (!this.__glyphNodes.length) {
      return;
    }

    const pos = event.getLocation();

    for (const n of this.__glyphNodes) {
      if (!n || !n.isValid) {
        continue;
      }

      const ui = n.getComponent(UITransform);
      if (!ui) {
        continue;
      }

      const style = (n as Node & { __richStyle?: IRichTextStyle }).__richStyle;
      if (style && style.linkId && ui.hitTest(pos)) {
        ioc.logcat.qin.i("Link clicked: " + style.linkId);
        this.onLinkClick.runWith(style.linkId);
        break;
      }
    }
  }

  /**
   * 解析富文本标记为 glyph 列表
   * 支持标签：
   * [color=#rrggbb] [/color]
   * [size=20] [/size]
   * [i] [/i]
   * [u] [/u]
   * [stroke=#rrggbb,width] [/stroke]
   * [shadow=#rrggbb,offx,offy,blur] [/shadow]
   */
  private __parseText(text: string): IRichGlyph[] {
    const result: IRichGlyph[] = [];

    const defaultStyle: IRichTextStyle = {
      fontSize: 24,
      fontFamily: this.__getFontFamily(),
      color: new Color(255, 255, 255, 255),
      bold: false,
      italic: false,
      underline: false,
      strokeColor: null,
      strokeWidth: 0,
      shadowColor: null,
      shadowOffset: new Vec2(0, 0),
      shadowBlur: 0,
      linkId: null,
    };

    const styleStack: IRichTextStyle[] = [defaultStyle];
    const units = grapheme.parse(text);
    let i = 0;

    while (i < units.length) {
      const unit = units[i];

      // 处理转义换行："\n" / "\r"
      if (unit === "\\" && i + 1 < units.length) {
        const nextUnit = units[i + 1];
        if (nextUnit === "n") {
          const topStyle = styleStack[styleStack.length - 1];
          result.push({ ch: "\n", style: topStyle });
          i += 2;
          continue;
        } else if (nextUnit === "r") {
          const topStyle = styleStack[styleStack.length - 1];
          result.push({ ch: "\r", style: topStyle });
          i += 2;
          continue;
        }
      }

      // 标签解析，以 "[" 开头，直到下一个 "]" 为止
      if (unit === "[") {
        let closeIndex = -1;
        for (let j = i + 1; j < units.length; j++) {
          if (units[j] === "]") {
            closeIndex = j;
            break;
          }
        }

        if (closeIndex > i) {
          const tagContent = units
            .slice(i + 1, closeIndex)
            .join("")
            .trim();
          if (tagContent.length > 0) {
            const isEnd = tagContent[0] === "/";
            if (isEnd) {
              const name = tagContent.substring(1).toLowerCase();
              if (
                name === "color" ||
                name === "size" ||
                name === "i" ||
                name === "italic" ||
                name === "u" ||
                name === "underline" ||
                name === "stroke" ||
                name === "outline" ||
                name === "shadow" ||
                name === "link"
              ) {
                if (styleStack.length > 1) {
                  styleStack.pop();
                }
              }
            } else {
              const eqIdx = tagContent.indexOf("=");
              const name = (eqIdx >= 0 ? tagContent.substring(0, eqIdx) : tagContent).toLowerCase();
              const param = eqIdx >= 0 ? tagContent.substring(eqIdx + 1) : "";
              const top = styleStack[styleStack.length - 1];
              const next: IRichTextStyle = { ...top, shadowOffset: top.shadowOffset.clone() };

              if (name === "color") {
                const c = this.__parseColor(param);
                if (c) {
                  next.color = c;
                }
                styleStack.push(next);
              } else if (name === "size") {
                const v = parseInt(param);
                if (!isNaN(v) && v > 0) {
                  next.fontSize = v;
                }
                styleStack.push(next);
              } else if (name === "i" || name === "italic") {
                next.italic = true;
                styleStack.push(next);
              } else if (name === "u" || name === "underline") {
                next.underline = true;
                styleStack.push(next);
              } else if (name === "stroke" || name === "outline") {
                const parts = param.split(",");
                const c = this.__parseColor(parts[0]);
                const w = parts.length > 1 ? parseFloat(parts[1]) : 1;
                next.strokeColor = c;
                next.strokeWidth = isNaN(w) ? 1 : w;
                styleStack.push(next);
              } else if (name === "shadow") {
                const parts = param.split(",");
                const c = this.__parseColor(parts[0]);
                const ox = parts.length > 1 ? parseFloat(parts[1]) : 1;
                const oy = parts.length > 2 ? parseFloat(parts[2]) : 1;
                const blur = parts.length > 3 ? parseFloat(parts[3]) : 0;
                next.shadowColor = c;
                next.shadowOffset.set(ox, oy);
                next.shadowBlur = isNaN(blur) ? 0 : blur;
                styleStack.push(next);
              } else if (name === "link") {
                next.linkId = param.trim() || null;
                styleStack.push(next);
              } else {
                // 未知标签，忽略
              }
            }
          }

          i = closeIndex + 1;
          continue;
        }
      }

      const top = styleStack[styleStack.length - 1];

      // 若当前样式为下划线，则尽量把连续的字素合并为一个 glyph
      if (top.underline && unit !== "\n" && unit !== "\r") {
        const last = result[result.length - 1];
        if (last && last.style === top) {
          last.ch += unit;
        } else {
          result.push({ ch: unit, style: top });
        }
      } else {
        result.push({ ch: unit, style: top });
      }
      i++;
    }

    return result;
  }

  private __getFontFamily(): string {
    if (this.ttfFont) {
      const fam = this.ttfFont._fontFamily;
      if (fam) {
        return fam;
      }
    }
    return this.fontFamily || "sans-serif";
  }

  private __parseColor(str: string): Color | null {
    const s = str.trim();
    if (!s) {
      return null;
    }
    if (s[0] === "#") {
      const hex = s.substring(1);
      if (hex.length === 6 || hex.length === 8) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) : 255;
        return new Color(r, g, b, a);
      }
    }
    return null;
  }

  private __layoutGlyphs(glyphs: IRichGlyph[]): ILaidOutGlyph[] {
    const laidOut: ILaidOutGlyph[] = [];
    if (!glyphs.length) {
      return laidOut;
    }

    const maxWidth = this.maxWidth > 0 ? this.maxWidth : Number.MAX_SAFE_INTEGER;
    const minLineHeight = this.lineHeight > 0 ? this.lineHeight : 30;

    type LineGlyph = IRichGlyph & {
      width: number;
      height: number;
      glyphKey: string;
    };
    const lines: { glyphs: LineGlyph[]; width: number; height: number }[] = [];

    let currentLine: LineGlyph[] = [];
    let lineWidth = 0;

    const pushLine = () => {
      if (!currentLine.length) {
        return;
      }
      let maxGlyphHeight = 0;
      for (const g of currentLine) {
        if (g.height > maxGlyphHeight) {
          maxGlyphHeight = g.height;
        }
      }
      const lineBoxHeight = Math.max(minLineHeight, maxGlyphHeight);
      lines.push({ glyphs: currentLine, width: lineWidth, height: lineBoxHeight });
      currentLine = [];
      lineWidth = 0;
    };

    for (const g of glyphs) {
      if (g.ch === "\n" || g.ch === "\r") {
        pushLine();
        continue;
      }

      const glyphKey = this.__makeGlyphKey(g.ch, g.style);
      const frame = ioc.richTextAtlas.acquireGlyph(this.atlasKey, glyphKey, g.ch, g.style);
      if (!frame) {
        continue;
      }
      const metrics = {
        width: frame.rect.width,
        height: frame.rect.height,
      };
      const width = metrics.width + this.letterSpacing;
      if (lineWidth + width > maxWidth && currentLine.length > 0) {
        pushLine();
      }

      currentLine.push({
        ch: g.ch,
        style: g.style,
        height: metrics.height,
        width,
        glyphKey,
      });
      lineWidth += width;
    }

    pushLine();

    if (!lines.length) {
      return laidOut;
    }

    // 计算排版结果的实际宽高（以文本包围盒为准）
    const contentWidth = lines.reduce((m, l) => Math.max(m, l.width), 0);
    const totalHeight = lines.reduce((sum, l) => sum + l.height, 0);

    const ui = this.getComponent(UITransform);
    if (ui) {
      ui.setContentSize(contentWidth, totalHeight);
    }

    const layoutWidth = ui?.width ?? contentWidth;
    const layoutHeight = ui?.height ?? totalHeight;

    // 以节点锚点在中心的坐标系来排版
    const originX = -layoutWidth * 0.5;
    const originY = layoutHeight * 0.5;

    let verticalOffset = 0;
    if (layoutHeight > totalHeight) {
      if (this.verticalAlign === VerticalAlign.MIDDLE) {
        verticalOffset = (layoutHeight - totalHeight) * 0.5;
      } else if (this.verticalAlign === VerticalAlign.BOTTOM) {
        verticalOffset = layoutHeight - totalHeight;
      }
    }

    let cursorY = originY - verticalOffset;

    lines.forEach((line) => {
      cursorY -= line.height;

      let offsetX = 0;
      if (layoutWidth > line.width) {
        if (this.horizontalAlign === HorizontalAlign.CENTER) {
          offsetX = (layoutWidth - line.width) * 0.5;
        } else if (this.horizontalAlign === HorizontalAlign.RIGHT) {
          offsetX = layoutWidth - line.width;
        }
      }

      let x = originX + offsetX;
      const lineBottomY = cursorY - line.height;

      for (const g of line.glyphs) {
        laidOut.push({
          ch: g.ch,
          style: g.style,
          x,
          y: lineBottomY + g.height,
          glyphKey: g.glyphKey,
        });
        x += g.width;
      }
    });

    return laidOut;
  }

  private __makeGlyphKey(ch: string, s: IRichTextStyle): string {
    const colorHex = this.__colorToHex(s.color);
    const strokeHex = s.strokeColor ? this.__colorToHex(s.strokeColor) : "none";
    const shadowHex = s.shadowColor ? this.__colorToHex(s.shadowColor) : "none";
    return [
      s.fontFamily,
      s.fontSize,
      colorHex,
      s.italic ? 1 : 0,
      s.underline ? 1 : 0,
      strokeHex,
      s.strokeWidth,
      shadowHex,
      s.shadowOffset.x,
      s.shadowOffset.y,
      s.shadowBlur,
      ch.codePointAt(0) ?? 0,
    ].join("|");
  }

  private __colorToHex(c: Color): string {
    const r = c.r.toString(16).padStart(2, "0");
    const g = c.g.toString(16).padStart(2, "0");
    const b = c.b.toString(16).padStart(2, "0");
    const a = c.a.toString(16).padStart(2, "0");
    return `#${r}${g}${b}${a}`;
  }
}
