export const themeStorageKey = "theme";

export function getSystemTheme() {
  if (typeof window === "undefined" || !window.matchMedia) return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getSavedTheme() {
  if (typeof window === "undefined") return null;

  try {
    const savedTheme = window.localStorage.getItem(themeStorageKey);
    return savedTheme === "dark" || savedTheme === "light" ? savedTheme : null;
  } catch {
    return null;
  }
}

export function getInitialTheme() {
  return getSavedTheme() || getSystemTheme();
}

export function applyTheme(theme) {
  if (typeof document === "undefined") return;

  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isDark ? "#000000" : "#ffffff");
}

export function saveTheme(theme) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Theme still applies for the current session even if storage is unavailable.
  }
}

export function getSystemThemeMedia() {
  if (typeof window === "undefined" || !window.matchMedia) return null;

  return window.matchMedia("(prefers-color-scheme: dark)");
}
