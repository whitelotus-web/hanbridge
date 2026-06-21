import { ImageResponse } from "next/og";

export const alt = "HanBridge — Smarter HSK & Chinese exam prep";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Dynamically generated Open Graph / social card. Applies to every page under
// the [locale] segment, so links shared from any page get a branded preview.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg,#4f7cff 0%,#7b3fe4 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ fontSize: 32, letterSpacing: 3, opacity: 0.92 }}>
          HSK 1–9 · HSKK · AI TUTOR
        </div>
        <div style={{ fontSize: 104, fontWeight: 800, marginTop: 18 }}>
          HanBridge
        </div>
        <div style={{ fontSize: 40, marginTop: 24, maxWidth: 920, opacity: 0.95 }}>
          The smarter way to learn Chinese and ace the HSK exam.
        </div>
      </div>
    ),
    { ...size }
  );
}
