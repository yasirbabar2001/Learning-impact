import { ImageResponse } from "next/og";

export const alt = "Learning Impact: corporate training and expert trainers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 90, background: "#050507", color: "#fff", position: "relative" }}>
        <div style={{ position: "absolute", left: -120, top: -160, width: 620, height: 620, borderRadius: 620, background: "radial-gradient(circle, rgba(255,77,109,.55), transparent 65%)" }} />
        <div style={{ position: "absolute", right: -160, top: 60, width: 700, height: 700, borderRadius: 700, background: "radial-gradient(circle, rgba(0,194,255,.45), transparent 65%)" }} />
        <div style={{ position: "absolute", left: 360, bottom: -300, width: 640, height: 640, borderRadius: 640, background: "radial-gradient(circle, rgba(255,210,63,.4), transparent 65%)" }} />
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 92, letterSpacing: -2 }}>
          <span style={{ fontWeight: 300 }}>learning</span>
          <span style={{ fontWeight: 800, marginLeft: 24 }}>IMPACT</span>
        </div>
        <div style={{ width: 620, height: 8, borderRadius: 8, background: "#FFD23F", marginTop: 10 }} />
        <div style={{ marginTop: 48, fontSize: 40, color: "rgba(255,255,255,.8)" }}>Corporate training programs & expert trainers in Pakistan</div>
      </div>
    ),
    size,
  );
}
