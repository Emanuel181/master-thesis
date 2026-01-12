import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "VulnIQ Security Blog - Code Security & Vulnerability Management";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, #1a1a2e 0%, transparent 50%), radial-gradient(circle at 75% 75%, #16213e 0%, transparent 50%)",
          padding: 60,
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 60,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
              fill="#22c55e"
            />
            <path
              d="M10 12l2 2 4-4"
              stroke="#0a0a0a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#ffffff" }}>
            VulnIQ
          </span>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#22c55e20",
              color: "#22c55e",
              padding: "8px 20px",
              borderRadius: 20,
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 24,
              width: "fit-content",
            }}
          >
            Security Blog
          </div>
          <h1
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.1,
              margin: 0,
              marginBottom: 24,
            }}
          >
            Code Security Insights
          </h1>
          <p
            style={{
              fontSize: 24,
              color: "#a1a1aa",
              margin: 0,
              maxWidth: "70%",
            }}
          >
            Expert articles on vulnerability management, AI-powered security analysis, and secure coding best practices.
          </p>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderTop: "1px solid #27272a",
            paddingTop: 24,
          }}
        >
          <span style={{ fontSize: 18, color: "#71717a" }}>vulniq.org/blog</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
