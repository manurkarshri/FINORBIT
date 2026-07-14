import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_ROUTE, ROUTES, getRouteMetadata, parseRoute, routeHash } from "../src/app/router.js";

test("parses all approved shell routes", () => {
  for (const route of Object.keys(ROUTES)) assert.equal(parseRoute(`#/${route}`), route);
});

test("falls back to transactions for empty and unknown routes", () => {
  assert.equal(parseRoute(""), DEFAULT_ROUTE);
  assert.equal(parseRoute("#/not-a-route"), DEFAULT_ROUTE);
  assert.equal(routeHash("not-a-route"), "#/transactions");
});

test("normalizes route query fragments without changing metadata", () => {
  assert.equal(parseRoute("#/accounts?view=all"), "accounts");
  assert.deepEqual(getRouteMetadata("wealth"), { label: "Wealth", title: "Wealth · FinOrbit" });
  assert.deepEqual(getRouteMetadata("unknown"), ROUTES.transactions);
});
