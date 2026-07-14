export function createCoordination({ channelName = "finorbit-security", windowObject = globalThis.window } = {}) {
  const listeners = new Set();
  const channel = typeof BroadcastChannel === "function" ? new BroadcastChannel(channelName) : null;
  const deliver = (message) => listeners.forEach((listener) => listener(message));
  if (channel) channel.onmessage = (event) => deliver(event.data);
  const storageListener = (event) => { if (event.key === channelName && event.newValue) deliver(JSON.parse(event.newValue)); };
  windowObject?.addEventListener?.("storage", storageListener);
  return {
    publish(type, detail = {}) {
      const message = { type, detail, sentAt: new Date().toISOString() };
      channel?.postMessage(message);
      try { windowObject?.localStorage?.setItem(channelName, JSON.stringify(message)); windowObject?.localStorage?.removeItem(channelName); } catch {}
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    close() { channel?.close(); windowObject?.removeEventListener?.("storage", storageListener); listeners.clear(); },
  };
}
