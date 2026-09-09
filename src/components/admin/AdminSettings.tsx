"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type FontScale = "sm" | "md" | "lg";

export interface AdminSettings {
  collapsed: boolean;
  fontScale: FontScale;
}

export const DEFAULT_SETTINGS: AdminSettings = {
  collapsed: false,
  fontScale: "md",
};

export const FONT_SCALES: Record<
  FontScale,
  { label: string; px: number; preview: string }
> = {
  sm: { label: "Nhỏ", px: 14, preview: "text-sm" },
  md: { label: "Vừa", px: 16, preview: "text-base" },
  lg: { label: "Lớn", px: 18, preview: "text-lg" },
};

const STORAGE_KEY = "admin-settings";

function loadSettings(): AdminSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AdminSettings>;
    return {
      collapsed: parsed.collapsed === true,
      fontScale:
        parsed.fontScale === "sm" || parsed.fontScale === "lg"
          ? parsed.fontScale
          : "md",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(settings: AdminSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable (private mode, etc.) — skip silently
  }
}

interface AdminSettingsContextValue {
  settings: AdminSettings;
  setCollapsed: (value: boolean) => void;
  setFontScale: (value: FontScale) => void;
  reset: () => void;
}

const AdminSettingsContext = createContext<AdminSettingsContextValue | null>(
  null
);

export function AdminSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(loadSettings());
  }, []);

  const update = useCallback((next: AdminSettings) => {
    setSettings(next);
    persistSettings(next);
  }, []);

  const setCollapsed = useCallback(
    (value: boolean) => update({ ...settings, collapsed: value }),
    [update, settings]
  );
  const setFontScale = useCallback(
    (value: FontScale) => update({ ...settings, fontScale: value }),
    [update, settings]
  );
  const reset = useCallback(
    () => update(DEFAULT_SETTINGS),
    [update]
  );

  // Keep font size of the admin UI in sync; restore the default when leaving
  // the admin area so the public site is unaffected.
  useEffect(() => {
    document.documentElement.style.fontSize = `${FONT_SCALES[settings.fontScale].px}px`;
    return () => {
      document.documentElement.style.fontSize = "";
    };
  }, [settings.fontScale]);

  // Reflect changes made in another tab.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setSettings(loadSettings());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({ settings, setCollapsed, setFontScale, reset }),
    [settings, setCollapsed, setFontScale, reset]
  );

  return (
    <AdminSettingsContext.Provider value={value}>
      {children}
    </AdminSettingsContext.Provider>
  );
}

export function useAdminSettings() {
  const ctx = useContext(AdminSettingsContext);
  if (!ctx) {
    throw new Error(
      "useAdminSettings must be used within AdminSettingsProvider"
    );
  }
  return ctx;
}