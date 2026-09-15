"use client";

import { useEffect } from "react";
import { getVisitorId, getVisitorSignals } from "@/lib/client-visitor";

const DEDUPE_KEY_PREFIX = "pv_sent_";

export default function PageViewTracker() {
  useEffect(() => {
    let cancelled = false;
    const path = window.location.pathname;
    if (path.startsWith("/admin")) return;

    const visitorId = getVisitorId();
    const signals = getVisitorSignals();

    let dedupeKey = "";
    try {
      dedupeKey = `${DEDUPE_KEY_PREFIX}${visitorId}|${path}`;
      if (window.sessionStorage.getItem(dedupeKey)) return;
    } catch {
      /* ignore storage errors */
    }

    fetch("/api/track/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path,
        referrer: document.referrer || "",
        visitorId,
        signals,
      }),
      keepalive: true,
    })
      .then((res) => res.json().catch(() => null))
      .then(() => {
        if (!cancelled && dedupeKey) {
          try {
            window.sessionStorage.setItem(dedupeKey, "1");
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        /* tracking must never break the page */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}