import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageStyle: {
      setImageSize: (w?: number | string, h?: number | string) => ReturnType;
    };
  }
}

// Extends the base image node so that explicit width/height are emitted as
// inline CSS in addition to HTML attributes. Tailwind v4 preflight forces
// `img { height: auto }`, which overrides the `height` HTML attribute (so only
// width responds). Inline styles beat that rule, making height resize work.
export const ImageStyled = Image.extend({
  renderHTML({ HTMLAttributes }) {
    const { width, height } = HTMLAttributes;
    const style: string[] = [];
    if (width) style.push(`width:${width}px`);
    if (height) style.push(`height:${height}px`);
    const merged = mergeAttributes(HTMLAttributes, style.length ? { style: style.join(";") } : {});
    return ["img", mergeAttributes(this.options.HTMLAttributes, merged)];
  },
});
