import { verifyCredential } from "./crypto.js";

export function createLockManager({ credential, timeoutMs = 300000, lockOnHidden = true, now = () => Date.now(), schedule = setTimeout, cancel = clearTimeout, onChange = () => {}, coordination } = {}) {
  let secret = null;
  let timer = null;
  let failures = 0;
  const resetTimer = () => { if (timer) cancel(timer); timer = secret && timeoutMs > 0 ? schedule(() => lock("timeout"), timeoutMs) : null; };
  const lock = (reason = "manual", broadcast = true) => {
    secret = null;
    if (timer) cancel(timer);
    timer = null;
    onChange({ locked: true, reason });
    if (broadcast) coordination?.publish("lock", { reason });
  };
  coordination?.subscribe((message) => { if (message.type === "lock" || message.type === "reset") lock(message.detail?.reason ?? message.type, false); });
  return {
    get locked() { return secret === null; },
    async unlock(candidate) {
      if (failures) await new Promise((resolve) => schedule(resolve, Math.min(failures * 250, 2000)));
      if (!await verifyCredential(candidate, credential)) { failures += 1; onChange({ locked: true, reason: "failed", failures }); return false; }
      failures = 0; secret = candidate; resetTimer(); onChange({ locked: false, reason: "unlocked" }); return true;
    },
    lock,
    activity() { if (secret) resetTimer(); },
    visibilityChanged(hidden) { if (hidden && lockOnHidden) lock("hidden"); },
    useSecret(operation) { if (!secret) throw new Error("FinOrbit is locked"); resetTimer(); return operation(secret); },
    destroy() { lock("destroy", false); },
  };
}
