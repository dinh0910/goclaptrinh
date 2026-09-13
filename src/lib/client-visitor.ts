"use client";

const STORAGE_KEY = "goclaptrinh_visitor_id";

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // Bỏ qua, rơi xuống sinh id thủ công
  }
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = randomId();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function getVisitorSignals(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    return {
      ua: navigator.userAgent || "",
      platform: navigator.platform || "",
      lang: navigator.language || "",
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      screenW: window.screen?.width || 0,
      screenH: window.screen?.height || 0,
      dpr: window.devicePixelRatio || 0,
      touch: window.matchMedia?.("(pointer: coarse)")?.matches ?? false,
    };
  } catch {
    return {};
  }
}