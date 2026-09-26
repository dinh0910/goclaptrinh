"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ScrollToTopProps {
  /** Only appear once the page is scrolled further than this (px). */
  threshold?: number;
  className?: string;
  label?: string;
  /** Force the button to stay collapsed (e.g. while another panel is open). */
  hidden?: boolean;
}

const buttonClass =
  "flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";

export default function ScrollToTop({
  threshold = 400,
  className = "",
  label = "Lên đầu trang",
  hidden = false,
}: ScrollToTopProps) {
  const [scrolled, setScrolled] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    // rAF-throttled so a fast scroll does not fire a setState per frame.
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        ticking.current = false;
        setScrolled(window.scrollY > threshold);
      });
    };

    // Deferred on purpose: calling setVisible synchronously here would be a
    // cascading render inside the effect body.
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [threshold]);

  const toTop = useCallback(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, []);

  // Scroll position is tracked even while forced hidden, so the button
  // reappears in the correct state the moment `hidden` goes back to false.
  const shown = !hidden && scrolled;

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label={label}
      title={label}
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
      className={`${buttonClass} transition-[opacity,transform] ${
        shown
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      } ${className}`}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.25}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m5 15 7-7 7 7" />
      </svg>
    </button>
  );
}
