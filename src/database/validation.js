import { DatabaseError } from "./errors.js";

export function assertStableRecord(record, { storeName = "record" } = {}) {
  if (!record || typeof record !== "object" || Array.isArray(record)) throw new DatabaseError("INVALID_RECORD", `${storeName} record must be an object.`);
  if (typeof record.id !== "string" || !/^[A-Za-z0-9_-]{8,}$/.test(record.id)) throw new DatabaseError("INVALID_ID", `${storeName} record requires a stable opaque ID.`);
  for (const key of ["createdAt", "updatedAt"]) if (record[key] && Number.isNaN(Date.parse(record[key]))) throw new DatabaseError("INVALID_TIMESTAMP", `${storeName}.${key} must be a UTC instant.`);
  return record;
}

export function createOpaqueId(cryptoObject = globalThis.crypto) {
  if (typeof cryptoObject?.randomUUID === "function") return cryptoObject.randomUUID();
  const bytes = cryptoObject.getRandomValues(new Uint8Array(16));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
