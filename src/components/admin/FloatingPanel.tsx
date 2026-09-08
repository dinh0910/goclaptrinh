"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface FloatingPanelProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export default function FloatingPanel({
  open,
  anchorRef,
  onClose,
  className = "",
  children,
}: FloatingPanelProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const el = panelRef.current;
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!el || !rect) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8;
    const gap = 6;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const openUp = rect.bottom + gap + h > vh - margin;
    const top = openUp
      ? clamp(rect.top - gap - h, margin, vh - margin - h)
      : clamp(rect.bottom + gap, margin, vh - margin - h);
    const left = clamp(
      Math.min(rect.left, vw - margin - w),
      margin,
      vw - margin - w
    );
    setPos({ top, left });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(place);
    return () => cancelAnimationFrame(raf);
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchorRef.current && anchorRef.current.contains(t)) return;
      if (panelRef.current && panelRef.current.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onClose);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onClose);
      window.removeEventListener("resize", onClose);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="menu"
      style={{
        position: "fixed",
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
      }}
      className={`z-[70] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 ${className}`}
    >
      {children}
    </div>,
    document.body
  );
}