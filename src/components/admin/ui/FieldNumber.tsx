"use client";

import { useEffect, useState } from "react";

interface FieldNumberProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  id?: string;
}

function snap(n: number, step: number): number {
  const precision = Math.ceil(Math.max(0, -Math.log10(step) + 1e-9));
  return Number(n.toFixed(Math.min(precision, 100)));
}

export default function FieldNumber({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled,
  size = "md",
  className,
  id,
}: FieldNumberProps) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value)); // eslint-disable-line react-hooks/set-state-in-effect
  }, [value]);

  const clamp = (n: number): number => {
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };

  const commit = (n: number) => {
    const c = clamp(n);
    onChange(snap(c, step));
  };

  const handleText = (raw: string) => {
    setText(raw);
    if (raw === "" || raw === "-" || raw.endsWith(".")) return;
    const n = Number(raw);
    if (Number.isNaN(n) || !Number.isFinite(n)) return;
    commit(n);
  };

  const stepBy = (dir: 1 | -1) => {
    if (disabled) return;
    const current = Number(text);
    const base = Number.isFinite(current) ? current : value;
    commit(base + dir * step);
  };

  const handleBlur = () => {
    const n = Number(text);
    if (Number.isNaN(n) || !Number.isFinite(n)) {
      setText(String(value));
    } else {
      const c = snap(clamp(n), step);
      setText(String(c));
      onChange(c);
    }
  };

  const sm = size === "sm";

  const buttonClass = `shrink-0 flex items-center justify-center text-gray-500 dark:text-gray-400 border-l border-gray-300 dark:border-gray-700 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-default ${
    sm ? "w-7" : "w-9"
  }`;

  return (
    <div
      className={`flex items-stretch overflow-hidden rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-colors ${
        disabled ? "opacity-50 pointer-events-none" : ""
      } ${className ?? ""}`}
    >
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={text}
        onChange={(e) => handleText(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        className={`w-full min-w-0 bg-transparent text-gray-900 dark:text-white focus:outline-none disabled:opacity-50 ${
          sm ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"
        }`}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => stepBy(-1)}
        aria-label="Giảm"
        className={buttonClass}
      >
        <svg className={sm ? "w-3 h-3" : "w-3.5 h-3.5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
        </svg>
      </button>
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => stepBy(1)}
        aria-label="Tăng"
        className={buttonClass}
      >
        <svg className={sm ? "w-3 h-3" : "w-3.5 h-3.5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}