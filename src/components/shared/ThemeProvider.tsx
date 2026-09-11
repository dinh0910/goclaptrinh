"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getStoredTheme(): Theme {
  const stored = localStorage.getItem("theme") as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useLayoutEffect(() => {
    const initial = getStoredTheme();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(initial);
    // Admin pages use a per-account theme set by the head script + AdminShell;
    // skip toggling the class here to avoid overwriting it.
    if (!location.pathname.startsWith("/admin")) {
      document.documentElement.classList.toggle("dark", initial === "dark");
    }
  }, []);

  const applyTheme = useCallback((next: Theme) => {
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    applyTheme(theme === "light" ? "dark" : "light");
  }, [theme, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
