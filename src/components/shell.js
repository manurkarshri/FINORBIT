import { ROUTES } from "../app/router.js";
import { THEMES } from "../app/state.js";

const ICONS = {
  transactions: "↗",
  accounts: "◎",
  plan: "◇",
  wealth: "◌",
  more: "•••",
};

function element(tag, attributes = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === "className") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (value !== undefined && value !== null) node.setAttribute(key, value);
  });
  for (const child of children) node.append(child);
  return node;
}

export function createHeader({ themePreference, onThemeChange }) {
  const brandMark = element("img", { className: "brand__mark", src: "./assets/icons/icon-192.png", alt: "" });
  const brand = element("a", { className: "brand", href: "#/transactions", "aria-label": "FinOrbit home" }, [
    brandMark,
    element("span", { className: "brand__copy" }, [
      element("strong", { text: "FinOrbit" }),
      element("small", { text: "Your Complete Financial World" }),
    ]),
  ]);

  const selector = element("select", { className: "theme-selector__control", "aria-label": "Appearance" });
  for (const theme of THEMES) {
    const option = element("option", { value: theme, text: `${theme[0].toUpperCase()}${theme.slice(1)} theme` });
    option.selected = theme === themePreference;
    selector.append(option);
  }
  selector.addEventListener("change", () => onThemeChange(selector.value));

  return element("div", { className: "app-header__inner" }, [
    brand,
    element("label", { className: "theme-selector" }, [
      element("span", { className: "theme-selector__label", text: "Appearance" }),
      selector,
    ]),
  ]);
}

export function createNavigation(activeRoute) {
  const list = element("ul", { className: "primary-navigation__list" });
  Object.entries(ROUTES).forEach(([route, metadata]) => {
    const link = element("a", {
      className: "primary-navigation__link",
      href: `#/${route}`,
      "aria-current": route === activeRoute ? "page" : null,
    }, [
      element("span", { className: "primary-navigation__icon", "aria-hidden": "true", text: ICONS[route] }),
      element("span", { text: metadata.label }),
    ]);
    list.append(element("li", {}, [link]));
  });
  return list;
}

export function createRouteHeading(title, eyebrow) {
  return element("header", { className: "route-heading" }, [
    element("p", { className: "route-heading__eyebrow", text: eyebrow }),
    element("h1", { className: "route-heading__title", text: title, tabindex: "-1" }),
  ]);
}

export function createEmptyState({ symbol, title, description, note }) {
  return element("section", { className: "empty-state", "aria-labelledby": "empty-state-title" }, [
    element("div", { className: "empty-state__visual", "aria-hidden": "true" }, [
      element("span", { className: "empty-state__orbit" }),
      element("span", { className: "empty-state__symbol", text: symbol }),
    ]),
    element("div", { className: "empty-state__content" }, [
      element("p", { className: "empty-state__kicker", text: "Foundation ready" }),
      element("h2", { id: "empty-state-title", text: title }),
      element("p", { text: description }),
      element("p", { className: "empty-state__note", text: note }),
    ]),
  ]);
}

export function createStatusBanner({ tone = "info", message, actionLabel, onAction }) {
  const children = [element("p", { text: message })];
  if (actionLabel && onAction) {
    const button = element("button", { className: "button button--quiet", type: "button", text: actionLabel });
    button.addEventListener("click", onAction);
    children.push(button);
  }
  return element("div", { className: `status-banner status-banner--${tone}`, role: tone === "danger" ? "alert" : "status" }, children);
}

export function createErrorMessage(message) {
  return element("section", { className: "error-state", role: "alert" }, [
    element("p", { className: "error-state__label", text: "FinOrbit needs a fresh start" }),
    element("h1", { text: "The application shell could not load." }),
    element("p", { text: message }),
    element("button", { className: "button", type: "button", text: "Reload FinOrbit" }),
  ]);
}
