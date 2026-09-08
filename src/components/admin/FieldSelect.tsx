"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export interface FieldSelectOption {
  value: string;
  label: string;
  icon?: string;
  badge?: React.ReactNode;
  disabled?: boolean;
}

interface FieldSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: FieldSelectOption[];
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  id?: string;
}

interface ListPos {
  top: number;
  left: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function computePos(rect: DOMRect, height: number): ListPos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 8;
  const gap = 6;

  const openUp = rect.bottom + gap + height > vh - margin;
  const top = openUp
    ? clamp(rect.top - gap - height, margin, vh - margin - height)
    : clamp(rect.bottom + gap, margin, vh - margin - height);
  const left = clamp(
    Math.min(rect.left, vw - margin - rect.width),
    margin,
    vw - margin - rect.width
  );

  return { top, left };
}

export default function FieldSelect({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  searchable,
  disabled,
  size = "md",
  className,
  id,
}: FieldSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<ListPos | null>(null);
  const [width, setWidth] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const needsSearch =
    searchable !== undefined ? searchable : options.length > 6;

  const sm = size === "sm";

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q)
    );
  }, [query, options]);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setWidth(rect.width);
    const header = needsSearch ? (sm ? 46 : 50) : 0;
    const max = needsSearch ? (sm ? 144 : 208) : (sm ? 192 : 240);
    const item = sm ? 30 : 40;
    const estHeight = header + Math.min(filtered.length * item, max) + 8;
    setPos(computePos(rect, estHeight));
    setOpen(true);
    setQuery("");
  }, [disabled, needsSearch, sm, filtered.length]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    const el = listRef.current;
    if (!rect || !el) return;
    setPos(computePos(rect, el.offsetHeight));
    setWidth(rect.width);
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place, query, filtered.length]);

  const pick = useCallback(
    (v: string) => {
      onChange(v);
      close();
      triggerRef.current?.focus();
    },
    [onChange, close]
  );

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current && rootRef.current.contains(t)) return;
      if (listRef.current && listRef.current.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onScrollOrResize = () => close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScrollOrResize);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, close]);

  useEffect(() => {
    if (open && needsSearch && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open, needsSearch]);

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => (open ? close() : openDropdown())}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`
          w-full flex items-center gap-2 text-left rounded-xl border transition-colors
          ${
            sm
              ? "h-8 px-2.5 text-xs"
              : "h-11 px-3.5 text-sm"
          }
          ${
            open
              ? "border-blue-400 dark:border-blue-500 ring-2 ring-blue-500/20"
              : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
          }
          bg-white dark:bg-gray-900
          text-gray-900 dark:text-white
          disabled:opacity-40 disabled:cursor-default
        `}
      >
        {selected?.icon && (
          <span className="shrink-0 text-base leading-none">
            {selected.icon}
          </span>
        )}
        <span className="flex-1 truncate">
          {selected ? selected.label : placeholder}
        </span>
        {selected?.badge && (
          <span className="shrink-0 ml-auto">{selected.badge}</span>
        )}
        <svg
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""} ${
            sm ? "w-3 h-3" : "w-4 h-4"
          } text-gray-400 dark:text-gray-500`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={listRef}
            role="listbox"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width,
            }}
            className="z-[70] overflow-hidden rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          >
            {needsSearch && (
              <div className="px-2.5 pt-2.5 pb-1.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <div className="relative">
                  <svg
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className={`
                      w-full pl-8 pr-2.5 bg-gray-50 dark:bg-gray-800 border-0
                      rounded-lg text-gray-900 dark:text-white
                      placeholder:text-gray-400 dark:placeholder:text-gray-500
                      focus:outline-none focus:ring-1 focus:ring-blue-500
                      ${sm ? "h-7 text-xs" : "h-9 text-sm"}
                    `}
                  />
                </div>
              </div>
            )}

            <div
              className={`overflow-y-auto ${
                needsSearch
                  ? sm
                    ? "max-h-36"
                    : "max-h-52"
                  : sm
                    ? "max-h-48"
                    : "max-h-60"
              }`}
            >
              {filtered.length === 0 && (
                <div className="px-4 py-4 text-center text-xs text-gray-400 dark:text-gray-500">
                  Không có kết quả
                </div>
              )}
              {filtered.map((opt) => {
                const active = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    role="option"
                    aria-selected={active}
                    onClick={() => pick(opt.value)}
                    className={`
                      w-full flex items-center gap-2.5 text-left transition-colors
                      ${sm ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2.5 text-sm"}
                      ${
                        active
                          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }
                      disabled:opacity-40 disabled:cursor-default
                    `}
                  >
                    {opt.icon && (
                      <span className="shrink-0 text-base leading-none">
                        {opt.icon}
                      </span>
                    )}
                    <span className="flex-1 truncate">{opt.label}</span>
                    {opt.badge && (
                      <span className="shrink-0">{opt.badge}</span>
                    )}
                    {active && (
                      <svg
                        className="shrink-0 w-4 h-4 text-blue-600 dark:text-blue-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}