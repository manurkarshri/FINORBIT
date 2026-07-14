import { createApp } from "./app.js";
import { createRouter } from "./router.js";
import { readThemePreference, setState } from "./state.js";
import { createErrorMessage } from "../components/shell.js";

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

async function bootstrap() {
  registerGlobalErrorHandling();
  registerSkipLink();
  setState({ themePreference: readThemePreference() });
  registerConnectivity();

  const root = document.querySelector("#app");
  const header = document.querySelector("#app-header");
  const navigation = document.querySelector("#primary-navigation");
  const main = document.querySelector("#main-content");
  const statusRegion = document.querySelector("#status-region");
  const liveRegion = document.querySelector("#live-region");
  if (![root, header, navigation, main, statusRegion, liveRegion].every(Boolean)) throw new Error("Required shell element is missing.");

  const app = createApp({ root, header, navigation, main, statusRegion, liveRegion });
  const router = createRouter({ onRouteChange: (route, options) => app.showRoute(route, options) });
  app.start();
  router.start();
  await registerServiceWorker();
}

bootstrap().catch((error) => reportError("Startup failed", error));
