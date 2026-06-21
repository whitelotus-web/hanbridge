import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Generated favicon — a branded "H" so we don't ship a binary asset.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          borderRadius: 7,
          background: "linear-gradient(135deg,#4f7cff 0%,#7b3fe4 100%)",
          color: "#ffffff",
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "sans-serif"
        }}
      >
        H
      </div>
    ),
    { ...size }
  );
}
