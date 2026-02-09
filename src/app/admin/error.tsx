"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto", fontFamily: "system-ui" }}>
      <h2 style={{ color: "#dc2626", marginBottom: "16px" }}>Eroare Super Admin</h2>
      <div style={{
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "16px",
      }}>
        <p style={{ fontFamily: "monospace", fontSize: "14px", color: "#dc2626", wordBreak: "break-all" }}>
          {error.message}
        </p>
        {error.stack && (
          <pre style={{ fontSize: "11px", color: "#6b7280", marginTop: "8px", whiteSpace: "pre-wrap", maxHeight: "200px", overflow: "auto" }}>
            {error.stack}
          </pre>
        )}
      </div>
      <button onClick={reset} style={{ padding: "8px 20px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", marginRight: "8px" }}>
        Reincearca
      </button>
      <button onClick={() => window.location.href = "/admin"} style={{ padding: "8px 20px", background: "#e5e7eb", color: "#1f2937", border: "none", borderRadius: "6px", cursor: "pointer" }}>
        Admin Home
      </button>
    </div>
  );
}
