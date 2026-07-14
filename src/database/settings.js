import { runTransaction } from "./transaction.js";

export async function getSetting(database, id) {
  return runTransaction(database, ["settings"], "readonly", ({ store }) => store("settings").get(id));
}

export async function setSetting(database, id, value, now = () => new Date().toISOString()) {
  const existing = await getSetting(database, id);
  const record = { id, value, createdAt: existing?.createdAt ?? now(), updatedAt: now() };
  await runTransaction(database, ["settings"], "readwrite", ({ store }) => store("settings").put(record));
  return record;
}

export async function migrateThemePreference(database, storage = globalThis.localStorage) {
  const existing = await getSetting(database, "appearance.theme");
  if (existing) return existing.value;
  let preference = "system";
  try { const value = storage?.getItem("finorbit.theme"); if (["system", "light", "dark"].includes(value)) preference = value; } catch {}
  await setSetting(database, "appearance.theme", preference);
  return preference;
}
