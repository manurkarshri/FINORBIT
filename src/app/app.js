import { getRouteMetadata } from "./router.js";
import { getState, setState, subscribe, writeThemePreference } from "./state.js";
import { createEmptyState, createHeader, createNavigation, createStatusBanner } from "../components/shell.js";

const ROUTE_CONTENT = Object.freeze({
  transactions: {
    eyebrow: "Your daily money flow",
    title: "Transactions",
    symbol: "↗",
    emptyTitle: "Your central money workflow starts here",
    description: "A later milestone will add fast, accurate transaction entry and history. This foundation currently contains no financial records.",
    note: "Next here: expenses, income, transfers and other verified transaction types.",
  },
  accounts: {
    eyebrow: "Where money lives",
    title: "Accounts",
    symbol: "◎",
    emptyTitle: "A clear home for every account",
    description: "Bank accounts, cash, cards and loans will be introduced through guided setup in later milestones.",
    note: "No account balances or identifiers are stored in this foundation.",
  },
  plan: {
    eyebrow: "Make tomorrow visible",
    title: "Plan",
    symbol: "◇",
    emptyTitle: "Plan with facts, not invented forecasts",
    description: "Recurring commitments, budgets, goals and forecasts will appear only after their underlying data and rules are implemented.",
    note: "This screen intentionally shows no sample financial figures.",
  },
  wealth: {
    eyebrow: "Understand the whole picture",
    title: "Wealth",
    symbol: "◌",
    emptyTitle: "Connect assets and liabilities safely",
    description: "Net worth, investments and physical assets belong to later, calculation-tested milestones.",
    note: "No wealth calculation engine exists yet.",
  },
  more: {
    eyebrow: "Controls and tools",
    title: "More",
    symbol: "•••",
    emptyTitle: "Essential tools will arrive deliberately",
    description: "Reports, backup, categories, security and settings will be added in their approved milestones.",
    note: "Only the non-sensitive appearance preference is available today.",
  },
});

export function createApp({ root, header, navigation, main, statusRegion, liveRegion, securityCenter, onboardingView, entityService }) {
  let latestState = getState();

  function applyTheme(preference) {
    document.documentElement.dataset.theme = preference;
    document.documentElement.style.colorScheme = preference === "system" ? "light dark" : preference;
  }

  function renderHeader() {
    header.replaceChildren(createHeader({
      themePreference: latestState.themePreference,
      onThemeChange(preference) {
        writeThemePreference(preference);
        setState({ themePreference: preference });
        liveRegion.textContent = `${preference[0].toUpperCase()}${preference.slice(1)} appearance selected.`;
      },
    }));
  }

  function renderNavigation() {
    navigation.replaceChildren(createNavigation(latestState.activeRoute));
  }

  function renderStatus() {
    const banners = [];
    if (!latestState.online) banners.push(createStatusBanner({ tone: "warning", message: "You’re offline. The FinOrbit shell remains available." }));
    if (latestState.serviceWorkerUpdate) {
      banners.push(createStatusBanner({
        message: "A newer FinOrbit shell is ready.",
        actionLabel: "Update now",
        onAction: latestState.serviceWorkerUpdate,
      }));
    }
    statusRegion.replaceChildren(...banners);
  }

  function renderRoute({ focus = false } = {}) {
    const content = ROUTE_CONTENT[latestState.activeRoute] ?? ROUTE_CONTENT.transactions;
    const heading = document.createElement("header");
    heading.className = "route-heading";
    const eyebrow = document.createElement("p");
    eyebrow.className = "route-heading__eyebrow";
    eyebrow.textContent = content.eyebrow;
    const title = document.createElement("h1");
    title.className = "route-heading__title";
    title.tabIndex = -1;
    title.textContent = content.title;
    heading.append(eyebrow, title);
    main.replaceChildren(heading, createEmptyState({
      symbol: content.symbol,
      title: content.emptyTitle,
      description: content.description,
      note: content.note,
    }));
    if (["accounts", "plan", "wealth"].includes(latestState.activeRoute) && entityService) import("../modules/entities/entity-manager.js").then(({ createEntityManager }) => main.append(createEntityManager(latestState.activeRoute, entityService)));
    if (latestState.activeRoute === "more" && securityCenter) main.append(securityCenter);
    if (focus) title.focus({ preventScroll: false });
  }

  function render({ focusRoute = false } = {}) {
    applyTheme(latestState.themePreference);
    renderHeader();
    renderNavigation();
    renderRoute({ focus: focusRoute });
    renderStatus();
    root.dataset.appStatus = "ready";
  }

  subscribe((nextState) => {
    const routeChanged = nextState.activeRoute !== latestState.activeRoute;
    const themeChanged = nextState.themePreference !== latestState.themePreference;
    latestState = nextState;
    if (themeChanged) applyTheme(latestState.themePreference);
    renderHeader();
    renderNavigation();
    if (routeChanged) renderRoute({ focus: true });
    renderStatus();
  });

  return {
    start() { render(); },
    showOnboarding() { main.replaceChildren(onboardingView.element); onboardingView.start(); },
    showRoute(route, { focus = true } = {}) {
      document.title = getRouteMetadata(route).title;
      setState({ activeRoute: route });
      if (!focus) renderRoute({ focus: false });
    },
  };
}
