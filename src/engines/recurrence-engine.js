import { isIntegerPaise, isIsoDate } from "../database/validation.js";

export const RECURRENCE_FREQUENCIES = Object.freeze([
  "daily", "weekly", "fortnightly", "monthly", "every-two-months", "quarterly",
  "half-yearly", "yearly", "custom-interval", "first-working-day", "last-working-day", "specific-dates",
]);
export const TERMINAL_OCCURRENCE_STATUSES = Object.freeze(["paid", "received", "skipped", "auto-posted"]);

const DAY = 86400000;
const parse = (date) => new Date(`${date}T00:00:00.000Z`);
const format = (date) => date.toISOString().slice(0, 10);
const addDays = (date, days) => format(new Date(parse(date).getTime() + days * DAY));
const compare = (a, b) => a.localeCompare(b);
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / DAY);

function daysInMonth(year, month) { return new Date(Date.UTC(year, month + 1, 0)).getUTCDate(); }
function monthDate(anchor, monthOffset, requestedDay) {
  const source = parse(anchor); const monthIndex = source.getUTCMonth() + monthOffset;
  const year = source.getUTCFullYear() + Math.floor(monthIndex / 12); const month = ((monthIndex % 12) + 12) % 12;
  return format(new Date(Date.UTC(year, month, Math.min(requestedDay, daysInMonth(year, month)))));
}
function workingDay(year, month, last) {
  let day = last ? daysInMonth(year, month) : 1;
  while ([0, 6].includes(new Date(Date.UTC(year, month, day)).getUTCDay())) day += last ? -1 : 1;
  return format(new Date(Date.UTC(year, month, day)));
}
function normalizedFrequency(value) {
  return ({ biweekly: "fortnightly", bimonthly: "every-two-months", quarterly: "quarterly", semiannual: "half-yearly", annual: "yearly", custom: "custom-interval" })[value] ?? value;
}

export function validateRecurringRule(rule) {
  const errors = {};
  const frequency = normalizedFrequency(rule?.frequency);
  if (!rule?.id) errors.id = "A stable rule ID is required.";
  if (!RECURRENCE_FREQUENCIES.includes(frequency)) errors.frequency = "Choose a supported recurrence frequency.";
  if (rule?.startDate != null && !isIsoDate(rule.startDate)) errors.startDate = "Enter a valid start date.";
  if (rule?.endDate != null && !isIsoDate(rule.endDate)) errors.endDate = "Enter a valid end date.";
  if (rule?.startDate && rule?.endDate && rule.endDate < rule.startDate) errors.endDate = "End date cannot precede start date.";
  if (!isIntegerPaise(rule?.expectedAmountPaise)) errors.expectedAmountPaise = "Enter a non-negative whole number of paise.";
  if (frequency === "custom-interval" && (!Number.isInteger(rule.intervalDays) || rule.intervalDays < 1)) errors.intervalDays = "Enter a positive whole-day interval.";
  if (frequency === "specific-dates" && (!Array.isArray(rule.specificDates) || !rule.specificDates.length || rule.specificDates.some((date) => !isIsoDate(date)))) errors.specificDates = "Add at least one valid date.";
  return errors;
}

export function generateOccurrenceDates(rule, fromDate, toDate) {
  if (!isIsoDate(fromDate) || !isIsoDate(toDate) || fromDate > toDate) throw new TypeError("Enter a valid occurrence date range.");
  const errors = validateRecurringRule(rule); if (Object.keys(errors).length) throw Object.assign(new TypeError("Recurring rule is invalid."), { errors });
  if (rule.archived || !["active", undefined].includes(rule.status)) return [];
  const lower = [fromDate, rule.startDate].filter(Boolean).sort().at(-1); const upper = [toDate, rule.endDate].filter(Boolean).sort()[0];
  if (lower > upper) return [];
  const frequency = normalizedFrequency(rule.frequency);
  if (frequency === "specific-dates") return [...new Set(rule.specificDates)].filter((date) => date >= lower && date <= upper).sort(compare);
  const anchor = rule.startDate ?? fromDate;
  const dates = [];
  if (["daily", "weekly", "fortnightly", "custom-interval"].includes(frequency)) {
    const interval = ({ daily: 1, weekly: 7, fortnightly: 14 })[frequency] ?? rule.intervalDays;
    const firstOffset = Math.max(0, Math.ceil(daysBetween(anchor, lower) / interval) * interval);
    for (let date = addDays(anchor, firstOffset); date <= upper; date = addDays(date, interval)) dates.push(date);
    return dates;
  }
  const monthInterval = ({ monthly: 1, "every-two-months": 2, quarterly: 3, "half-yearly": 6, yearly: 12, "first-working-day": 1, "last-working-day": 1 })[frequency];
  const anchorDate = parse(anchor); const requestedDay = rule.dayOfMonth ?? rule.expectedDay ?? rule.dueDayOfMonth ?? anchorDate.getUTCDate();
  for (let offset = 0; ; offset += monthInterval) {
    const base = monthDate(anchor, offset, requestedDay); const baseDate = parse(base);
    const date = frequency === "first-working-day" ? workingDay(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), false)
      : frequency === "last-working-day" ? workingDay(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), true) : base;
    if (date > upper) break; if (date >= lower) dates.push(date);
  }
  return dates;
}

export function occurrenceId(ruleId, dueDate) { return `occurrence_${ruleId}_${dueDate.replaceAll("-", "")}`; }

export function createOccurrence(rule, dueDate, { now = () => new Date().toISOString(), today = now().slice(0, 10), dueSoonDays = 3 } = {}) {
  const instant = now();
  return {
    id: occurrenceId(rule.id, dueDate), ruleId: rule.id, kind: rule.kind, name: rule.name,
    dueDate, originalDueDate: dueDate, expectedAmountPaise: rule.expectedAmountPaise,
    actualAmountPaise: null, estimateType: rule.estimateType ?? "fixed", status: classifyOccurrenceStatus(dueDate, today, dueSoonDays),
    autoPost: Boolean(rule.autoPost), sourceAccountId: rule.sourceAccountId, destinationAccountId: rule.destinationAccountId,
    categoryId: rule.categoryId, archived: false, createdAt: instant, updatedAt: instant, schemaVersion: 4,
  };
}

export function classifyOccurrenceStatus(dueDate, today, dueSoonDays = 3) {
  if (!isIsoDate(dueDate) || !isIsoDate(today)) throw new TypeError("Occurrence status requires valid dates.");
  const distance = daysBetween(today, dueDate);
  if (distance < 0) return "overdue"; if (distance === 0) return "due-today"; if (distance <= dueSoonDays) return "due-soon"; return "scheduled";
}
