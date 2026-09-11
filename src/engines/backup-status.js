export const BACKUP_REMINDER_DAYS = 7;

export function getBackupProtectionStatus(lastExportAt, { now = Date.now(), reminderDays = BACKUP_REMINDER_DAYS } = {}) {
  const exportedAt = lastExportAt ? new Date(lastExportAt).getTime() : NaN;
  if (!Number.isFinite(exportedAt)) return { state: "missing", daysSince: null };
  const daysSince = Math.max(0, Math.floor((now - exportedAt) / 86_400_000));
  return { state: daysSince >= reminderDays ? "overdue" : "current", daysSince };
}
