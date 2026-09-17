"use client";

import { useState } from "react";
import { toast } from "sonner";

interface LessonProgressProps {
  courseId: number;
  lessonId: number;
  initialCompleted: boolean;
  completedCount: number;
  totalLessons: number;
}

export default function LessonProgress({
  courseId,
  lessonId,
  initialCompleted,
  completedCount,
  totalLessons,
}: LessonProgressProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [count, setCount] = useState(completedCount);
  const [saving, setSaving] = useState(false);

  const percent = totalLessons > 0 ? Math.round((count / totalLessons) * 100) : 0;

  const handleToggle = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/courses/${courseId}/lessons/${lessonId}/progress`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: !completed }),
        }
      );
      const data = (await res.json()) as {
        error?: string;
        progress?: number;
        completed?: boolean;
        completedLessons?: number[];
      };
      if (!res.ok) throw new Error(data.error || "Đã có lỗi xảy ra");

      const next = !completed;
      setCompleted(next);
      setCount(Array.isArray(data.completedLessons) ? data.completedLessons.length : count + (next ? 1 : -1));
      toast.success(next ? "Đã đánh dấu hoàn thành" : "Đã bỏ đánh dấu hoàn thành");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
          <span>Tiến độ của bạn</span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {count}/{totalLessons} bài · {percent}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={saving}
        className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
          completed
            ? "text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:hover:bg-emerald-500/20"
            : "text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
        }`}
      >
        {completed ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Hoàn thành
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Đánh dấu hoàn thành
          </>
        )}
      </button>
    </div>
  );
}