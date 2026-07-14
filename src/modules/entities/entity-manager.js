const ROUTE_TYPES = { accounts: ["account", "creditCard", "loan"], plan: ["incomeSource", "commitment"], wealth: ["investment", "property", "vehicle"] };
const LABELS = { account: "Bank and cash accounts", creditCard: "Credit cards", loan: "Loans", incomeSource: "Income sources", commitment: "Recurring commitments", investment: "Investments", property: "Properties", vehicle: "Vehicles" };

export function createEntityManager(route, service) {
  const root = document.createElement("section"); root.className = "entity-manager";
  for (const type of ROUTE_TYPES[route] ?? []) {
    const section = document.createElement("section"); const title = document.createElement("h2"); title.textContent = LABELS[type];
    const note = document.createElement("p"); note.textContent = route === "plan" ? "Configuration only—no transactions or recurring occurrences are generated." : route === "wealth" ? "Opening estimates only—no prices, gains, or wealth totals are calculated." : "Opening positions only—transaction history arrives in a later milestone.";
    const controls = document.createElement("div"); controls.className = "entity-manager__controls";
    const search = document.createElement("input"); search.type = "search"; search.placeholder = `Search ${LABELS[type].toLowerCase()}`; search.setAttribute("aria-label", `Search ${LABELS[type]}`);
    const status = document.createElement("select"); status.setAttribute("aria-label", `Filter ${LABELS[type]} by status`); for (const [value, label] of [["active", "Active"], ["", "All statuses"]]) { const option = document.createElement("option"); option.value = value; option.textContent = label; status.append(option); }
    const list = document.createElement("ul"); list.className = "entity-list";
    async function render() { const records = await service.list(type, { search: search.value, status: status.value, includeArchived: status.value === "" }); list.replaceChildren(...records.map((record) => { const item = document.createElement("li"); const name = document.createElement("strong"); name.textContent = record.nickname ?? record.name; const meta = document.createElement("span"); meta.textContent = ` ${record.status}${record.archived ? ", archived" : ""}`; const action = document.createElement("button"); action.className = "button button--secondary"; action.textContent = record.archived ? "Restore" : "Archive"; action.onclick = async () => { if (confirm(`${action.textContent} ${name.textContent}?`)) { await service.transition(type, record.id, record.archived ? "restore" : "archive"); await render(); } }; item.append(name, meta, action); return item; })); if (!records.length) { const empty = document.createElement("li"); empty.textContent = "No matching records."; list.append(empty); } }
    search.addEventListener("input", render); status.addEventListener("change", render); controls.append(search, status); section.append(title, note, controls, list); root.append(section); render();
  }
  return root;
}
