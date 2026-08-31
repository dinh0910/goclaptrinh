"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import MediaPicker from "./MediaPicker";

interface ImageToolbarProps {
  editor: Editor;
}

export default function ImageToolbar({ editor }: ImageToolbarProps) {
  const [replacing, setReplacing] = useState(false);

  if (!editor.isActive("image")) return null;

  const attrs = editor.getAttributes("image");

  const update = (patch: Record<string, unknown>) => {
    editor.chain().updateAttributes("image", patch).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20">
      <span className="text-xs font-medium text-amber-700 dark:text-amber-400 shrink-0">
        🖼️ Ảnh
      </span>

      <label className="text-[11px] text-amber-600 dark:text-amber-300 shrink-0">
        Alt:
      </label>
      <input
        type="text"
        value={attrs.alt || ""}
        onChange={(e) => update({ alt: e.target.value })}
        className="w-40 px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-500/30 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
        placeholder="Mô tả cho SEO"
      />

      <label className="text-[11px] text-amber-600 dark:text-amber-300 shrink-0">
        Title:
      </label>
      <input
        type="text"
        value={attrs.title || ""}
        onChange={(e) => update({ title: e.target.value })}
        className="w-36 px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-500/30 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
        placeholder="Tooltip khi hover"
      />

      <label className="text-[11px] text-amber-600 dark:text-amber-300 shrink-0">
        W:
      </label>
      <input
        type="number"
        min={1}
        value={Number(attrs.width) || ""}
        onChange={(e) => update({ width: e.target.value })}
        className="w-18 px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-500/30 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
        placeholder="px"
      />

      <label className="text-[11px] text-amber-600 dark:text-amber-300 shrink-0">
        H:
      </label>
      <input
        type="number"
        min={1}
        value={Number(attrs.height) || ""}
        onChange={(e) => update({ height: e.target.value })}
        className="w-18 px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-500/30 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
        placeholder="px"
      />

      <div className="ml-auto flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setReplacing(true)}
          className="px-2 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 rounded hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors"
        >
          Thay ảnh
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteSelection().run()}
          className="px-2 py-1 text-[11px] font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
        >
          Xóa ảnh
        </button>
      </div>

      {replacing && (
        <MediaPicker
          onSelect={(item) => {
            update({
              src: item.url,
              ...(item.altText ? { alt: item.altText } : {}),
              ...(item.title ? { title: item.title } : {}),
              ...(item.width ? { width: item.width } : {}),
              ...(item.height ? { height: item.height } : {}),
            });
            setReplacing(false);
          }}
          onClose={() => setReplacing(false)}
        />
      )}
    </div>
  );
}