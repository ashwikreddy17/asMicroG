const store = new Map();
const TTL = 3 * 60 * 1000; // 3 minutes

export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL) { store.delete(key); return null; }
  return entry.data;
}

export function cacheSet(key, data) {
  store.set(key, { data, ts: Date.now() });
}

export function cacheDelete(key) {
  store.delete(key);
}

export function cacheClear() {
  store.clear();
}
