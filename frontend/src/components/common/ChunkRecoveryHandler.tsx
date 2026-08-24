"use client";

import { useEffect } from "react";

const CHUNK_RELOAD_KEY = "wms_chunk_reload_ts";
const RELOAD_DEBOUNCE_MS = 15000; // Allow 1 reload attempt per 15 seconds

/**
 * Global listener for unhandled chunk load errors in Next.js.
 * Automatically recovers from stale chunk caches on client deployment/rebuild.
 */
export function ChunkRecoveryHandler() {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      const errorMessage = error?.message || String(error || "");

      const isChunkError =
        error?.name === "ChunkLoadError" ||
        errorMessage.includes("Loading chunk") ||
        errorMessage.includes("Failed to fetch dynamically imported module") ||
        errorMessage.includes("Loading CSS chunk");

      if (isChunkError) {
        event.preventDefault();
        console.warn(
          "[WMS ChunkRecovery] Detected stale Webpack chunk error. Attempting safe page reload...",
          errorMessage
        );

        const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
        const now = Date.now();

        if (now - lastReload > RELOAD_DEBOUNCE_MS) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
          window.location.reload();
        } else {
          console.error(
            "[WMS ChunkRecovery] ChunkLoadError persisted after reload. Retaining current view."
          );
        }
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
