import { ImageResponse } from "next/og";
import { getCourse } from "@/lib/courses/catalog";
import { certificateByCode } from "@/lib/portal/exam";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Learning Impact verified certificate";

/** No emoji here: rendering them makes next/og download images from a CDN at request time. */
/** The preview card WhatsApp, LinkedIn and others show when a certificate link is shared. */
export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const cert = certificateByCode(decodeURIComponent(code).toUpperCase());
  const valid = cert && !cert.revoked_at;
  const course = cert ? getCourse(cert.course_slug) : null;
  const color = course?.quest.color ?? "#ffd23f";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 70, background: "#050507", color: "#f6f6f8", fontFamily: "sans-serif", position: "relative" }}>
        <div style={{ position: "absolute", top: -200, right: -150, width: 700, height: 700, borderRadius: 700, background: color, opacity: 0.35, filter: "blur(120px)" }} />
        <div style={{ position: "absolute", bottom: -260, left: -160, width: 640, height: 640, borderRadius: 640, background: "#7b61ff", opacity: 0.3, filter: "blur(120px)" }} />
        <div style={{ display: "flex", height: 10, width: "100%", borderRadius: 10, background: "linear-gradient(90deg,#ff4d6d,#ff9f1c,#ffd23f,#2ee59d,#00c2ff,#7b61ff,#ff4dd8)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: valid ? "#2ee59d" : "#ff4d6d", fontWeight: 700, letterSpacing: 2 }}>
            <div style={{ width: 22, height: 22, borderRadius: 22, background: valid ? "#2ee59d" : "#ff4d6d" }} />
            {valid ? "VERIFIED CERTIFICATE" : "CERTIFICATE NOT FOUND"}
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>{valid ? cert.holder_name : "Learning Impact"}</div>
          {valid && <div style={{ fontSize: 32, color: "rgba(246,246,248,.7)" }}>has earned the professional certification</div>}
          {valid && <div style={{ fontSize: 50, fontWeight: 800, color }}>{course?.title ?? cert.course_slug}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 26, color: "rgba(246,246,248,.7)" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 34, fontWeight: 800, color: "#f6f6f8" }}>Learning Impact</span>
            <span>learningimpact.pk - Gamified professional certifications</span>
          </div>
          {valid && <span>{`Score ${cert.percent}% - ${cert.code}`}</span>}
        </div>
      </div>
    ),
    size,
  );
}
