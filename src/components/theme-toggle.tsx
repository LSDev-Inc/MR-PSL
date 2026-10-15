"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    let saved: "dark" | "light" = "dark";
    try {
      const preference = window.localStorage.getItem("ramadu-theme");
      if (preference === "light" || preference === "dark") saved = preference;
    } catch {
      // Keep theme switching available when browser storage is blocked.
    }
    document.documentElement.dataset.theme = saved;
    setTheme(saved);
  }, []);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem("ramadu-theme", next);
    } catch {
      // The visual change still applies for this page when storage is unavailable.
    }
  }
  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Attiva il tema scuro" : "Attiva il tema chiaro"}
      title={theme === "light" ? "Tema scuro" : "Tema chiaro"}
      aria-pressed={theme === "light"}
    >
      {theme === "light" ? <Moon aria-hidden="true" size={17} /> : <Sun aria-hidden="true" size={17} />}
    </button>
  );
}
