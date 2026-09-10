"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface RowAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}

interface MenuPos {
  top: number;
  left: number;
}

function placeMenu(
  triggerRect: DOMRect,
  menuWidth: number,
  menuHeight: number,
  gap = 6
): MenuPos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 8;

  const openUp = triggerRect.bottom + gap + menuHeight > vh - margin;
  const top = openUp
    ? Math.max(margin, triggerRect.top - gap - menuHeight)
    : Math.min(triggerRect.bottom + gap, vh - margin - menuHeight);

  let left = Math.min(triggerRect.right - menuWidth, vw - margin - menuWidth);
  left = Math.max(margin, left);

  return { top, left };
}

export default function RowActionsMenu({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        menuRef.current &&
        menuRef.current.contains(t)
      ) {
        return;
      }
      if (triggerRef.current && triggerRef.current.contains(t)) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => {
      if (!triggerRef.current || !menuRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      setPos(placeMenu(rect, menuRect.width || 176, menuRect.height || 120));
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setOpen(true);
    setPos(placeMenu(rect, 176, 120));
  };

  useEffect(() => {
    if (open && triggerRef.current && menuRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      setPos(placeMenu(rect, menuRect.width || 176, menuRect.height || 120));
    }
  }, [open]);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label="Thao tác"
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
          aria-hidden
        >
          <circle cx="5" cy="12" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="19" cy="12" r="1.7" />
        </svg>
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: "fixed", top: pos.top, left: pos.left }}
            className="z-[70] w-44 py-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg"
          >
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  a.onClick();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                  a.disabled
                    ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    : a.variant === "danger"
                      ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                disabled={a.disabled}
              >
                <span className="w-4 flex justify-center">{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}