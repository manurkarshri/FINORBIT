import test from "node:test";
import assert from "node:assert/strict";

import { APP_VERSION, THEME_STORAGE_KEY, parseVersion, readThemePreference, resolveTheme, writeThemePreference } from "../src/app/state.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("resolves explicit and system themes", () => {
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("system", false), "light");
});

test("reads, validates, and persists only approved theme values", () => {
  const storage = memoryStorage({ [THEME_STORAGE_KEY]: "dark" });
  assert.equal(readThemePreference(storage), "dark");
  assert.equal(writeThemePreference("light", storage), true);
  assert.equal(readThemePreference(storage), "light");
  assert.equal(writeThemePreference("midnight", storage), false);
  assert.equal(readThemePreference(memoryStorage({ [THEME_STORAGE_KEY]: "invalid" })), "system");
});

test("storage failures safely fall back to system", () => {
  const failing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.equal(readThemePreference(failing), "system");
  assert.equal(writeThemePreference("dark", failing), false);
});

test("application version is the production release", () => {
  assert.deepEqual(parseVersion(APP_VERSION), { major: 1, minor: 0, patch: 0, prerelease: null });
  assert.equal(parseVersion("not-a-version"), null);
});
