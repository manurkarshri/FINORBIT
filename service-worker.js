const CACHE_VERSION = "finorbit-shell-v18";
const SCOPE_URL = new URL(self.registration.scope);
const toScopeUrl = (path) => new URL(path, SCOPE_URL).href;

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/icons/favicon.svg",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./src/app/bootstrap.js",
  "./src/app/app.js",
  "./src/app/router.js",
  "./src/app/state.js",
  "./src/components/shell.js",
  "./src/database/connection.js",
  "./src/database/errors.js",
  "./src/database/migrations.js",
  "./src/database/requests.js",
  "./src/database/schema.js",
  "./src/database/settings.js",
  "./src/database/transaction.js",
  "./src/database/validation.js",
  "./src/database/audit.js",
  "./src/modules/security/security-center.js",
  "./src/modules/onboarding/onboarding.js",
  "./src/modules/entities/entity-manager.js",
  "./src/modules/transactions/transaction-center.js",
  "./src/modules/wealth/wealth-center.js",
  "./src/modules/recurring/recurring-center.js",
  "./src/modules/budgets/household-center.js",
  "./src/modules/investments/portfolio-center.js",
  "./src/modules/assets/physical-assets-center.js",
  "./src/modules/planning/planning-center.js",
  "./src/modules/reports/reports-center.js",
  "./src/modules/reconciliation/reconciliation-center.js",
  "./src/engines/posting-engine.js",
  "./src/engines/wealth-engine.js",
  "./src/engines/valuation-engine.js",
  "./src/engines/recurrence-engine.js",
  "./src/engines/budget-engine.js",
  "./src/engines/portfolio-engine.js",
  "./src/engines/forecast-engine.js",
  "./src/engines/report-engine.js",
  "./src/engines/export-engine.js",
  "./src/engines/integrity-engine.js",
  "./src/engines/storage-engine.js",
  "./src/security/coordination.js",
  "./src/security/crypto.js",
  "./src/security/lock-manager.js",
  "./src/services/backup-service.js",
  "./src/services/restore-service.js",
  "./src/services/reset-service.js",
  "./src/services/entity-service.js",
  "./src/services/onboarding-service.js",
  "./src/services/transaction-service.js",
  "./src/services/receipt-service.js",
  "./src/services/wealth-service.js",
  "./src/services/recurring-service.js",
  "./src/services/household-service.js",
  "./src/services/portfolio-service.js",
  "./src/services/market-data-service.js",
  "./src/services/provider-adapters.js",
  "./src/services/physical-asset-service.js",
  "./src/services/planning-service.js",
  "./src/services/report-service.js",
  "./src/services/reconciliation-service.js",
  "./src/services/storage-health-service.js",
  "./src/styles/tokens.css",
  "./src/styles/base.css",
  "./src/styles/layout.css",
  "./src/styles/components.css",
  "./src/styles/utilities.css"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL_ASSETS.map(toScopeUrl))));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("finorbit-shell-") && key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE_URL.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(toScopeUrl("./index.html"))));
    return;
  }

  const allowed = new Set(SHELL_ASSETS.map((asset) => new URL(asset, SCOPE_URL).pathname));
  if (!allowed.has(url.pathname)) return;
  event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
});
