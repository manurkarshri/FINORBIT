export function assessStorage({ usage = 0, quota = 0, receiptBytes = 0, persisted = false } = {}) {
  const safeUsage = Number.isFinite(usage) && usage >= 0 ? usage : 0; const safeQuota = Number.isFinite(quota) && quota > 0 ? quota : 0;
  const ratio = safeQuota ? safeUsage / safeQuota : null;
  const level = ratio == null ? "unknown" : ratio >= 0.9 ? "critical" : ratio >= 0.75 ? "warning" : "healthy";
  return { usageBytes: safeUsage, quotaBytes: safeQuota, receiptBytes: Number.isFinite(receiptBytes) ? receiptBytes : 0, usageRatio: ratio, level, persisted: Boolean(persisted), recommendation: level === "critical" ? "Export an encrypted backup and remove unneeded receipts before adding more data." : level === "warning" ? "Export a current backup and review receipt storage." : level === "unknown" ? "This browser does not expose a storage estimate. Keep a current encrypted backup." : "Storage capacity is currently within the monitored range." };
}
