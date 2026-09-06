function node(tag, attributes = {}, children = []) {
  const value = document.createElement(tag);
  for (const [name, content] of Object.entries(attributes)) name === "text" ? value.textContent = content : value.setAttribute(name, content);
  value.append(...children);
  return value;
}

function downloadJson(payload, name) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  const link = node("a", { href: url, download: name });
  link.click();
  URL.revokeObjectURL(url);
}

export function createSecurityCenter({ onSetup, onLock, onStandardBackup, onEncryptedBackup, onRestorePreview, onReset, onStorageStatus, onPersistStorage, onDatabaseHealth }) {
  const status = node("p", { class: "security-center__status", "aria-live": "polite" });
  const mode = node("select", { "aria-label": "Lock type" }, [node("option", { value: "pin", text: "PIN" }), node("option", { value: "passphrase", text: "Passphrase" })]);
  const secret = node("input", { type: "password", autocomplete: "new-password", minlength: "4", required: "", "aria-label": "New PIN or passphrase" });
  const setup = node("form", { class: "security-center__form" }, [mode, secret, node("button", { type: "submit", class: "button", text: "Set app lock" })]);
  setup.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (mode.value === "pin" && !/^\d{4,}$/.test(secret.value)) { status.textContent = "Use at least four digits. A short PIN offers weaker protection than a passphrase."; return; }
    await onSetup(secret.value, mode.value);
    secret.value = ""; status.textContent = "App lock configured. It will be required after the next reload.";
  });
  const lockButton = node("button", { type: "button", class: "button button--quiet", text: "Lock now" });
  lockButton.addEventListener("click", () => onLock?.());
  const backupButton = node("button", { type: "button", class: "button button--quiet", text: "Download standard backup" });
  backupButton.addEventListener("click", async () => downloadJson(await onStandardBackup(), `finorbit-backup-${new Date().toISOString().slice(0, 10)}.json`));
  const encryptedButton = node("button", { type: "button", class: "button button--quiet", text: "Download encrypted backup" });
  encryptedButton.addEventListener("click", async () => {
    const passphrase = prompt("Enter a backup passphrase. FinOrbit cannot recover it.");
    if (passphrase) downloadJson(await onEncryptedBackup(passphrase), `finorbit-encrypted-${new Date().toISOString().slice(0, 10)}.json`);
  });
  const restoreInput = node("input", { type: "file", accept: "application/json,.json", "aria-label": "Choose backup to preview" });
  restoreInput.addEventListener("change", async () => { const file = restoreInput.files?.[0]; if (file) status.textContent = await onRestorePreview(file); });
  const resetButton = node("button", { type: "button", class: "button button--quiet", text: "Reset all local data" });
  resetButton.addEventListener("click", async () => { if (confirm("Permanently reset this browser's FinOrbit data? Export a backup first.")) await onReset(); });
  const storageStatus = node("p", { class: "security-center__status", text: "Storage status has not been checked." });
  const storageButton = node("button", { type: "button", class: "button button--quiet", text: "Check storage & database" });
  storageButton.addEventListener("click", async () => { const [storage, database] = await Promise.all([onStorageStatus(), onDatabaseHealth()]); const percent = storage.usageRatio == null ? "unavailable" : `${Math.round(storage.usageRatio * 100)}%`; storageStatus.textContent = `Storage use: ${percent}; receipt files: ${(storage.receiptBytes / 1024 / 1024).toFixed(1)} MB; persistent: ${storage.persisted ? "yes" : "no"}; database readable: ${database.readable ? "yes" : "no"}. ${storage.recommendation}`; });
  const persistButton = node("button", { type: "button", class: "button button--quiet", text: "Request persistent storage" });
  persistButton.addEventListener("click", async () => { const result = await onPersistStorage(); storageStatus.textContent = !result.supported ? "Persistent storage is not supported by this browser. Keep current encrypted backups." : result.persisted ? "Persistent browser storage granted. Backups remain necessary." : "The browser did not grant persistent storage. Export backups regularly."; });
  return node("section", { class: "security-center", "aria-labelledby": "security-title" }, [
    node("h2", { id: "security-title", text: "Security, privacy & data" }),
    node("p", { text: "Your records stay in this browser. FinOrbit does not claim that browser storage is unrecoverable or equivalent to hardware-backed encryption." }),
    node("h3", { text: "App lock" }), setup,
    node("p", { class: "security-center__warning", text: "A passphrase is stronger than a short PIN. Forgotten credentials cannot be recovered by FinOrbit." }),
    node("div", { class: "security-center__actions" }, [lockButton, backupButton, encryptedButton, restoreInput, resetButton]), status,
    node("p", { text: "Restore first validates the entire file and shows a preview. Active data is replaced only in one atomic operation after explicit confirmation." }),
    node("h3", { text: "Storage resilience" }),
    node("p", { text: "Browser storage can still be cleared by the browser, device policy, or the user. Persistent-storage permission is optional and requested only when you choose it." }),
    node("div", { class: "security-center__actions" }, [storageButton, persistButton]), storageStatus,
  ]);
}
