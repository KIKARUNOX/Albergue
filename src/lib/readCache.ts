type CacheRecord<T> = {
  value: T;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheRecord<unknown>>();

function nowMs(): number {
  return Date.now();
}

function storageKey(key: string): string {
  return `codigo316:cache:${key}`;
}

export function getCachedValue<T>(key: string): T | null {
  const mem = memoryCache.get(key) as CacheRecord<T> | undefined;
  if (mem && mem.expiresAt > nowMs()) {
    return mem.value;
  }
  if (mem) {
    memoryCache.delete(key);
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(storageKey(key));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CacheRecord<T>;
    if (!parsed?.expiresAt || parsed.expiresAt <= nowMs()) {
      window.sessionStorage.removeItem(storageKey(key));
      return null;
    }

    memoryCache.set(key, parsed as CacheRecord<unknown>);
    return parsed.value;
  } catch {
    return null;
  }
}

export function setCachedValue<T>(key: string, value: T, ttlMs: number): void {
  const record: CacheRecord<T> = {
    value,
    expiresAt: nowMs() + Math.max(1, ttlMs),
  };

  memoryCache.set(key, record as CacheRecord<unknown>);

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(storageKey(key), JSON.stringify(record));
  } catch {
    // Ignore storage quota errors.
  }
}

export function invalidateCache(key: string): void {
  memoryCache.delete(key);

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(storageKey(key));
  } catch {
    // Ignore storage errors.
  }
}
