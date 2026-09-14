export function createId() {
  const randomUuid = globalThis.crypto?.randomUUID;
  if (typeof randomUuid === "function") return randomUuid.call(globalThis.crypto);
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
