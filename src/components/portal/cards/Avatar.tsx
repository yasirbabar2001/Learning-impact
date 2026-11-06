import type { CastMember } from "@/lib/courses/schema";

export type Mood = "neutral" | "happy" | "worried" | "angry" | "thinking" | "proud";

const SKIN = ["#f6d7c3", "#e8b796", "#c98e66", "#9a643f", "#6b4228"];
const HAIR = "#2a1d17";

/** Flat illustrated portrait drawn from a cast member's look, with a facial expression. */
export function Avatar({ look, mood = "neutral", size = 56, title }: { look: CastMember["look"]; mood?: Mood; size?: number; title?: string }) {
  const skin = SKIN[look.skin - 1] ?? SKIN[2];
  const cloth = look.color;
  const h = look.hair;
  const brow = {
    neutral: ["M34 41 L42 40", "M58 40 L66 41"],
    happy: ["M34 40 Q38 38 42 40", "M58 40 Q62 38 66 40"],
    worried: ["M34 40 L42 42", "M58 42 L66 40"],
    angry: ["M34 39 L42 43", "M58 43 L66 39"],
    thinking: ["M34 41 L42 41", "M58 38 Q62 36 66 39"],
    proud: ["M34 40 Q38 38 42 40", "M58 40 Q62 38 66 40"],
  }[mood];
  const mouth = {
    neutral: "M44 62 Q50 64 56 62",
    happy: "M42 60 Q50 69 58 60",
    worried: "M44 64 Q50 60 56 64",
    angry: "M43 64 Q50 60 57 64",
    thinking: "M45 63 L55 61",
    proud: "M41 59 Q50 70 59 59",
  }[mood];
  const eyesClosed = mood === "happy" || mood === "proud";
  return (
    <svg className="avatar-svg" width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={title}>
      <defs>
        <clipPath id={`clip-${look.color.slice(1)}-${look.skin}-${h}`}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <g clipPath={`url(#clip-${look.color.slice(1)}-${look.skin}-${h})`}>
        <rect width="100" height="100" fill={cloth} opacity="0.22" />
        {/* shoulders */}
        <path d="M14 100 Q16 76 50 74 Q84 76 86 100 Z" fill={cloth} />
        {h === "hijab" && <path d="M22 100 Q20 62 30 44 Q50 6 70 44 Q80 62 78 100 Z" fill={cloth} filter="brightness(0.85)" />}
        <rect x="44" y="64" width="12" height="12" rx="4" fill={skin} />
        {/* back hair */}
        {h === "long" && <path d="M27 44 Q26 80 34 86 L66 86 Q74 80 73 44 Z" fill={HAIR} />}
        {h === "bun" && <circle cx="50" cy="16" r="9" fill={HAIR} />}
        {/* face */}
        <ellipse cx="50" cy="48" rx="21" ry="23" fill={skin} />
        {h !== "hijab" && <ellipse cx="29" cy="50" rx="3.5" ry="5" fill={skin} />}
        {h !== "hijab" && <ellipse cx="71" cy="50" rx="3.5" ry="5" fill={skin} />}
        {/* hair / headwear */}
        {(h === "short" || h === "beard") && <path d="M29 44 Q28 22 50 22 Q72 22 71 44 Q66 32 50 31 Q34 32 29 44 Z" fill={HAIR} />}
        {h === "long" && <path d="M28 48 Q26 22 50 21 Q74 22 72 48 Q68 30 50 30 Q32 30 28 48 Z" fill={HAIR} />}
        {h === "bun" && <path d="M29 44 Q28 22 50 22 Q72 22 71 44 Q66 30 50 30 Q34 30 29 44 Z" fill={HAIR} />}
        {h === "curly" && (
          <g fill={HAIR}>
            {[30, 38, 46, 54, 62, 70].map((x, i) => (
              <circle key={x} cx={x} cy={i % 2 ? 26 : 30} r="8" />
            ))}
          </g>
        )}
        {h === "hijab" && <path d="M27 50 Q26 20 50 20 Q74 20 73 50 Q73 34 50 31 Q27 34 27 50 Z" fill={cloth} filter="brightness(0.85)" />}
        {h === "beard" && <path d="M30 52 Q32 74 50 74 Q68 74 70 52 Q66 66 50 66 Q34 66 30 52 Z" fill={HAIR} />}
        {/* eyebrows, eyes, mouth */}
        <g stroke={HAIR} strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d={brow[0]} />
          <path d={brow[1]} />
        </g>
        {eyesClosed ? (
          <g stroke="#1b1b1b" strokeWidth="2.4" strokeLinecap="round" fill="none">
            <path d="M35 49 Q39 45 43 49" />
            <path d="M57 49 Q61 45 65 49" />
          </g>
        ) : (
          <g fill="#1b1b1b">
            <circle cx="39" cy="49" r="2.8" />
            <circle cx="61" cy="49" r="2.8" />
          </g>
        )}
        <path d={mouth} stroke={h === "beard" ? "#f3e1d6" : "#7a2e2e"} strokeWidth="2.6" strokeLinecap="round" fill="none" />
        {(mood === "happy" || mood === "proud") && (
          <g fill="#ff7a8a" opacity="0.35">
            <circle cx="34" cy="56" r="4" />
            <circle cx="66" cy="56" r="4" />
          </g>
        )}
      </g>
    </svg>
  );
}

/** The narrator voice in stories. */
export function NarratorBadge({ size = 40 }: { size?: number }) {
  return (
    <span className="narrator-badge" style={{ width: size, height: size }} aria-hidden="true">
      📜
    </span>
  );
}
