"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginTop: "80px" }}>
          <h1 style={{ fontSize: "24px", marginBottom: "16px", color: "#dc2626" }}>
            Eroare aplicatie
          </h1>
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
            textAlign: "left",
          }}>
            <p style={{ fontFamily: "monospace", fontSize: "14px", color: "#dc2626", wordBreak: "break-all" }}>
              {error.message || "Eroare necunoscuta"}
            </p>
            {error.digest && (
              <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
                Digest: {error.digest}
              </p>
            )}
            {error.stack && (
              <pre style={{
                fontSize: "11px",
                color: "#6b7280",
                marginTop: "8px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                maxHeight: "200px",
                overflow: "auto",
              }}>
                {error.stack}
              </pre>
            )}
          </div>
          <button
            onClick={reset}
            style={{
              padding: "8px 24px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              marginRight: "8px",
            }}
          >
            Reincearca
          </button>
          <button
            onClick={() => window.location.href = "/"}
            style={{
              padding: "8px 24px",
              background: "#e5e7eb",
              color: "#1f2937",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Pagina principala
          </button>
        </div>
      </body>
    </html>
  );
}
