import { useCallback, useEffect, useState } from "react";
import { growingContextForState } from "@lib/state-growing-context";
import type { StateGrowingContext } from "@lib/state-growing-context";

/** Shared with catalog browse — user's home state for filters and detail copy. */
export const CATALOG_STATE_STORAGE_KEY = "naturelover-my-state";

export const CATALOG_STATE_CHANGED_EVENT = "naturelover-state-changed";

export function readCatalogStateCode(): string {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(CATALOG_STATE_STORAGE_KEY)?.trim() ?? "";
}

export function writeCatalogStateCode(code: string): void {
  if (typeof localStorage === "undefined") return;
  const trimmed = code.trim();
  if (trimmed) localStorage.setItem(CATALOG_STATE_STORAGE_KEY, trimmed);
  else localStorage.removeItem(CATALOG_STATE_STORAGE_KEY);
  window.dispatchEvent(new Event(CATALOG_STATE_CHANGED_EVENT));
}

/** Re-reads when catalog state changes (same tab or another tab). */
export function useCatalogStateCode(): string {
  const [code, setCode] = useState(readCatalogStateCode);

  const sync = useCallback(() => setCode(readCatalogStateCode()), []);

  useEffect(() => {
    window.addEventListener(CATALOG_STATE_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CATALOG_STATE_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  return code;
}

export function useCatalogGrowingContext(): StateGrowingContext | null {
  const code = useCatalogStateCode();
  return growingContextForState(code);
}
