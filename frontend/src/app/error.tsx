"use client";

import Link from "next/link";
import { useEffect } from "react";

// Root error.tsx: Minimal client component with zero heavy third-party imports.
// IMPORTANT: Importing @/components/ui/button (Radix UI, lucide-react) here
// inflated error.js to 600+ KB and extended root segment compilation time by ~3s,
// contributing to ChunkLoadError on cold start.
// Inline styles and native elements used intentionally for performance.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[WMS AppError] Client route error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "white",
          border: "1px solid #E2E8F0",
          borderRadius: 16,
          padding: 36,
          boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
            fontSize: 24,
          }}
        >
          ⚠️
        </div>

        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#0F172A",
            margin: "0 0 8px",
            letterSpacing: "-0.02em",
          }}
        >
          Page Rendering Issue
        </h1>
        <p
          style={{
            fontSize: 12,
            color: "#64748B",
            lineHeight: 1.6,
            margin: "0 0 16px",
          }}
        >
          An issue occurred while rendering this page. You can try refreshing or
          returning to the home page.
        </p>

        {error.digest && (
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 11,
              fontFamily: "monospace",
              color: "#64748B",
              marginBottom: 16,
            }}
          >
            Error ID:{" "}
            <span style={{ color: "#0F172A", fontWeight: 600 }}>
              {error.digest}
            </span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => reset()}
            style={{
              height: 40,
              background: "#4F46E5",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(79,70,229,0.25)",
            }}
          >
            🔄 Reload Page
          </button>
          <Link
            href="/"
            style={{
              height: 40,
              border: "1px solid #E2E8F0",
              color: "#475569",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              textDecoration: "none",
            }}
          >
            🏠 Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
