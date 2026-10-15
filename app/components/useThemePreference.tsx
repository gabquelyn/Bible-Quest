"use client";

import { useSyncExternalStore } from "react";
import { THEMES } from "../data/themes";

const THEME_KEY = "bible:theme";

function subscribeToTheme(callback: () => void) {
  window.addEventListener("storage", callback);

  return () => window.removeEventListener("storage", callback);
}

function getThemeSnapshot(): ThemeId {
  const stored = localStorage.getItem(THEME_KEY);

  return stored && stored in THEMES ? (stored as ThemeId) : "dawn";
}

function getServerThemeSnapshot(): ThemeId {
  return "dawn";
}

export function useThemePreference() {
  return useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
}