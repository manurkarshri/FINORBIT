import test from "node:test";
import assert from "node:assert/strict";
import { assessStorage } from "../src/engines/storage-engine.js";

test("storage pressure levels are deterministic and include recovery advice", () => {
  assert.equal(assessStorage({ usage: 74, quota: 100 }).level, "healthy");
  assert.equal(assessStorage({ usage: 75, quota: 100 }).level, "warning");
  const critical = assessStorage({ usage: 90, quota: 100, receiptBytes: 20, persisted: true });
  assert.equal(critical.level, "critical"); assert.equal(critical.persisted, true); assert.match(critical.recommendation, /backup/i);
});
test("unavailable or malformed estimates fail safely", () => { const result = assessStorage({ usage: NaN, quota: 0 }); assert.equal(result.level, "unknown"); assert.equal(result.usageRatio, null); });
