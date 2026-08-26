"use client";

import { useEffect } from "react";

const COPY_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const CHECK_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

const STYLES = `
  .code-copy-btn {
    position: absolute; top: 8px; right: 8px;
    padding: 6px; border-radius: 6px;
    border: none;
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.5);
    cursor: pointer; z-index: 10;
    transition: all 0.15s ease;
    display: flex; align-items: center; justify-content: center;
  }
  .code-copy-btn:hover {
    background: rgba(255,255,255,0.2);
    color: #fff;
  }
  .code-copy-btn.copied {
    background: rgba(74,222,128,0.15);
    color: #4ade80;
  }
`;

export default function CodeBlockCopy({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!document.getElementById("code-copy-styles")) {
      const s = document.createElement("style");
      s.id = "code-copy-styles";
      s.textContent = STYLES;
      document.head.appendChild(s);
    }

    const prose = document.querySelector(".prose");
    if (!prose) return;

    prose.querySelectorAll("pre").forEach((pre) => {
      if (pre.dataset.copyInit) return;
      pre.dataset.copyInit = "true";
      pre.style.position = "relative";

      const btn = document.createElement("button");
      btn.innerHTML = COPY_SVG;
      btn.title = "Copy";
      btn.className = "code-copy-btn";

      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code");
        const text = code?.textContent || pre.textContent || "";
        try {
          await navigator.clipboard.writeText(text);
          btn.innerHTML = CHECK_SVG;
          btn.title = "Copied!";
          btn.classList.add("copied");
          setTimeout(() => {
            btn.innerHTML = COPY_SVG;
            btn.title = "Copy";
            btn.classList.remove("copied");
          }, 2000);
        } catch { /* silent */ }
      });

      pre.appendChild(btn);
    });
  }, [children]);

  return <>{children}</>;
}
