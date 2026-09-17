"use client";

import type { ComponentProps } from "react";

type TextAreaProps = ComponentProps<"textarea">;

export function TextArea({ className, ref, ...props }: TextAreaProps) {
  return (
    <textarea
      ref={ref}
      className={`w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className ?? ""}`}
      {...props}
    />
  );
}

export default TextArea;