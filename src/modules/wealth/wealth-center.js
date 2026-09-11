const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const formatMoney = (paise) => money.format((Object.is(paise, -0) || paise === 0) ? 0 : paise / 100);
const localDate = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; };
const LABELS = { investment: "Investment" };

function element(tag, text, className) { const node = document.createElement(tag); if (text != null) node.textContent = text; if (className) node.className = className; return node; }
function field(label, control) { const wrapper = element("label", null, "field"); wrapper.append(element("span", label), control); return wrapper; }
function rupeesToPaise(value) { const normalized = String(value).trim(); if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null; const [whole, fraction = ""] = normalized.split("."); const paise = Number(whole) * 100 + Number(fraction.padEnd(2, "0")); return Number.isSafeInteger(paise) ? paise : null; }

export function createWealthCenter({ wealth, entities, liveRegion }) {
  const root = element("section", null, "wealth-center"); let generation = 0;

  async function assetChoices() {
    const groups = await Promise.all(Object.keys(LABELS).map(async (type) => [type, await entities.list(type, { status: "active" })]));
    return groups.flatMap(([type, records]) => records.map((record) => ({ type, id: record.id, name: record.name ?? record.nickname })));
  }

  function valuationEditor(choices, today) {
    const section = element("section", null, "wealth-tools"); section.append(element("h2", "Record a valuation"), element("p", "Add a dated manual value. It will invalidate affected snapshots, never rewrite transaction history."));
    const form = element("form", null, "wealth-tool-form");
    const asset = element("select"); asset.required = true; asset.setAttribute("aria-label", "Asset"); asset.append(new Option("Choose an asset", "")); for (const choice of choices) asset.append(new Option(`${LABELS[choice.type]} · ${choice.name}`, `${choice.type}:${choice.id}`));
    const amount = element("input"); amount.type = "text"; amount.inputMode = "decimal"; amount.required = true; amount.placeholder = "0.00";
    const date = element("input"); date.type = "date"; date.required = true; date.value = today;
    const submit = element("button", "Record valuation", "button"); submit.type = "submit";
    form.append(field("Asset", asset), field("Value in rupees", amount), field("Valuation date", date), submit);
    form.onsubmit = async (event) => { event.preventDefault(); const valuePaise = rupeesToPaise(amount.value); if (valuePaise == null) { liveRegion.textContent = "Enter a non-negative amount with at most two decimal places."; return; } const [entityType, entityId] = asset.value.split(":"); submit.disabled = true; try { await wealth.recordValuation({ entityType, entityId, valuePaise, valuationDate: date.value, source: "manual" }); liveRegion.textContent = "Valuation recorded. Affected snapshots are marked stale."; await render(); } catch (error) { liveRegion.textContent = error.message; submit.disabled = false; } };
    if (!choices.length) { submit.disabled = true; section.append(element("p", "Add an active financial investment before recording a valuation.", "wealth-warning")); }
    section.append(form); return section;
  }

  function recalculationTool(today) {
    const section = element("section", null, "wealth-tools"); section.append(element("h2", "Recalculate history"), element("p", "Rebuild month-end snapshots chronologically after corrections or valuation changes."));
    const form = element("form", null, "wealth-tool-form"); const from = element("input"); from.type = "date"; from.required = true; from.value = `${today.slice(0, 4)}-01-01`; const to = element("input"); to.type = "date"; to.required = true; to.value = today; const submit = element("button", "Recalculate", "button button--quiet"); submit.type = "submit";
    form.append(field("From", from), field("Through", to), submit); form.onsubmit = async (event) => { event.preventDefault(); submit.disabled = true; try { const results = await wealth.recalculateRange(from.value, to.value); liveRegion.textContent = `${results.length} wealth snapshot${results.length === 1 ? "" : "s"} recalculated.`; await render(); } catch (error) { liveRegion.textContent = error.cause?.message ?? error.message; submit.disabled = false; } }; section.append(form); return section;
  }

  async function render() {
    const current = ++generation; root.replaceChildren(element("p", "Calculating your financial position…", "loading-state")); const asOfDate = localDate();
    try {
      const [snapshot, saved, choices, valuations] = await Promise.all([wealth.calculateWithExplanation(asOfDate), wealth.list({ includeStale: true }), assetChoices(), wealth.listValuations()]); if (current !== generation) return;
      const header = element("header", null, "wealth-center__header"); header.append(element("p", "Your flowing money", "route-heading__eyebrow"), element("h1", "Money overview"), element("p", `Banks, cards, loans and financial investments through ${asOfDate}. Homes and vehicles are used only to track related expenses.`));
      const save = element("button", "Save today’s snapshot", "button"); save.type = "button"; save.onclick = async () => { save.disabled = true; try { await wealth.save(asOfDate, { replace: true }); liveRegion.textContent = "Today’s wealth snapshot was saved."; await render(); } catch (error) { liveRegion.textContent = error.cause?.message ?? error.message; save.disabled = false; } }; header.append(save);
      const cards = element("div", null, "wealth-summary"); for (const [label, value, primary] of [["Financial position", snapshot.netWorthPaise, true], ["Money and investments", snapshot.totalAssetsPaise], ["Cards and loans", snapshot.totalLiabilitiesPaise], ["Income this month", snapshot.incomePaise], ["Expenses this month", snapshot.expensePaise], ["Savings this month", snapshot.savingsPaise]]) { const card = element("article", null, primary ? "wealth-card wealth-card--primary" : "wealth-card"); card.append(element("p", label), element("strong", formatMoney(value))); cards.append(card); }
      const explanation = element("details", null, "wealth-explanation"); explanation.append(element("summary", "How this changed")); const rows = [["Financial-position change", snapshot.explanation.netWorthChangePaise], ["Income", snapshot.explanation.incomeContributionPaise], ["Expenses", snapshot.explanation.expenseImpactPaise], ["Investment contributions", snapshot.explanation.investmentContributionPaise], ["Investment value change", snapshot.explanation.marketValueChangePaise], ["Debt reduction", snapshot.explanation.debtReductionPaise], ["Loan interest", -snapshot.explanation.loanInterestPaise], ["Adjustments", snapshot.explanation.adjustmentsPaise], ["Other money movement", snapshot.explanation.otherCapitalChangePaise]]; const dl = element("dl", null, "wealth-breakdown"); for (const [label, value] of rows) { dl.append(element("dt", label), element("dd", formatMoney(value))); } explanation.append(dl, element("p", `Savings rate ${snapshot.savingsRateBasisPoints == null ? "not available" : `${(snapshot.savingsRateBasisPoints / 100).toFixed(1)}%`}.`));
      const valuationStates = snapshot.positions.filter(({ valuationStatus }) => valuationStatus); const fallbackCount = valuationStates.filter(({ valuationStatus }) => valuationStatus !== "fresh").length; if (valuationStates.length) explanation.append(element("p", `${valuationStates.length} valued asset${valuationStates.length === 1 ? "" : "s"}; ${fallbackCount ? `${fallbackCount} using stale or book fallback.` : "all valuations are within their freshness policy."}`, fallbackCount ? "wealth-warning" : null));
      if (snapshot.excludedEntityCount) explanation.append(element("p", `${snapshot.excludedEntityCount} financial item${snapshot.excludedEntityCount === 1 ? " is" : "s are"} excluded from this position.`));
      const history = element("section", null, "wealth-history"); history.append(element("h2", "Saved snapshots")); const list = element("ul"); for (const item of saved.slice(0, 12)) { const suffix = item.stale ? " — stale; recalculate" : ""; const row = element("li", `${item.asOfDate}: ${formatMoney(item.netWorthPaise)}${suffix}`); if (item.stale) row.className = "is-stale"; list.append(row); } if (!saved.length) list.append(element("li", "No saved snapshots yet.")); history.append(list);
      const valuationHistory = element("section", null, "wealth-history"); valuationHistory.append(element("h2", "Recent valuations")); const valuationList = element("ul"); for (const item of valuations.slice(0, 8)) valuationList.append(element("li", `${item.valuationDate}: ${LABELS[item.entityType] ?? item.entityType} · ${formatMoney(item.valuePaise)} · ${item.source} · ${item.freshness.status}`)); if (!valuations.length) valuationList.append(element("li", "No valuations recorded yet.")); valuationHistory.append(valuationList);
      if (snapshot.diagnostics.length) { const warning = element("p", `${snapshot.diagnostics.length} integrity issue(s) must be resolved before saving.`, "wealth-warning"); warning.setAttribute("role", "alert"); save.disabled = true; header.append(warning); }
      root.replaceChildren(header, cards, explanation, history, valuationEditor(choices, asOfDate), recalculationTool(asOfDate), valuationHistory);
    } catch (error) { if (current === generation) { const failure = element("section", null, "error-state"); failure.setAttribute("role", "alert"); failure.append(element("h1", "Wealth calculation unavailable"), element("p", error.message)); root.replaceChildren(failure); } }
  }
  return { element: root, start: render };
}
