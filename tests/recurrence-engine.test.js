import test from "node:test";
import assert from "node:assert/strict";
import { classifyOccurrenceStatus, createOccurrence, generateOccurrenceDates, occurrenceId, validateRecurringRule } from "../src/engines/recurrence-engine.js";

const rule = { id: "rule_salary", name: "Salary", kind: "income", expectedAmountPaise: 100000, estimateType: "fixed", frequency: "monthly", startDate: "2026-01-31", status: "active" };

test("monthly recurrence clamps to month end without drifting", () => {
  assert.deepEqual(generateOccurrenceDates(rule, "2026-01-01", "2026-04-30"), ["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
});

test("interval frequencies remain anchored when generation starts later", () => {
  assert.deepEqual(generateOccurrenceDates({ ...rule, frequency: "fortnightly", startDate: "2026-01-01" }, "2026-01-20", "2026-02-15"), ["2026-01-29", "2026-02-12"]);
  assert.deepEqual(generateOccurrenceDates({ ...rule, frequency: "custom-interval", intervalDays: 10, startDate: "2026-01-01" }, "2026-01-20", "2026-02-01"), ["2026-01-21", "2026-01-31"]);
});

test("working-day and specific-date schedules are deterministic", () => {
  assert.deepEqual(generateOccurrenceDates({ ...rule, frequency: "first-working-day", startDate: "2026-08-01" }, "2026-08-01", "2026-09-30"), ["2026-08-03", "2026-09-01"]);
  assert.deepEqual(generateOccurrenceDates({ ...rule, frequency: "last-working-day", startDate: "2026-01-01" }, "2026-01-01", "2026-02-28"), ["2026-01-30", "2026-02-27"]);
  assert.deepEqual(generateOccurrenceDates({ ...rule, frequency: "specific-dates", specificDates: ["2026-04-01", "2026-03-01", "2026-04-01"] }, "2026-03-15", "2026-04-30"), ["2026-04-01"]);
});

test("paused, archived, start and end boundaries are honored", () => {
  assert.deepEqual(generateOccurrenceDates({ ...rule, status: "inactive" }, "2026-01-01", "2026-12-31"), []);
  assert.deepEqual(generateOccurrenceDates({ ...rule, endDate: "2026-03-15" }, "2026-02-01", "2026-05-01"), ["2026-02-28"]);
});

test("occurrence identity and status classification are stable", () => {
  assert.equal(occurrenceId("rule_salary", "2026-09-05"), "occurrence_rule_salary_20260905");
  assert.deepEqual(["2026-09-04", "2026-09-05", "2026-09-07", "2026-09-10"].map((date) => classifyOccurrenceStatus(date, "2026-09-05")), ["overdue", "due-today", "due-soon", "scheduled"]);
  const occurrence = createOccurrence(rule, "2026-09-05", { now: () => "2026-09-05T10:00:00.000Z" });
  assert.equal(occurrence.status, "due-today"); assert.equal(occurrence.actualAmountPaise, null);
});

test("invalid custom and variable rule inputs report field errors", () => {
  assert.ok(validateRecurringRule({ ...rule, frequency: "custom-interval", intervalDays: 0 }).intervalDays);
  assert.ok(validateRecurringRule({ ...rule, expectedAmountPaise: 1.5 }).expectedAmountPaise);
});
