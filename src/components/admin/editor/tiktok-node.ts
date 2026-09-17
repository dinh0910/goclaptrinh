import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    tiktok: {
      setTiktok: (options: { src: string; videoId?: string }) => ReturnType;
    };
  }
}

export interface TiktokOptions {
  HTMLAttributes: Record<string, unknown>;
}

export const Tiktok = Node.create<TiktokOptions>({
  name: "tiktok",
  group: "block",
  atom: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  parseHTML() {
    return [{ tag: 'div[data-tiktok]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-tiktok": "",
        class: "tiktok-embed",
      }),
    ];
  },

  addCommands() {
    return {
      setTiktok:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addNodeView() {
    return ({ node }) => {
      const div = document.createElement("div");
      div.className = "my-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700";

      const iframe = document.createElement("iframe");
      iframe.src = node.attrs.src as string;
      iframe.className = "w-full rounded-lg";
      iframe.style.height = "600px";
      iframe.setAttribute("allowfullscreen", "true");
      iframe.setAttribute("allow", "encrypted-media");
      div.appendChild(iframe);

      return { dom: div };
    };
  },
});
