"use client";

import { useRef, useState } from "react";

export default function UploadZone({
  uploading,
  onFiles,
}: {
  uploading: boolean;
  onFiles: (files: FileList | File[]) => Promise<void>;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    await onFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        void handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
        dragOver
          ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
          : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-400"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.m4v,.webm,.ogv,.ogg,.mov"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files);
        }}
      />
      <div className="text-3xl mb-2">📤</div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {uploading
          ? "Đang tải lên..."
          : "Kéo thả ảnh hoặc video vào đây hoặc bấm để chọn"}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Ảnh: JPG, PNG, WebP, GIF (tối đa 5MB) — Video: MP4, WebM, OGG (tối đa 512MB)
      </p>
    </div>
  );
}