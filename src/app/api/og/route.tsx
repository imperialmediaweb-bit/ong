import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const title = searchParams.get("title") || "Binevo";
    const subtitle = searchParams.get("subtitle") || "Platforma CRM si Campanii pentru ONG-uri";
    const logoUrl = searchParams.get("logo") || "";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {/* Background pattern */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              opacity: 0.1,
              background:
                "radial-gradient(circle at 25% 25%, white 2px, transparent 2px), radial-gradient(circle at 75% 75%, white 2px, transparent 2px)",
              backgroundSize: "60px 60px",
            }}
          />

          {/* Content card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 80px",
              maxWidth: "1000px",
              textAlign: "center",
            }}
          >
            {/* Logo */}
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                width={100}
                height={100}
                style={{
                  borderRadius: "50%",
                  marginBottom: "30px",
                  border: "4px solid rgba(255,255,255,0.3)",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "80px",
                  height: "80px",
                  borderRadius: "20px",
                  background: "rgba(255,255,255,0.2)",
                  marginBottom: "30px",
                  fontSize: "40px",
                }}
              >
                B
              </div>
            )}

            {/* Title */}
            <div
              style={{
                fontSize: title.length > 30 ? "48px" : "60px",
                fontWeight: 800,
                color: "white",
                lineHeight: 1.2,
                marginBottom: "20px",
                textShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
            >
              {title}
            </div>

            {/* Subtitle */}
            {subtitle && (
              <div
                style={{
                  fontSize: "24px",
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.4,
                  maxWidth: "700px",
                }}
              >
                {subtitle}
              </div>
            )}

            {/* Binevo branding */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "40px",
                padding: "10px 24px",
                borderRadius: "100px",
                background: "rgba(255,255,255,0.15)",
                fontSize: "18px",
                color: "rgba(255,255,255,0.9)",
                fontWeight: 600,
              }}
            >
              binevo.ro
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("OG image generation error:", error);
    // Return a 1x1 pixel PNG fallback so social media crawlers don't break
    return new NextResponse(null, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
