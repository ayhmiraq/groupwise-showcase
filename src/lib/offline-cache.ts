/**
 * Offline-first cache for site content (companies, tile backgrounds, pages...).
 *
 * Every successful fetch is mirrored into `localStorage` and a small cookie
 * marker is refreshed. When the network is unavailable the query function falls
 * back to the last stored snapshot, so the UI keeps rendering instead of
 * throwing.
 */
const PREFIX = "site-cache:v1:";
const STAMP_COOKIE = "site_cache_stamp";
/** Snapshots older than this are still used offline, but refreshed when online. */
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

type Entry<T> = { at: number; data: T };

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readCache<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    if (!entry || typeof entry.at !== "number") return null;
    return entry.data;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T) {
  if (!isBrowser()) return;
  try {
    const entry: Entry<T> = { at: Date.now(), data };
    window.localStorage.setItem(PREFIX + key, JSON.stringify(entry));
    setCookie(STAMP_COOKIE, String(entry.at));
  } catch {
    // quota exceeded / private mode — caching is best-effort only
  }
}

export function setCookie(name: string, value: string, maxAgeSeconds = MAX_AGE_MS / 1000) {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${Math.floor(
      maxAgeSeconds,
    )}; samesite=lax`;
  } catch {
    // ignore
  }
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

/** True when a cached snapshot exists from a previous online visit. */
export function hasCachedContent() {
  return Boolean(getCookie(STAMP_COOKIE));
}

/** Prune snapshots that are too old to be useful. */
export function pruneCache() {
  if (!isBrowser()) return;
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (!key.startsWith(PREFIX)) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const entry = JSON.parse(raw) as Entry<unknown>;
      if (!entry?.at || Date.now() - entry.at > MAX_AGE_MS) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Wraps a query function with the offline cache: writes on success, falls back
 * to the stored snapshot on failure (offline, server down, timeout).
 */
export function withOfflineCache<T>(key: string, fn: () => Promise<T>) {
  return async (): Promise<T> => {
    if (!isBrowser()) return fn();

    if (!navigator.onLine) {
      const offline = readCache<T>(key);
      if (offline !== null) return offline;
    }

    try {
      const data = await fn();
      writeCache(key, data);
      return data;
    } catch (error) {
      const cached = readCache<T>(key);
      if (cached !== null) return cached;
      throw error;
    }
  };
}
