import { createOpaqueId } from "../database/validation.js";
import { runTransaction } from "../database/transaction.js";
import { createAuditEvent } from "../database/audit.js";

export const RECEIPT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
export const RECEIPT_FILE_LIMIT = 10 * 1024 * 1024;
export const RECEIPT_TOTAL_LIMIT = 50 * 1024 * 1024;

export function createReceiptService(database, { now = () => new Date().toISOString(), id = () => createOpaqueId() } = {}) {
  async function save(transactionId, file, { replaceId } = {}) {
    if (!RECEIPT_TYPES.has(file.type)) throw new Error("Receipt must be a JPEG, PNG, WebP, or PDF.");
    if (!Number.isSafeInteger(file.size) || file.size <= 0 || file.size > RECEIPT_FILE_LIMIT) throw new Error("Receipt must be larger than zero and no more than 10 MB.");
    let decodedSize; try { decodedSize = atob(String(file.contentBase64 ?? "")).length; } catch { throw new Error("Receipt content is not valid base64."); }
    if (decodedSize !== file.size) throw new Error("Receipt content size does not match the selected file.");
    const existing = await runTransaction(database, ["receipts"], "readonly", ({ store }) => store("receipts").getAll()); const replaced = replaceId ? existing.find((item) => item.id === replaceId) : null;
    const total = existing.reduce((sum, item) => sum + (item.size ?? 0), 0) - (replaced?.size ?? 0) + file.size; if (total > RECEIPT_TOTAL_LIMIT) throw new Error("Receipt storage limit of 50 MB would be exceeded.");
    const instant = now(); const receipt = { id: replaceId ?? id(), transactionId, displayName: String(file.name ?? "receipt").slice(0, 120), mimeType: file.type, size: file.size, contentBase64: file.contentBase64, createdAt: replaced?.createdAt ?? instant, updatedAt: instant, schemaVersion: 3 };
    await runTransaction(database, ["transactions", "receipts", "auditLogs"], "readwrite", async ({ store }) => { const tx = await store("transactions").get(transactionId); if (!tx) throw new Error("Transaction not found."); await store("receipts").put(receipt); tx.receiptIds = [...new Set([...(tx.receiptIds ?? []).filter((value) => value !== replaceId), receipt.id])]; tx.updatedAt = instant; await store("transactions").put(tx); await store("auditLogs").add(createAuditEvent(replaceId ? "receipt.replaced" : "receipt.added", { transactionId, receiptId: receipt.id, mimeType: receipt.mimeType, size: receipt.size })); }); return { ...receipt, contentBase64: undefined };
  }
  async function remove(receiptId) { return runTransaction(database, ["transactions", "receipts", "auditLogs"], "readwrite", async ({ store }) => { const receipt = await store("receipts").get(receiptId); if (!receipt) return false; const tx = await store("transactions").get(receipt.transactionId); if (tx) { tx.receiptIds = (tx.receiptIds ?? []).filter((id) => id !== receiptId); tx.updatedAt = now(); await store("transactions").put(tx); } await store("receipts").delete(receiptId); await store("auditLogs").add(createAuditEvent("receipt.deleted", { transactionId: receipt.transactionId, receiptId })); return true; }); }
  async function preview(receiptId) { const receipt = await runTransaction(database, ["receipts"], "readonly", ({ store }) => store("receipts").get(receiptId)); if (!receipt) throw new Error("Receipt not found."); return { mimeType: receipt.mimeType, displayName: receipt.displayName, contentBase64: receipt.contentBase64 }; }
  return { save, remove, preview };
}
