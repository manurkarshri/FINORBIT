export const DEFAULT_ROUTE = "transactions";

export const ROUTES = Object.freeze({
  transactions: { label: "Transactions", title: "Transactions · FinOrbit" },
  accounts: { label: "Accounts", title: "Accounts · FinOrbit" },
  plan: { label: "Plan", title: "Plan · FinOrbit" },
  wealth: { label: "Wealth", title: "Wealth · FinOrbit" },
  more: { label: "More", title: "More · FinOrbit" },
  settings: { label: "Settings", title: "Settings · FinOrbit" },
});

export function parseRoute(hash = "") {
  const route = hash.replace(/^#\/?/, "").split(/[/?]/, 1)[0].toLowerCase();
  return Object.hasOwn(ROUTES, route) ? route : DEFAULT_ROUTE;
}

export function routeHash(route) {
  return `#/${Object.hasOwn(ROUTES, route) ? route : DEFAULT_ROUTE}`;
}

export function getRouteMetadata(route) {
  return ROUTES[Object.hasOwn(ROUTES, route) ? route : DEFAULT_ROUTE];
}

export function createRouter({ onRouteChange, location = window.location, windowRef = window }) {
  let started = false;

  function navigateFromLocation({ focus = true } = {}) {
    const route = parseRoute(location.hash);
    const canonicalHash = routeHash(route);
    if (location.hash !== canonicalHash) {
      location.replace(canonicalHash);
      return;
    }
    document.title = getRouteMetadata(route).title;
    onRouteChange(route, { focus });
  }

  return {
    start() {
      if (started) return;
      started = true;
      windowRef.addEventListener("hashchange", () => navigateFromLocation({ focus: true }));
      navigateFromLocation({ focus: false });
    },
    go(route) {
      const nextHash = routeHash(route);
      if (location.hash === nextHash) navigateFromLocation({ focus: true });
      else location.hash = nextHash;
    },
  };
}
