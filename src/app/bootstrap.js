import { createApp } from "./app.js";
import { createRouter } from "./router.js";
import { readThemePreference, setState } from "./state.js";
import { createErrorMessage } from "../components/shell.js";
import { ConnectionManager } from "../database/connection.js";
import { migrateThemePreference } from "../database/settings.js";
import { createCoordination } from "../security/coordination.js";
import { createLockManager } from "../security/lock-manager.js";
import { createSecurityCenter } from "../modules/security/security-center.js";
import { getSetting } from "../database/settings.js";
import { runTransaction } from "../database/transaction.js";
import { createCredential } from "../security/crypto.js";
import { createBackup } from "../services/backup-service.js";
import { parseBackup, restoreBackup } from "../services/restore-service.js";
import { resetApplicationData } from "../services/reset-service.js";
import { createEntityService } from "../services/entity-service.js";
import { createOnboardingService } from "../services/onboarding-service.js";
import { createOnboarding } from "../modules/onboarding/onboarding.js";
import { createTransactionService, ensureDefaultCategories } from "../services/transaction-service.js";
import { createReceiptService } from "../services/receipt-service.js";
import { createTransactionCenter } from "../modules/transactions/transaction-center.js";
import { createWealthService } from "../services/wealth-service.js";
import { createWealthCenter } from "../modules/wealth/wealth-center.js";
import { createRecurringService } from "../services/recurring-service.js";
import { createRecurringCenter } from "../modules/recurring/recurring-center.js";
import { createHouseholdService } from "../services/household-service.js";
import { createHouseholdCenter } from "../modules/budgets/household-center.js";
import { createPortfolioService } from "../services/portfolio-service.js";
import { createMarketDataService } from "../services/market-data-service.js";
import { createPortfolioCenter } from "../modules/investments/portfolio-center.js";
import { createPhysicalAssetService } from "../services/physical-asset-service.js";
import { createPhysicalAssetsCenter } from "../modules/assets/physical-assets-center.js";
import { createPlanningService } from "../services/planning-service.js";
import { createPlanningCenter } from "../modules/planning/planning-center.js";
import { createReportService } from "../services/report-service.js";
import { createReportsCenter } from "../modules/reports/reports-center.js";
import { createReconciliationService } from "../services/reconciliation-service.js";
import { createReconciliationCenter } from "../modules/reconciliation/reconciliation-center.js";
import { createStorageHealthService } from "../services/storage-health-service.js";

const safeMessage = "Reload the page. If the problem continues, clear only FinOrbit’s cached site files and try again.";

function reportError(label, error) {
  console.error(`[FinOrbit] ${label}`, error);
  const main = document.querySelector("#main-content");
  if (!main) return;
  const errorView = createErrorMessage(safeMessage);
  const reload = errorView.querySelector("button");
  reload?.addEventListener("click", () => window.location.reload());
  main.replaceChildren(errorView);
  document.querySelector("#app")?.setAttribute("data-app-status", "error");
}

function registerGlobalErrorHandling() {
  window.addEventListener("error", (event) => reportError("Unexpected application error", event.error ?? event.message));
  window.addEventListener("unhandledrejection", (event) => reportError("Unhandled asynchronous error", event.reason));
}

function registerConnectivity() {
  const update = () => setState({ online: navigator.onLine });
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
}

function registerSkipLink() {
  const skipLink = document.querySelector(".skip-link");
  const main = document.querySelector("#main-content");
  skipLink?.addEventListener("click", (event) => {
    event.preventDefault();
    main?.focus({ preventScroll: false });
    main?.scrollIntoView({ block: "start" });
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
  try {
    const registration = await navigator.serviceWorker.register("./service-worker.js", { scope: "./" });
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    function offerUpdate(worker) {
      if (!worker || !navigator.serviceWorker.controller) return;
      setState({ serviceWorkerUpdate: () => worker.postMessage({ type: "SKIP_WAITING" }) });
    }

    offerUpdate(registration.waiting);
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed") offerUpdate(worker);
      });
    });
  } catch (error) {
    console.warn("[FinOrbit] Service worker registration was unavailable.", error);
  }
}

function createUnlockDialog(lockManager, mode) {
  const dialog = document.createElement("dialog");
  dialog.className = "lock-dialog";
  const form = document.createElement("form");
  form.method = "dialog";
  const title = document.createElement("h1"); title.textContent = "Unlock FinOrbit";
  const guidance = document.createElement("p"); guidance.textContent = `Enter your ${mode}. FinOrbit cannot recover a forgotten credential.`;
  const input = document.createElement("input"); input.type = "password"; input.required = true; input.autocomplete = "current-password"; input.setAttribute("aria-label", mode);
  const status = document.createElement("p"); status.setAttribute("aria-live", "polite");
  const button = document.createElement("button"); button.type = "submit"; button.className = "button"; button.textContent = "Unlock";
  form.append(title, guidance, input, button, status); dialog.append(form); document.body.append(dialog);
  form.addEventListener("submit", async (event) => { event.preventDefault(); button.disabled = true; const valid = await lockManager.unlock(input.value); input.value = ""; button.disabled = false; if (valid) dialog.close(); else status.textContent = "That credential did not match. Try again after a short delay."; });
  dialog.addEventListener("cancel", (event) => event.preventDefault());
  return { show() { if (!dialog.open) dialog.showModal(); input.focus(); } };
}

