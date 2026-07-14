# Milestone 1 PWA Foundation

## Run locally

Use Node.js 20 or newer. No dependency installation or build is required.

```sh
pnpm install --frozen-lockfile
pnpm run serve
```

Open `http://127.0.0.1:4173`. A service worker requires localhost or HTTPS; opening `index.html` directly from disk is unsupported.

## Validate

```sh
pnpm run check
```

This runs static validation, local-link and lightweight secret checks, manifest/icon checks, excluded-IndexedDB checks, and Node unit tests. Browser checks remain a required manual/automation-assisted milestone gate.

## Routes and themes

The default and fallback route is `#/transactions`. Accounts, Plan, Wealth, and More use their corresponding hashes. Navigation is client-side and compatible with GitHub Pages because route state stays after `#`.

Appearance supports system, light, and dark preferences. Only the selected preference is stored in `localStorage` under `finorbit.theme`; system colour changes remain effective when system mode is selected.

## Install the PWA

Serve through localhost or deploy through HTTPS, visit once online, and use the browser’s installation action when available. The manifest starts at Transactions and exposes only honest Transactions and Accounts shell shortcuts. No transaction-entry shortcut exists.

## Service-worker updates and cache invalidation

`CACHE_VERSION` in `service-worker.js` names the static shell cache (currently `finorbit-shell-v2`). Any shell asset change must increment it. Installation precaches the explicit `SHELL_ASSETS` allowlist. Activation deletes older `finorbit-shell-*` caches. A waiting worker is not forced over the current session; the UI offers **Update now**, sends `SKIP_WAITING`, then reloads once after controller change.

Cache Storage never contains financial data, IndexedDB records, API keys, market responses, or arbitrary same-origin requests. Navigation is online-first with cached `index.html` fallback. Only allowlisted static paths receive cache-first handling.

## Offline testing

1. Start the local server and load FinOrbit once online.
2. Confirm the service worker controls the page after reload.
3. Switch the browser network to offline.
4. Reload each of the five hash routes; the shell should render and the unobtrusive offline banner should appear.
5. Restore the network and confirm the banner clears.

Browser `navigator.onLine` is treated only as a connectivity hint.

## Accessibility checks

Verify the skip link reaches `main`, all navigation and theme controls work by keyboard, focus is visible, the active route uses `aria-current`, route headings receive focus after navigation, live status messages are announced, landmarks are named, touch targets remain comfortable, and reduced-motion settings disable nonessential animation.

Test at narrow mobile and wide desktop sizes, zoom to 200%, and confirm no horizontal overflow. Check light, dark, and system themes for contrast.

## GitHub Pages

The Pages workflow runs only for pushes to reviewed `main` (or an explicit manual dispatch), validates the source, uploads the static repository, and deploys with official Pages actions. Configure repository **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

All runtime paths are relative to the document/service-worker scope, so the repository subpath `/FINORBIT/` is preserved. Pull-request branches are validated but never deployed as production.

## Supported browser assumptions

The baseline is current stable Chromium, Firefox, and Safari with ES modules, CSS custom properties, Indexed-free shell JavaScript, and hash navigation. PWA installation UX is strongest in Chromium. Safari and Firefox may support offline service-worker behavior without presenting the same install experience.
