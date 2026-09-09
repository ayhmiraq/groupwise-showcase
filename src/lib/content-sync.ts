import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { pruneCache } from "./offline-cache";


const KEY = "content-updated-at";
const EVENT = "content-updated";

/** Notify every open tab/window that site content changed. */
export function broadcastContentUpdate() {
  if (typeof window === "undefined") return;
  const stamp = String(Date.now());
  try {
    window.localStorage.setItem(KEY, stamp);
  } catch {
    // storage may be unavailable (private mode) — the in-tab event still fires
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: stamp }));
}

/**
 * Refresh all content queries + route loaders whenever content changes,
 * whether the change happened in this tab, another tab, or while away.
 */
export function useContentSync() {
  const qc = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    pruneCache();
    let last = 0;
    const refresh = () => {
      // Offline: keep showing the cached snapshot instead of refetching.
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      const now = Date.now();
      if (now - last < 300) return;
      last = now;
      void qc.invalidateQueries();
      void router.invalidate();
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY) refresh();
    };
    const onCustom = () => refresh();

    // Refresh on real content changes (this tab / another tab) and when the
    // connection returns — not on every focus, which slowed down browsing.
    window.addEventListener("storage", onStorage);
    window.addEventListener(EVENT, onCustom);
    window.addEventListener("online", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVENT, onCustom);
      window.removeEventListener("online", onCustom);
    };

  }, [qc, router]);
}