async function bootstrap() {
  registerGlobalErrorHandling();
  registerSkipLink();
  const databaseManager = new ConnectionManager({ onBlocked: () => reportError("Database upgrade blocked", new Error("Close other FinOrbit tabs and reload.")) });
  const database = await databaseManager.open();
  await ensureDefaultCategories(database);
  const migratedTheme = await migrateThemePreference(database);
  setState({ themePreference: migratedTheme ?? readThemePreference() });
  registerConnectivity();

  const root = document.querySelector("#app");
  const header = document.querySelector("#app-header");
  const navigation = document.querySelector("#primary-navigation");
  const main = document.querySelector("#main-content");
  const statusRegion = document.querySelector("#status-region");
  const liveRegion = document.querySelector("#live-region");
  if (![root, header, navigation, main, statusRegion, liveRegion].every(Boolean)) throw new Error("Required shell element is missing.");

  const coordination = createCoordination();
  const credential = await getSetting(database, "security.credential");
  let unlockDialog;
  const lockManager = credential ? createLockManager({ credential, coordination, onChange: ({ locked }) => { root.toggleAttribute("data-locked", locked); if (locked) unlockDialog?.show(); } }) : null;
  if (lockManager) {
    unlockDialog = createUnlockDialog(lockManager, credential.mode);
    root.toggleAttribute("data-locked", true);
    unlockDialog.show();
    document.addEventListener("visibilitychange", () => lockManager.visibilityChanged(document.hidden));
    for (const eventName of ["pointerdown", "keydown"]) document.addEventListener(eventName, () => lockManager.activity(), { passive: true });
  }
  const storageHealth = createStorageHealthService(database);
  const securityCenter = createSecurityCenter({
    onSetup: async (secret, mode) => {
      const next = await createCredential(secret, mode);
      await runTransaction(database, ["settings", "auditLogs"], "readwrite", async ({ store }) => {
        await store("settings").put(next);
        const instant = new Date().toISOString();
        await store("auditLogs").add({ id: crypto.randomUUID(), type: "security.setup", detail: { mode }, createdAt: instant, updatedAt: instant, schemaVersion: 1 });
      });
    },
    onLock: () => lockManager?.lock("manual"),
    onStandardBackup: () => createBackup(database),
    onEncryptedBackup: (secret) => createBackup(database, { encrypted: true, secret }),
    onRestorePreview: async (file) => {
      const secret = file.size ? prompt("If this backup is encrypted, enter its passphrase; otherwise leave blank.") ?? undefined : undefined;
      const { payload, preview } = await parseBackup(await file.text(), { secret });
      const lockNotice = preview.restoresAppLock
        ? " This backup contains an app-lock configuration and will replace the current lock configuration."
        : " This backup does not contain an app-lock configuration; the current lock configuration will be removed.";
      if (confirm(`Validated backup from ${preview.exportedAt ?? "unknown date"}.${lockNotice} Replace all local data?`)) await restoreBackup(database, payload);
      return `Backup validated: ${Object.values(preview.counts).reduce((sum, count) => sum + count, 0)} records.${lockNotice}`;
    },
    onReset: async () => { await resetApplicationData({ manager: databaseManager, coordination }); window.location.reload(); },
    onStorageStatus: () => storageHealth.status(),
    onPersistStorage: () => storageHealth.requestPersistence(),
    onDatabaseHealth: () => storageHealth.databaseHealth(),
  });
  const entityService = createEntityService(database);
  const onboardingService = createOnboardingService(database);
  let app;
  const leaveOnboarding = () => { if (window.location.hash === "#/accounts") app.showRoute("accounts"); else window.location.hash = "#/accounts"; };
  const onboardingView = createOnboarding({ onboarding: onboardingService, entities: entityService, onExit: leaveOnboarding, onComplete: leaveOnboarding });
  const transactionService = createTransactionService(database);
  const receiptService = createReceiptService(database);
  const transactionCenter = createTransactionCenter({ database, transactions: transactionService, receipts: receiptService, liveRegion });
  const wealthService = createWealthService(database);
  const wealthCenter = createWealthCenter({ wealth: wealthService, entities: entityService, liveRegion });
  const portfolioCenter = createPortfolioCenter({ portfolio: createPortfolioService(database), marketData: createMarketDataService(database, { wealth: wealthService, adapters: {} }), liveRegion });
  const physicalAssetsCenter = createPhysicalAssetsCenter({ assets: createPhysicalAssetService(database), entities: entityService, liveRegion });
  const recurringCenter = createRecurringCenter({ recurring: createRecurringService(database, { transactions: transactionService }), entities: entityService, transactions: transactionService, liveRegion });
  const householdCenter = createHouseholdCenter({ household: createHouseholdService(database), liveRegion });
  const planningCenter = createPlanningCenter({ planning: createPlanningService(database, { transactions: transactionService, recurring: createRecurringService(database, { transactions: transactionService }) }), liveRegion });
  const reportsCenter = createReportsCenter({ reports: createReportService(database), liveRegion });
  const reconciliationCenter = createReconciliationCenter({ reconciliation: createReconciliationService(database, { transactions: transactionService }), liveRegion });
  app = createApp({ root, header, navigation, main, statusRegion, liveRegion, securityCenter, onboardingView, entityService, transactionCenter, wealthCenter, portfolioCenter, physicalAssetsCenter, recurringCenter, householdCenter, planningCenter, reportsCenter, reconciliationCenter });
  const router = createRouter({ onRouteChange: (route, options) => app.showRoute(route, options) });
  app.start();
  router.start();
  if (!(await onboardingService.read()).completed) app.showOnboarding();
  await registerServiceWorker();
}

bootstrap().catch((error) => reportError("Startup failed", error));
