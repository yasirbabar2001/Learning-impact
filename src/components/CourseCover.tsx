import type { ReactNode } from "react";

/**
 * Title artwork for a course: a drawn illustration of the topic (leadership summit, AI chip, AML shield, padlock…)
 * on a gradient in the course colour, with the country flag for regulatory quests. Pure SVG, so it is sharp at any
 * size, weighs almost nothing and needs no stock photos.
 */

export type Motif =
  | "leadership"
  | "executive"
  | "ai"
  | "database"
  | "infrastructure"
  | "people"
  | "talent"
  | "procurement"
  | "communication"
  | "aml"
  | "consumer"
  | "cyber"
  | "governance"
  | "law"
  | "fx"
  | "workplace"
  | "green"
  | "experience"
  | "conflict"
  | "equality"
  | "privacy";

const BY_SLUG: Record<string, Motif> = {
  "advanced-leadership": "leadership",
  "cxo-leadership-styles": "executive",
  "agentic-ai": "ai",
  "database-management": "database",
  "it-infrastructure": "infrastructure",
  "hr-operations": "people",
  "talent-management": "talent",
  "procurement-management": "procurement",
  "communication-skills": "communication",
  "aml-cft": "aml",
  "gender-sensitization": "equality",
  "customer-experience": "experience",
  "green-banking": "green",
  "conflict-management": "conflict",
  "ae-cbuae-law-2025": "law",
  "pk-sbp-fx-remittance-branchless": "fx",
};

/** Picks the illustration for a course from its slug (regulatory quests by topic keywords). */
export function motifFor(slug: string): Motif {
  if (BY_SLUG[slug]) return BY_SLUG[slug];
  const s = slug.slice(3);
  if (/workplace|whs/.test(s)) return "workplace";
  if (/privacy|popia|data-protection/.test(s) && !/cyber/.test(s)) return "privacy";
  if (/cyber|ict|rmit|technology|infosec|rbi-cybersecurity/.test(s)) return "cyber";
  if (/aml|ctf|cft|apu|fintrac|fic-act|financial-crime|mlr|bsa/.test(s)) return "aml";
  if (/consumer|customer|fair|fcac|conduct|fais|ftc/.test(s)) return "consumer";
  if (/governance|compliance|certification|fp/.test(s)) return "governance";
  return "governance";
}

const W = "rgba(255,255,255,0.92)";
const W2 = "rgba(255,255,255,0.55)";
const W3 = "rgba(255,255,255,0.18)";

