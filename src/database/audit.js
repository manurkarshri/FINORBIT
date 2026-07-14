import { runTransaction } from "./transaction.js";
import { createOpaqueId } from "./validation.js";

export const AUDIT_TYPES = Object.freeze(["database.created", "migration.started", "migration.completed", "migration.failed", "security.setup", "security.unlocked", "security.locked", "security.unlock_failed", "backup.created", "restore.attempted", "restore.completed", "restore.failed", "data.reset", "entity.created", "entity.edited", "entity.archived", "entity.restored", "entity.closed", "opening-value.changed", "onboarding.completed"]);

export function createAuditEvent(type, detail = {}, { now = () => new Date().toISOString(), cryptoObject = globalThis.crypto } = {}) {
  if (!AUDIT_TYPES.includes(type)) throw new TypeError("Unsupported audit event type");
  return { id: createOpaqueId(cryptoObject), type, detail: sanitizeAuditDetail(detail), createdAt: now(), updatedAt: now(), schemaVersion: 2 };
}

export function sanitizeAuditDetail(detail) {
  const prohibited = /pin|passphrase|password|secret|key|credential/i;
  return Object.fromEntries(Object.entries(detail).filter(([key]) => !prohibited.test(key)));
}

export async function appendAudit(database, event, transactionContext) {
  if (transactionContext) return transactionContext.store("auditLogs").add(event);
  return runTransaction(database, ["auditLogs"], "readwrite", ({ store }) => store("auditLogs").add(event));
}
