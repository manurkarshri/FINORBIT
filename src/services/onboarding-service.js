import { createOpaqueId } from "../database/validation.js";
import { runTransaction } from "../database/transaction.js";
import { createAuditEvent } from "../database/audit.js";

export const ONBOARDING_STAGES = Object.freeze([
  "welcome", "profile", "accounts", "credit-cards", "loans", "income-sources", "commitments",
  "investments", "emergency-fund", "opening-summary", "review",
]);

function currentStage(progress) {
  if (!progress) return 0;
  if (progress.completed) return ONBOARDING_STAGES.length - 1;
  const legacyStages = [0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 9, 10];
  return progress.flowVersion === 2 ? progress.stage : legacyStages[progress.stage] ?? 0;
}

export function createOnboardingService(database, { now = () => new Date().toISOString() } = {}) {
  async function read() {
    const [progress, profile] = await runTransaction(database, ["settings", "profiles"], "readonly", async ({ store }) => [await store("settings").get("onboarding.progress"), (await store("profiles").getAll())[0]]);
    return { stage: currentStage(progress), completed: Boolean(progress?.completed), drafts: progress?.drafts ?? {}, profile: profile ?? null };
  }
  async function saveProgress({ stage, drafts = {} }) {
    if (!Number.isInteger(stage) || stage < 0 || stage >= ONBOARDING_STAGES.length) throw new Error("Invalid onboarding stage.");
    const instant = now();
    await runTransaction(database, ["settings"], "readwrite", ({ store }) => store("settings").put({ id: "onboarding.progress", stage, drafts, completed: false, flowVersion: 2, createdAt: instant, updatedAt: instant, schemaVersion: 2 }));
  }
  async function saveProfile(input) {
    const errors = {};
    if (!input.displayName?.trim()) errors.displayName = "Enter a name or nickname.";
    if (input.currency !== "INR") errors.currency = "Version 1 supports INR only.";
    if (!Number.isInteger(input.financialYearStartMonth) || input.financialYearStartMonth < 1 || input.financialYearStartMonth > 12) errors.financialYearStartMonth = "Choose a valid start month.";
    if (Object.keys(errors).length) return { ok: false, errors };
    const instant = now(); const current = await runTransaction(database, ["profiles"], "readonly", ({ store }) => store("profiles").getAll()).then((items) => items[0]);
    const profile = { ...input, id: current?.id ?? createOpaqueId(), locale: input.locale ?? "en-IN", currency: "INR", setupCompleted: false, createdAt: current?.createdAt ?? instant, updatedAt: instant, archived: false, status: "active", nameKey: input.displayName.trim().toLocaleLowerCase("en-IN"), schemaVersion: 2 };
    await runTransaction(database, ["profiles", "auditLogs"], "readwrite", async ({ store }) => { await store("profiles").put(profile); await store("auditLogs").add(createAuditEvent(current ? "entity.edited" : "entity.created", { entityType: "profile", entityId: profile.id })); });
    return { ok: true, profile };
  }
  async function complete() {
    const instant = now();
    const { profile, hasAccount } = await runTransaction(database, ["profiles", "accounts"], "readonly", async ({ store }) => { const profile = (await store("profiles").getAll())[0]; const accounts = await store("accounts").getAll(); return { profile, hasAccount: accounts.some((account) => !account.archived && account.status === "active") }; });
    if (!profile?.displayName) throw new Error("Complete the profile before finishing setup.");
    if (!hasAccount) throw new Error("Add at least one active money source before finishing setup.");
    return runTransaction(database, ["settings", "profiles", "auditLogs"], "readwrite", async ({ store }) => {
      profile.setupCompleted = true; profile.setupCompletedAt = instant; profile.updatedAt = instant; await store("profiles").put(profile);
      await store("settings").put({ id: "onboarding.progress", stage: ONBOARDING_STAGES.length - 1, drafts: {}, completed: true, flowVersion: 2, completedAt: instant, createdAt: instant, updatedAt: instant, schemaVersion: 2 });
      await store("auditLogs").add(createAuditEvent("onboarding.completed", { profileId: profile.id })); return profile;
    });
  }
  return { read, saveProgress, saveProfile, complete };
}