function art(m: Motif, c: string): ReactNode {
  switch (m) {
    case "leadership":
      return (
        <>
          <path d="M-190 170 L-60 -40 L10 60 L90 -120 L230 170 Z" fill={W3} stroke={W2} strokeWidth="4" strokeLinejoin="round" />
          <path d="M90 -120 L125 -62 L100 -70 L82 -50 L60 -72 Z" fill={W} />
          <line x1="90" y1="-120" x2="90" y2="-215" stroke={W} strokeWidth="6" strokeLinecap="round" />
          <path d="M90 -215 L170 -192 L90 -165 Z" fill={c} stroke={W} strokeWidth="4" strokeLinejoin="round" />
          <path d="M-150 170 C-80 120 -40 140 0 100 S70 40 90 -40" fill="none" stroke={W} strokeWidth="5" strokeDasharray="4 14" strokeLinecap="round" />
          <circle cx="-120" cy="150" r="10" fill={c} stroke={W} strokeWidth="4" />
        </>
      );
    case "executive":
      return (
        <>
          <rect x="-150" y="120" width="300" height="46" rx="12" fill={W3} stroke={W2} strokeWidth="4" />
          <path d="M-90 120 L-70 0 L70 0 L90 120 Z" fill={W3} stroke={W} strokeWidth="5" strokeLinejoin="round" />
          <rect x="-80" y="-30" width="160" height="34" rx="10" fill={W} />
          <circle cx="0" cy="-95" r="58" fill={W3} stroke={W} strokeWidth="5" />
          <path d="M-32 -150 L-18 -186 L0 -158 L18 -186 L32 -150" fill="none" stroke={c} strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M-36 -146 H36" stroke={W} strokeWidth="6" strokeLinecap="round" />
        </>
      );
    case "ai":
      return (
        <>
          <rect x="-110" y="-110" width="220" height="220" rx="34" fill={W3} stroke={W} strokeWidth="5" />
          <rect x="-62" y="-62" width="124" height="124" rx="20" fill={c} stroke={W} strokeWidth="4" />
          <text x="0" y="22" textAnchor="middle" fontSize="64" fontWeight="800" fill="#fff" fontFamily="system-ui, sans-serif">
            AI
          </text>
          {[-70, -23, 23, 70].map((p) => (
            <g key={p} stroke={W2} strokeWidth="5" strokeLinecap="round">
              <line x1={p} y1="-110" x2={p} y2="-150" />
              <line x1={p} y1="110" x2={p} y2="150" />
              <line x1="-110" y1={p} x2="-150" y2={p} />
              <line x1="110" y1={p} x2="150" y2={p} />
            </g>
          ))}
          {[
            [-200, -150],
            [210, -130],
            [-210, 140],
            [200, 160],
          ].map(([x, y]) => (
            <g key={`${x}${y}`}>
              <line x1={x * 0.75} y1={y * 0.75} x2={x} y2={y} stroke={W2} strokeWidth="3" />
              <circle cx={x} cy={y} r="14" fill={W} />
            </g>
          ))}
        </>
      );
    case "database":
      return (
        <>
          {[90, 0, -90].map((y, i) => (
            <g key={y}>
              <path d={`M-120 ${y - 40} V${y + 30} A120 36 0 0 0 120 ${y + 30} V${y - 40}`} fill={i === 2 ? c : W3} stroke={W} strokeWidth="5" />
              <ellipse cx="0" cy={y - 40} rx="120" ry="36" fill={i === 2 ? c : "rgba(255,255,255,0.25)"} stroke={W} strokeWidth="5" />
            </g>
          ))}
          <text x="175" y="-110" fontSize="58" fontWeight="800" fill={W} fontFamily="ui-monospace, monospace">
            {"{ }"}
          </text>
          <text x="150" y="150" fontSize="34" fontWeight="700" fill={W2} fontFamily="ui-monospace, monospace">
            SELECT *
          </text>
        </>
      );
    case "infrastructure":
      return (
        <>
          <path d="M-60 -120 a70 70 0 0 1 130 -20 a55 55 0 1 1 20 105 H-70 a62 62 0 1 1 10 -85 Z" fill={W3} stroke={W} strokeWidth="5" />
          {[-150, -40, 70].map((x, i) => (
            <g key={x}>
              <rect x={x} y="30" width="90" height="150" rx="12" fill={i === 1 ? c : W3} stroke={W} strokeWidth="5" />
              {[60, 100, 140].map((y) => (
                <g key={y}>
                  <line x1={x + 16} y1={y} x2={x + 56} y2={y} stroke={W} strokeWidth="5" strokeLinecap="round" />
                  <circle cx={x + 72} cy={y} r="5" fill={W} />
                </g>
              ))}
            </g>
          ))}
          <line x1="5" y1="-35" x2="5" y2="30" stroke={W} strokeWidth="4" strokeDasharray="6 8" />
        </>
      );
    case "people":
    case "talent": {
      const person = (x: number, y: number, s: number, fill: string) => (
        <g key={`${x}`} transform={`translate(${x} ${y}) scale(${s})`}>
          <circle cx="0" cy="-70" r="38" fill={fill} stroke={W} strokeWidth="5" />
          <path d="M-62 40 C-62 -20 62 -20 62 40 Z" fill={fill} stroke={W} strokeWidth="5" strokeLinejoin="round" />
        </g>
      );
      return (
        <>
          {person(-130, 90, 0.8, W3)}
          {person(130, 90, 0.8, W3)}
          {person(0, 80, 1.1, m === "talent" ? W3 : c)}
          {m === "talent" ? (
            <>
              <path d="M0 -200 L22 -156 L70 -150 L34 -116 L44 -68 L0 -92 L-44 -68 L-34 -116 L-70 -150 L-22 -156 Z" fill={c} stroke={W} strokeWidth="5" strokeLinejoin="round" />
              <path d="M150 -60 L210 -120 M210 -120 H170 M210 -120 V-80" stroke={W} strokeWidth="7" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              <rect x="150" y="-170" width="80" height="100" rx="10" fill={W3} stroke={W} strokeWidth="5" />
              <path d="M168 -135 H212 M168 -112 H212 M168 -89 H195" stroke={W} strokeWidth="5" strokeLinecap="round" />
            </>
          )}
        </>
      );
    }
    case "equality":
      return (
        <>
          <circle cx="-95" cy="-70" r="42" fill={c} stroke={W} strokeWidth="5" />
          <path d="M-165 80 C-165 10 -25 10 -25 80 Z" fill={c} stroke={W} strokeWidth="5" />
          <circle cx="95" cy="-70" r="42" fill={W3} stroke={W} strokeWidth="5" />
          <path d="M25 80 C25 10 165 10 165 80 Z" fill={W3} stroke={W} strokeWidth="5" />
          <rect x="-200" y="110" width="400" height="16" rx="8" fill={W} />
          <path d="M-22 -200 H22 M-22 -180 H22" stroke={W} strokeWidth="9" strokeLinecap="round" />
          <path d="M0 -150 C-40 -180 -70 -140 0 -100 C70 -140 40 -180 0 -150 Z" fill={W} transform="translate(0 290) scale(0.6)" opacity="0.9" />
        </>
      );
    case "procurement":
      return (
        <>
          <path d="M-200 -120 H-150 L-110 60 H110 L140 -70 H-135" fill="none" stroke={W} strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx="-80" cy="110" r="24" fill={W} />
          <circle cx="80" cy="110" r="24" fill={W} />
          <rect x="-90" y="-130" width="110" height="100" rx="10" fill={c} stroke={W} strokeWidth="5" />
          <rect x="30" y="-160" width="90" height="130" rx="10" fill={W3} stroke={W} strokeWidth="5" />
          <path d="M50 -95 L70 -75 L102 -115" fill="none" stroke={W} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "communication":
      return (
        <>
          <path d="M-210 -150 H40 a30 30 0 0 1 30 30 V0 a30 30 0 0 1 -30 30 H-120 L-170 80 V30 H-210 a30 30 0 0 1 -30 -30 V-120 a30 30 0 0 1 30 -30 Z" fill={c} stroke={W} strokeWidth="5" />
          {[-150, -85, -20].map((x) => (
            <circle key={x} cx={x} cy="-60" r="14" fill={W} />
          ))}
          <path d="M0 50 H200 a30 30 0 0 1 30 30 V170 a30 30 0 0 1 -30 30 H170 V250 L120 200 H0 a30 30 0 0 1 -30 -30 V80 a30 30 0 0 1 30 -30 Z" fill={W3} stroke={W} strokeWidth="5" transform="translate(0 -60)" />
          <path d="M30 70 H170 M30 110 H130" stroke={W} strokeWidth="8" strokeLinecap="round" />
        </>
      );
    case "aml":
      return (
        <>
          <path d="M-60 -200 L60 -160 V-40 C60 40 0 90 -60 120 C-120 90 -180 40 -180 -40 V-160 Z" fill={W3} stroke={W} strokeWidth="6" strokeLinejoin="round" transform="translate(-20 30)" />
          <text x="-80" y="-10" textAnchor="middle" fontSize="110" fontWeight="800" fill={W} fontFamily="system-ui, sans-serif">
            $
          </text>
          <circle cx="90" cy="40" r="78" fill="rgba(255,255,255,0.12)" stroke={W} strokeWidth="12" />
          <line x1="145" y1="95" x2="215" y2="165" stroke={W} strokeWidth="22" strokeLinecap="round" />
          <circle cx="60" cy="20" r="10" fill={c} />
          <circle cx="115" cy="60" r="10" fill={c} />
          <circle cx="75" cy="75" r="10" fill={c} />
          <path d="M60 20 L115 60 L75 75 Z" fill="none" stroke={c} strokeWidth="4" />
        </>
      );
    case "consumer":
      return (
        <>
          <path d="M0 -200 L140 -150 V-30 C140 70 70 130 0 165 C-70 130 -140 70 -140 -30 V-150 Z" fill={W3} stroke={W} strokeWidth="6" strokeLinejoin="round" />
          <path d="M0 -10 C-60 -60 -100 0 0 70 C100 0 60 -60 0 -10 Z" fill={c} stroke={W} strokeWidth="5" transform="translate(0 -40)" />
          <circle cx="-200" cy="80" r="30" fill={W} />
          <path d="M-250 175 C-250 115 -150 115 -150 175 Z" fill={W} />
          <circle cx="200" cy="80" r="30" fill={W2} />
          <path d="M150 175 C150 115 250 115 250 175 Z" fill={W2} />
        </>
      );
    case "cyber":
      return (
        <>
          <path d="M-70 -40 V-100 a70 70 0 0 1 140 0 V-40" fill="none" stroke={W} strokeWidth="18" />
          <rect x="-120" y="-40" width="240" height="190" rx="28" fill={c} stroke={W} strokeWidth="6" />
          <circle cx="0" cy="40" r="26" fill={W} />
          <rect x="-9" y="50" width="18" height="50" rx="9" fill={W} />
          {[
            "M-120 0 H-200 V-80",
            "M-120 100 H-220",
            "M120 20 H210 V-60",
            "M120 110 H200 V170",
          ].map((d) => (
            <path key={d} d={d} fill="none" stroke={W2} strokeWidth="5" strokeLinecap="round" />
          ))}
          {[
            [-200, -80],
            [-220, 100],
            [210, -60],
            [200, 170],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="11" fill={W} />
          ))}
        </>
      );
    case "governance":
      return (
        <>
          <path d="M-200 -70 L0 -190 L200 -70 Z" fill={c} stroke={W} strokeWidth="6" strokeLinejoin="round" />
          {[-150, -75, 0, 75, 150].map((x) => (
            <rect key={x} x={x - 18} y="-55" width="36" height="170" rx="6" fill={W3} stroke={W} strokeWidth="5" />
          ))}
          <rect x="-220" y="120" width="440" height="34" rx="8" fill={W} />
          <rect x="-200" y="-70" width="400" height="20" rx="4" fill={W2} />
          <circle cx="0" cy="-110" r="18" fill={W} />
        </>
      );
    case "law":
      return (
        <>
          <line x1="0" y1="-190" x2="0" y2="130" stroke={W} strokeWidth="12" strokeLinecap="round" />
          <line x1="-170" y1="-140" x2="170" y2="-140" stroke={W} strokeWidth="10" strokeLinecap="round" />
          <path d="M-170 -140 L-220 -20 H-120 Z M170 -140 L120 -20 H220 Z" fill="none" stroke={W2} strokeWidth="5" strokeLinejoin="round" />
          <path d="M-235 -20 a65 40 0 0 0 130 0 Z" fill={c} stroke={W} strokeWidth="5" />
          <path d="M105 -20 a65 40 0 0 0 130 0 Z" fill={c} stroke={W} strokeWidth="5" />
          <rect x="-90" y="130" width="180" height="34" rx="10" fill={W} />
          <circle cx="0" cy="-190" r="18" fill={c} stroke={W} strokeWidth="5" />
        </>
      );
    case "fx":
      return (
        <>
          <circle cx="0" cy="0" r="150" fill={W3} stroke={W} strokeWidth="6" />
          <ellipse cx="0" cy="0" rx="65" ry="150" fill="none" stroke={W2} strokeWidth="5" />
          <path d="M-150 0 H150 M-130 -75 H130 M-130 75 H130" stroke={W2} strokeWidth="5" />
          <path d="M-210 -120 A240 240 0 0 1 120 -230" fill="none" stroke={c} strokeWidth="12" strokeLinecap="round" />
          <path d="M120 -230 l-40 -6 m40 6 l-14 36" stroke={c} strokeWidth="12" strokeLinecap="round" />
          <path d="M210 120 A240 240 0 0 1 -120 230" fill="none" stroke={W} strokeWidth="12" strokeLinecap="round" />
          <circle cx="-215" cy="-150" r="40" fill={c} stroke={W} strokeWidth="5" />
          <text x="-215" y="-134" textAnchor="middle" fontSize="44" fontWeight="800" fill="#fff" fontFamily="system-ui, sans-serif">
            $
          </text>
          <circle cx="220" cy="150" r="40" fill={W} />
          <text x="220" y="165" textAnchor="middle" fontSize="34" fontWeight="800" fill={c} fontFamily="system-ui, sans-serif">
            Rs
          </text>
        </>
      );
    case "workplace":
      return (
        <>
          <path d="M-150 20 a150 140 0 0 1 300 0 Z" fill={c} stroke={W} strokeWidth="6" />
          <rect x="-185" y="15" width="370" height="34" rx="14" fill={W} />
          <rect x="-24" y="-130" width="48" height="150" rx="14" fill={W3} stroke={W} strokeWidth="5" />
          <path d="M-90 120 L-40 170 L80 70" fill="none" stroke={W} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "green":
      return (
        <>
          <path d="M-160 140 C-190 -60 -20 -190 170 -180 C180 10 70 160 -160 140 Z" fill={c} stroke={W} strokeWidth="6" />
          <path d="M-160 140 C-60 40 40 -40 140 -150" fill="none" stroke={W} strokeWidth="6" strokeLinecap="round" />
          <path d="M-60 60 L-20 -20 M10 10 L60 -60" stroke={W2} strokeWidth="5" strokeLinecap="round" />
          <circle cx="160" cy="110" r="62" fill={W} />
          <text x="160" y="132" textAnchor="middle" fontSize="64" fontWeight="800" fill={c} fontFamily="system-ui, sans-serif">
            $
          </text>
        </>
      );
    case "experience":
      return (
        <>
          <circle cx="0" cy="-30" r="130" fill={c} stroke={W} strokeWidth="6" />
          <circle cx="-45" cy="-65" r="14" fill={W} />
          <circle cx="45" cy="-65" r="14" fill={W} />
          <path d="M-65 0 Q0 70 65 0" fill="none" stroke={W} strokeWidth="12" strokeLinecap="round" />
          {[-160, -80, 0, 80, 160].map((x) => (
            <path
              key={x}
              d="M0 -26 L8 -8 L28 -6 L13 7 L17 26 L0 16 L-17 26 L-13 7 L-28 -6 L-8 -8 Z"
              transform={`translate(${x} 160) scale(1.3)`}
              fill={W}
            />
          ))}
        </>
      );
    case "conflict":
      return (
        <>
          <path d="M-230 -40 H-60 M-110 -90 L-60 -40 L-110 10" fill="none" stroke={c} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M230 40 H60 M110 -10 L60 40 L110 90" fill="none" stroke={W} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="0" cy="0" r="46" fill={W3} stroke={W} strokeWidth="6" />
          <path d="M-20 0 L-5 15 L22 -15" fill="none" stroke={W} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M-140 120 a40 40 0 0 1 80 0 M60 -120 a40 40 0 0 1 80 0" fill="none" stroke={W2} strokeWidth="6" />
        </>
      );
    case "privacy":
      return (
        <>
          <path d="M-130 -190 H60 L130 -120 V170 H-130 Z" fill={W3} stroke={W} strokeWidth="6" strokeLinejoin="round" />
          <path d="M60 -190 V-120 H130" fill="none" stroke={W} strokeWidth="6" />
          <path d="M-90 -120 H20 M-90 -80 H80 M-90 -40 H60" stroke={W2} strokeWidth="8" strokeLinecap="round" />
          <path d="M40 40 V10 a50 50 0 0 1 100 0 V40" fill="none" stroke={W} strokeWidth="14" />
          <rect x="10" y="40" width="160" height="120" rx="20" fill={c} stroke={W} strokeWidth="6" />
          <circle cx="90" cy="95" r="16" fill={W} />
        </>
      );
  }
}

/** Shades a hex colour towards black (0..1). */
function darken(hex: string, amount: number) {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const f = (v: number) => Math.round(v * (1 - amount));
  return `rgb(${f((n >> 16) & 255)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

export function CourseCover({
  slug,
  color,
  flag = null,
  label,
  className = "",
  idSuffix = "",
  image = null,
}: {
  slug: string;
  color: string;
  /** Flag SVG markup for regulatory quests (from flagSvg). */
  flag?: string | null;
  label: string;
  className?: string;
  /** Needed when the same cover appears twice on one page, so the SVG gradient ids stay unique. */
  idSuffix?: string;
  /** Uploaded or bundled title picture; when set it replaces the drawn artwork. */
  image?: string | null;
}) {
  const id = `cv-${slug}${idSuffix}`;
  const motif = motifFor(slug);
  if (image)
    return (
      <span className={`cover cover--photo ${className}`} {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" loading="lazy" decoding="async" />
        {flag && <span className="cover__flag" dangerouslySetInnerHTML={{ __html: flag }} />}
      </span>
    );
  return (
    <span className={`cover ${className}`} {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}>
      <svg viewBox="0 0 1200 630" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={darken(color, 0.15)} />
            <stop offset="0.55" stopColor={darken(color, 0.62)} />
            <stop offset="1" stopColor="#07070c" />
          </linearGradient>
          <radialGradient id={`${id}-glow`} cx="0.7" cy="0.45" r="0.55">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <pattern id={`${id}-dots`} width="34" height="34" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="2" fill="#fff" opacity="0.12" />
          </pattern>
        </defs>
        <rect width="1200" height="630" fill={`url(#${id}-bg)`} />
        <rect width="1200" height="630" fill={`url(#${id}-dots)`} />
        <circle cx="840" cy="300" r="330" fill={`url(#${id}-glow)`} />
        <circle cx="840" cy="315" r="250" fill="none" stroke="#fff" strokeOpacity="0.1" strokeWidth="2" />
        <circle cx="840" cy="315" r="300" fill="none" stroke="#fff" strokeOpacity="0.06" strokeWidth="2" strokeDasharray="6 12" />
        <circle cx="140" cy="560" r="180" fill={color} opacity="0.25" />
        <g transform="translate(840 330)">{art(motif, color)}</g>
      </svg>
      {flag && <span className="cover__flag" dangerouslySetInnerHTML={{ __html: flag }} />}
    </span>
  );
}
