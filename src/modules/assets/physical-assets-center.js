const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const element = (tag, text, className) => { const node = document.createElement(tag); if (text != null) node.textContent = text; if (className) node.className = className; return node; };
const field = (label, control) => { const wrapper = element("label", null, "field"); wrapper.append(element("span", label), control); return wrapper; };
const input = (name) => { const control = element("input"); control.name = name; return control; };

export function createPhysicalAssetsCenter({ assets, entities, liveRegion }) {
  const root = element("details", null, "settings-section expense-items");
  let generation = 0;

  function editor() {
    const form = element("form", null, "settings-form");
    const grid = element("div", null, "settings-form__grid");
    const type = element("select"); type.name = "type";
    type.append(new Option("Home, land or property", "property"), new Option("Bike, car or other vehicle", "vehicle"), new Option("Other item", "otherAsset"));
    const name = input("name"); name.required = true;
    const subtype = input("subtype");
    const identifier = input("identifier");
    grid.append(field("Item kind *", type), field("Name *", name), field("Type (optional)", subtype), field("Short identifier (optional)", identifier));
    const save = element("button", "Add tracking item", "button"); save.type = "submit";
    const status = element("p", "", "field__error"); status.setAttribute("role", "alert");
    form.append(grid, status, save);
    form.onsubmit = async (event) => {
      event.preventDefault(); save.disabled = true;
      const today = new Date().toISOString().slice(0, 10);
      const common = { nickname: name.value.trim(), openingEstimatedValuePaise: 0, valuationDate: today, includeInNetWorth: false, status: "active" };
      if (type.value === "property") { common.propertyType = subtype.value.trim() || "residential"; common.locationLabel = identifier.value.trim() || undefined; common.ownershipPercentage = 100; }
      else if (type.value === "vehicle") { common.vehicleType = subtype.value.trim() || "vehicle"; common.registrationLabel = identifier.value.trim() || undefined; }
      else common.assetType = subtype.value.trim() || "custom";
      const result = await entities.save(type.value, common, { source: "manual" });
      status.textContent = result.ok ? "" : Object.values(result.errors)[0];
      if (result.ok) { liveRegion.textContent = `${common.nickname} is ready for expense tracking.`; await render(); } else save.disabled = false;
    };
    return form;
  }

  async function render() {
    const current = ++generation;
    const records = await assets.list();
    if (current !== generation) return;
    const summary = element("summary", "Expense tracking items");
    const intro = element("p", "Add a simple name such as Home, Bike 1 or Bike 2. These items do not count toward your financial position; they only help separate related expenses.");
    const list = element("div", null, "settings-records");
    for (const item of records) {
      const activity = await assets.activity(item.entityType, item.id);
      const card = element("article", null, "settings-record");
      card.append(element("h3", item.nickname ?? item.name), element("p", `${item.entityType === "otherAsset" ? "item" : item.entityType} · ${money.format(activity.expensePaise / 100)} logged expenses`));
      list.append(card);
    }
    if (!records.length) list.append(element("p", "No expense tracking items added yet."));
    root.replaceChildren(summary, intro, list, element("h3", "Add an expense tracking item"), editor());
  }

  return { element: root, start: render };
}
