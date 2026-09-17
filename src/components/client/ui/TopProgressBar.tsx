"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const MIN_PROGRESS = 8;
const MAX_PROGRESS = 90;

export default function TopProgressBar() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathRef = useRef(pathname);

  const clearTimers = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const finish = () => {
    clearTimers();
    setProgress(100);
    timerRef.current = setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, 250);
  };

  const start = () => {
    clearTimers();
    setActive(true);
    setProgress(MIN_PROGRESS);
    let step = MIN_PROGRESS;
    const tick = () => {
      step += (MAX_PROGRESS - step) * 0.18 + (step < 30 ? 2 : 0.4);
      setProgress(Math.min(step, MAX_PROGRESS));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // Navigation completed when pathname changes
  useEffect(() => {
    if (pathRef.current !== pathname) {
      pathRef.current = pathname;
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Start on internal link click
  useEffect(() => {
    if (isAdmin) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      const href = anchor.getAttribute("href") || "";
      if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("#"))
        return;
      const [linkPath] = href.split(/[?#]/);
      if (linkPath === location.pathname) return;
      start();
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (isAdmin || !active) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-[3px] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.7)] transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}