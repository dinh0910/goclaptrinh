import { isIP } from "net";

export interface VisitorSignals {
  ua: string;
  platform: string;
  lang: string;
  tz: string;
  screenW: number;
  screenH: number;
  dpr: number;
  touch: boolean;
}

const MAX_UA_LEN = 400;
const MAX_PART_LEN = 100;

export function normalizeSignals(input: unknown): VisitorSignals {
  const s =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const num = (v: unknown, fallback: number): number => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
  };
  const str = (v: unknown, fallback: string): string => {
    if (typeof v !== "string") return fallback;
    const t = v.trim();
    if (!t) return fallback;
    return t.length > MAX_PART_LEN ? t.slice(0, MAX_PART_LEN) : t;
  };
  return {
    ua: typeof s.ua === "string" ? s.ua.slice(0, MAX_UA_LEN) : "",
    platform: str(s.platform, ""),
    lang: str(s.lang, ""),
    tz: str(s.tz, ""),
    screenW: num(s.screenW, 0),
    screenH: num(s.screenH, 0),
    dpr: num(s.dpr, 0),
    touch: typeof s.touch === "boolean" ? s.touch : false,
  };
}

function hashCode(str: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function computeFingerprint(signals: VisitorSignals): string {
  const parts = [
    signals.ua,
    signals.platform,
    signals.lang,
    signals.tz,
    String(signals.screenW),
    String(signals.screenH),
    String(signals.dpr),
    String(signals.touch),
  ].join("|");
  const a = hashCode(parts, 0x811c9dc5).toString(36);
  const b = hashCode(parts, 0xdeadbeef).toString(36);
  return `${a}${b}`;
}

export function describeDevice(signals: VisitorSignals): {
  browser: string;
  os: string;
  screen: string;
} {
  const ua = signals.ua;
  let browser = "";
  if (/Edg\//i.test(ua) && !/Edge\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome\/|CriOS|FxiOS/i.test(ua)) {
    browser = /CriOS/i.test(ua)
      ? "Chrome (iOS)"
      : /FxiOS/i.test(ua)
        ? "Firefox (iOS)"
        : "Chrome";
  } else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua)) browser = "Safari";

  let os = "";
  if (/Windows NT 10/i.test(ua)) os = "Windows 10/11";
  else if (/Windows NT 6\.1/i.test(ua)) os = "Windows 7";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  if (!os && signals.platform) {
    const plat = signals.platform.replace(/\s*MacIntel$/i, "Mac").slice(0, 24);
    if (plat && !/^Win/i.test(plat)) os = plat;
  }

  const screen =
    signals.screenW && signals.screenH
      ? `${signals.screenW}×${signals.screenH}`
      : "";

  return { browser, os, screen };
}

export function deviceLabel(signals: VisitorSignals): string {
  const { browser, os, screen } = describeDevice(signals);
  const parts = [browser, os, screen, signals.touch ? "Cảm ứng" : ""].filter(
    Boolean
  );
  return parts.join(" · ") || "Thiết bị không xác định";
}

function cleanIp(raw: string): string {
  let s = raw.trim().toLowerCase();
  // Strip IPv4 embedded in IPv6 literal and IPv6 zone ids.
  s = s.replace(/^\[/, "").replace(/\]$/, "");
  const zoneIdx = s.indexOf("%");
  if (zoneIdx !== -1) s = s.slice(0, zoneIdx);
  return isIP(s) ? s : "";
}

export function getClientIp(headers: Pick<Headers, "get">): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    // Only the left-most entry is ours if the server sits behind a trusted
    // proxy chain; validate it so arbitrary strings can't be injected.
    const first = fwd.split(",")[0];
    const ip = cleanIp(first);
    if (ip) return ip;
  }
  const real = headers.get("x-real-ip");
  if (real) {
    const ip = cleanIp(real);
    if (ip) return ip;
  }
  return "";
}