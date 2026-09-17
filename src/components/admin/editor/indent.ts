import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

export const Indent = Extension.create({
  name: "indent",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      minLevel: 0,
      maxLevel: 8,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const level = parseInt(element.style.marginLeft, 10) / 40 || 0;
              return Math.min(Math.max(level, 0), this.options.maxLevel);
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent <= 0) return {};
              return { style: `margin-left: ${attributes.indent * 40}px` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const pos = selection.$from;
          const node = pos.node(pos.depth === 0 ? 0 : pos.depth);
          if (!node || !this.options.types.includes(node.type.name)) return false;

          const currentIndent = node.attrs.indent || 0;
          if (currentIndent >= this.options.maxLevel) return false;

          if (dispatch) {
            tr.setNodeMarkup(pos.before(pos.depth === 0 ? 0 : pos.depth), undefined, {
              ...node.attrs,
              indent: currentIndent + 1,
            });
            dispatch(tr);
          }
          return true;
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const pos = selection.$from;
          const node = pos.node(pos.depth === 0 ? 0 : pos.depth);
          if (!node || !this.options.types.includes(node.type.name)) return false;

          const currentIndent = node.attrs.indent || 0;
          if (currentIndent <= this.options.minLevel) return false;

          if (dispatch) {
            tr.setNodeMarkup(pos.before(pos.depth === 0 ? 0 : pos.depth), undefined, {
              ...node.attrs,
              indent: currentIndent - 1,
            });
            dispatch(tr);
          }
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      "Shift-Tab": () => this.editor.commands.outdent(),
    };
  },
});
