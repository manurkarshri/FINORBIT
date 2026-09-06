export const APP_VERSION = "1.0.0";
export const THEME_STORAGE_KEY = "finorbit.theme";
export const THEMES = Object.freeze(["system", "light", "dark"]);

const listeners = new Set();
const state = {
  activeRoute: "transactions",
  themePreference: "system",
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  serviceWorkerUpdate: null,
  version: APP_VERSION,
};

export function getState() {
  return Object.freeze({ ...state });
}

export function setState(patch) {
  Object.assign(state, patch);
  const snapshot = getState();
  listeners.forEach((listener) => listener(snapshot));
  return snapshot;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isTheme(value) {
  return THEMES.includes(value);
}

export function resolveTheme(preference, systemPrefersDark = false) {
  if (preference === "dark" || preference === "light") return preference;
  return systemPrefersDark ? "dark" : "light";
}

export function readThemePreference(storage = globalThis.localStorage) {
  try {
    const stored = storage?.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function writeThemePreference(preference, storage = globalThis.localStorage) {
  if (!isTheme(preference)) return false;
  try {
    storage?.setItem(THEME_STORAGE_KEY, preference);
    return true;
  } catch {
    return false;
  }
}

export function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([a-z0-9.-]+))?$/i.exec(version);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
  };
}
