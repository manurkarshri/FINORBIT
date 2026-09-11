import test from "node:test";
import assert from "node:assert/strict";
import { getBackupProtectionStatus } from "../src/engines/backup-status.js";

const day = 86_400_000;
const now = Date.parse("2026-09-11T12:00:00.000Z");

test("backup reminder distinguishes missing, current, and seven-day-old backups", () => {
  assert.deepEqual(getBackupProtectionStatus(undefined, { now }), { state: "missing", daysSince: null });
  assert.deepEqual(getBackupProtectionStatus(new Date(now - 6 * day).toISOString(), { now }), { state: "current", daysSince: 6 });
  assert.deepEqual(getBackupProtectionStatus(new Date(now - 7 * day).toISOString(), { now }), { state: "overdue", daysSince: 7 });
});

test("future device-clock values do not produce a negative age", () => {
  assert.deepEqual(getBackupProtectionStatus(new Date(now + day).toISOString(), { now }), { state: "current", daysSince: 0 });
});
