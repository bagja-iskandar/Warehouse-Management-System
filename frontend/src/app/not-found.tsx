import Link from "next/link";

// Root not-found.tsx: Server Component with zero heavy dependencies.
// IMPORTANT: This file intentionally uses NO client components that import
// auth stores, UI libraries, or third-party packages.
// Reason: Next.js App Router compiles root-level special files (not-found, error)
// alongside layout.tsx in the same webpack compilation unit. Heavy dependencies
// here inflate layout.js chunk size and extend initial compilation time,
// which causes ChunkLoadError on cold start.
export default function NotFoundPage() {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          background: "#F8FAFC",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          margin: 0,
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
              width: 64,
              height: 64,
              background: "#EEF2FF",
              border: "1px solid #C7D2FE",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              fontSize: 28,
            }}
          >
            🔍
          </div>

          <span
            style={{
              display: "inline-block",
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#4F46E5",
              background: "#EEF2FF",
              padding: "3px 10px",
              borderRadius: 20,
              border: "1px solid #C7D2FE",
              marginBottom: 10,
            }}
          >
            Error 404 — Not Found
          </span>

          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#0F172A",
              margin: "0 0 6px",
              letterSpacing: "-0.02em",
            }}
          >
            Page Not Found
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "#64748B",
              lineHeight: 1.6,
              margin: "0 0 24px",
            }}
          >
            The page or resource you are looking for is not available or has
            been moved.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                height: 40,
                background: "#4F46E5",
                color: "white",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 4px 12px rgba(79,70,229,0.25)",
              }}
            >
              🏠 Back to Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
