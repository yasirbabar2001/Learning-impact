import type { ReactNode } from "react";

/**
 * Building blocks for the course cover scenes: flat-style people, a skyline with the country's landmark, and three
 * layouts (presenting at a board, working at a desk, serving a customer). Everything is drawn in a 1200 × 630 box.
 */

const SKIN = ["#f1c7a5", "#d9a27a", "#b97a52", "#8d5a3b", "#6b4029", "#e6b48f"];
const HAIR = ["#1c1410", "#3a2416", "#5b3a22", "#2a2a2e", "#8a5a2b", "#111111"];
const SCARF = ["#2f3e8f", "#7a2950", "#1f6f6a", "#5a3d8a", "#9a4a2a"];
const TOPS = ["#2b3a67", "#f4f1ea", "#3d5a80", "#1f2933", "#7b2d43", "#2a6f4f", "#4b3f72", "#e9ecef"];
const BOTTOMS = ["#1f2430", "#2d3142", "#3b3b44", "#26364a"];

/** A small deterministic hash so each course always gets the same people. */
export function seedOf(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
const pick = <T,>(list: T[], seed: number, salt: number) => list[(seed >>> (salt % 24)) % list.length];

export type Look = { skin: string; hair: string; top: string; bottom: string; style: "short" | "long" | "scarf" | "bun" };
export function lookFor(seed: number, n: number): Look {
  const s = seedOf(`${seed}-${n}`);
  const styles: Look["style"][] = ["short", "long", "scarf", "bun", "short"];
  const style = pick(styles, s, 3);
  return { skin: pick(SKIN, s, 1), hair: style === "scarf" ? pick(SCARF, s, 7) : pick(HAIR, s, 5), top: pick(TOPS, s, 9), bottom: pick(BOTTOMS, s, 11), style };
}

function Head({ look, cy }: { look: Look; cy: number }) {
  const { skin, hair, style } = look;
  return (
    <g>
      {style === "long" && <path d={`M-44 ${cy - 6} Q-48 ${cy + 58} -30 ${cy + 70} H30 Q48 ${cy + 58} 44 ${cy - 6} Z`} fill={hair} />}
      {style === "scarf" && <path d={`M-50 ${cy} Q-56 ${cy + 70} -62 ${cy + 96} H62 Q56 ${cy + 70} 50 ${cy} A50 52 0 0 0 -50 ${cy} Z`} fill={hair} />}
      <rect x="-11" y={cy + 26} width="22" height="26" rx="6" fill={skin} />
      <ellipse cx="0" cy={cy} rx="34" ry="38" fill={skin} />
      {style === "short" && <path d={`M-35 ${cy - 4} Q-38 ${cy - 44} 0 ${cy - 44} Q38 ${cy - 44} 35 ${cy - 4} Q22 ${cy - 26} -6 ${cy - 24} Q-26 ${cy - 22} -35 ${cy - 4} Z`} fill={hair} />}
      {style === "long" && <path d={`M-37 ${cy + 6} Q-40 ${cy - 46} 0 ${cy - 44} Q40 ${cy - 46} 37 ${cy + 6} Q30 ${cy - 22} 0 ${cy - 26} Q-30 ${cy - 22} -37 ${cy + 6} Z`} fill={hair} />}
      {style === "bun" && (
        <>
          <circle cx="0" cy={cy - 48} r="17" fill={hair} />
          <path d={`M-35 ${cy - 2} Q-38 ${cy - 44} 0 ${cy - 42} Q38 ${cy - 44} 35 ${cy - 2} Q20 ${cy - 24} 0 ${cy - 24} Q-20 ${cy - 24} -35 ${cy - 2} Z`} fill={hair} />
        </>
      )}
      {style === "scarf" && <path d={`M-38 ${cy + 4} A38 44 0 0 1 38 ${cy + 4} Q30 ${cy - 30} 0 ${cy - 32} Q-30 ${cy - 30} -38 ${cy + 4} Z`} fill={hair} />}
      <circle cx="-12" cy={cy + 2} r="3.4" fill="#2b1d16" opacity="0.8" />
      <circle cx="12" cy={cy + 2} r="3.4" fill="#2b1d16" opacity="0.8" />
      <path d={`M-9 ${cy + 16} Q0 ${cy + 23} 9 ${cy + 16}`} fill="none" stroke="#7a3b2e" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
    </g>
  );
}

/** A standing person, feet at (x, y). `point` raises the right arm towards the right. */
export function Standing({ x, y, scale = 1, look, pose = "neutral", flip = false }: { x: number; y: number; scale?: number; look: Look; pose?: "neutral" | "point" | "wave"; flip?: boolean }) {
  const { skin, top, bottom } = look;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <ellipse cx="0" cy="4" rx="70" ry="10" fill="#000" opacity="0.25" />
      <rect x="-30" y="-160" width="26" height="158" rx="11" fill={bottom} />
      <rect x="4" y="-160" width="26" height="158" rx="11" fill={bottom} />
      <ellipse cx="-20" cy="-2" rx="20" ry="9" fill="#151515" />
      <ellipse cx="20" cy="-2" rx="20" ry="9" fill="#151515" />
      <path d="M-58 -150 V-262 Q-58 -300 -20 -304 H20 Q58 -300 58 -262 V-150 Z" fill={top} />
      <path d="M-14 -304 L0 -276 L14 -304 Z" fill={skin} opacity="0.95" />
      <path d="M-56 -270 Q-80 -210 -66 -150" fill="none" stroke={top} strokeWidth="24" strokeLinecap="round" />
      <circle cx="-66" cy="-146" r="12" fill={skin} />
      {pose === "neutral" && (
        <>
          <path d="M56 -270 Q80 -210 66 -150" fill="none" stroke={top} strokeWidth="24" strokeLinecap="round" />
          <circle cx="66" cy="-146" r="12" fill={skin} />
        </>
      )}
      {pose === "point" && (
        <>
          <path d="M54 -276 Q110 -300 160 -342" fill="none" stroke={top} strokeWidth="24" strokeLinecap="round" />
          <circle cx="166" cy="-348" r="13" fill={skin} />
          <path d="M170 -354 L190 -372" stroke={skin} strokeWidth="8" strokeLinecap="round" />
        </>
      )}
      {pose === "wave" && (
        <>
          <path d="M54 -276 Q96 -300 100 -360" fill="none" stroke={top} strokeWidth="24" strokeLinecap="round" />
          <circle cx="100" cy="-372" r="13" fill={skin} />
        </>
      )}
      <Head look={look} cy={-344} />
    </g>
  );
}

/** Head and shoulders, seen from behind (an audience member), base at (x, y). */
export function Audience({ x, y, look, scale = 1 }: { x: number; y: number; look: Look; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-70 0 Q-70 -70 0 -76 Q70 -70 70 0 Z" fill={look.top} />
      <ellipse cx="0" cy="-112" rx="34" ry="38" fill={look.style === "scarf" ? look.hair : look.skin} />
      {look.style !== "scarf" && <path d="M-35 -104 Q-38 -152 0 -152 Q38 -152 35 -104 Q34 -88 0 -86 Q-34 -88 -35 -104 Z" fill={look.hair} />}
      {look.style === "long" && <path d="M-34 -110 Q-40 -60 -26 -58 H26 Q40 -60 34 -110 Z" fill={look.hair} />}
    </g>
  );
}

/** Upper body behind a desk or counter (everything below `y` is hidden by it). */
export function Seated({ x, y, look, typing = true, scale = 1 }: { x: number; y: number; look: Look; typing?: boolean; scale?: number }) {
  const { skin, top } = look;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-62 30 V-82 Q-62 -122 -22 -126 H22 Q62 -122 62 -82 V30 Z" fill={top} />
      <path d="M-14 -126 L0 -98 L14 -126 Z" fill={skin} />
      {typing ? (
        <>
          <path d="M-58 -88 Q-84 -30 -40 0" fill="none" stroke={top} strokeWidth="24" strokeLinecap="round" />
          <path d="M58 -88 Q84 -30 40 0" fill="none" stroke={top} strokeWidth="24" strokeLinecap="round" />
          <circle cx="-34" cy="2" r="12" fill={skin} />
          <circle cx="34" cy="2" r="12" fill={skin} />
        </>
      ) : (
        <>
          <path d="M-58 -88 Q-84 -30 -60 10" fill="none" stroke={top} strokeWidth="24" strokeLinecap="round" />
          <path d="M58 -88 Q100 -110 120 -150" fill="none" stroke={top} strokeWidth="24" strokeLinecap="round" />
          <circle cx="124" cy="-160" r="12" fill={skin} />
        </>
      )}
      <Head look={look} cy={-166} />
    </g>
  );
}

/* ---------- Skylines ---------- */

const LANDMARK: Record<string, string> = {
  pk: "M-70 0 H70 V-14 H52 L24 -70 L10 -250 L0 -300 L-10 -250 L-24 -70 L-52 -14 H-70 Z",
  ae: "M-46 0 V-70 H-34 V-140 H-24 V-205 H-15 V-258 H-8 V-300 L0 -360 L8 -300 V-258 H15 V-205 H24 V-140 H34 V-70 H46 V0 Z",
  gb: "M-30 0 V-190 H-36 V-206 H36 V-190 H30 V0 Z M-26 -206 V-250 H26 V-206 Z M-24 -250 L0 -320 L24 -250 Z",
  us: "M-130 0 V-56 H-80 V-80 H80 V-56 H130 V0 Z M-70 -80 Q-70 -170 0 -176 Q70 -170 70 -80 Z M-12 -176 V-206 H12 V-176 Z",
  ca: "M-10 0 L-7 -190 Q-34 -196 -34 -212 Q-34 -228 -6 -232 L-4 -290 L-2 -350 L2 -350 L4 -290 L6 -232 Q34 -228 34 -212 Q34 -196 7 -190 L10 0 Z",
  au: "M-150 0 H150 V-20 H-150 Z M-120 -20 Q-110 -120 -40 -150 Q-70 -80 -60 -20 Z M-60 -20 Q-40 -150 40 -190 Q0 -90 10 -20 Z M10 -20 Q40 -130 120 -150 Q80 -80 90 -20 Z",
  my: "M-80 0 V-200 L-70 -250 L-62 -320 L-54 -250 L-44 -200 V0 Z M44 0 V-200 L54 -250 L62 -320 L70 -250 L80 -200 V0 Z M-44 -150 H44 V-136 H-44 Z",
  id: "M-110 0 V-30 H110 V0 Z M-70 -30 V-56 H70 V-30 Z M-14 -56 L-8 -260 H8 L14 -56 Z M-18 -260 H18 V-272 H-18 Z M0 -272 Q-14 -292 -4 -312 Q0 -296 8 -300 Q16 -288 0 -272 Z",
  in: "M-90 0 V-200 H90 V0 H40 V-110 A40 40 0 0 0 -40 -110 V0 Z M-100 -200 H100 V-222 H-100 Z M-60 -222 H60 V-250 H-60 Z",
  bd: "M-130 0 V-170 H130 V0 Z M-60 -110 A30 30 0 1 0 -60 -109 Z M30 -40 L60 -120 L90 -40 Z",
  sa: "M-46 0 V-300 Q0 -230 46 -300 V0 Z",
  qa: "M-40 0 V-220 Q-40 -300 0 -310 Q40 -300 40 -220 V0 Z M-4 -310 V-350 H4 V-310 Z",
  bh: "M-90 0 Q-60 -150 -30 -300 Q-14 -150 -14 0 Z M14 0 Q14 -150 30 -300 Q60 -150 90 0 Z M-26 -90 H26 V-80 H-26 Z M-26 -170 H26 V-160 H-26 Z M-24 -240 H24 V-230 H-24 Z",
  za: "M-220 0 L-170 -90 L-140 -150 H140 L170 -90 L220 0 Z",
  sg: "M-90 0 V-200 H-50 V0 Z M-30 0 V-210 H10 V0 Z M30 0 V-200 H70 V0 Z M-110 -210 Q0 -250 110 -210 V-196 H-110 Z",
};

/** A city skyline along the bottom with the country's landmark, base at y. */
export function Skyline({ y, country, seed, color }: { y: number; country: string | null; seed: number; color: string }) {
  const blocks: ReactNode[] = [];
  let x = 0;
  let i = 0;
  while (x < 1200) {
    const w = 40 + ((seed >> (i % 20)) % 50);
    const h = 60 + ((seed >> ((i * 3) % 22)) % 130);
    blocks.push(<rect key={i} x={x} y={y - h} width={w - 6} height={h} rx="3" />);
    x += w;
    i++;
  }
  const mark = country && LANDMARK[country];
  return (
    <g>
      <g fill={color} opacity="0.1">
        {blocks}
      </g>
      {mark && (
        <g transform={`translate(190 ${y})`}>
          <path d={mark} fill="#fff" opacity="0.32" />
        </g>
      )}
    </g>
  );
}

/* ---------- Props ---------- */

export function Board({ x, y, w, h, children, accent }: { x: number; y: number; w: number; h: number; children: ReactNode; accent: string }) {
  return (
    <g>
      <line x1={x + 40} y1={y + h} x2={x + 20} y2={y + h + 130} stroke="#c9ccd6" strokeWidth="8" strokeLinecap="round" />
      <line x1={x + w - 40} y1={y + h} x2={x + w - 20} y2={y + h + 130} stroke="#c9ccd6" strokeWidth="8" strokeLinecap="round" />
      <rect x={x} y={y} width={w} height={h} rx="22" fill="#0f1222" stroke="#e8eaf2" strokeWidth="8" />
      <rect x={x + 18} y={y + 18} width={w - 36} height={h - 36} rx="12" fill={accent} opacity="0.35" />
      <g transform={`translate(${x + w / 2} ${y + h / 2 + 6}) scale(${Math.min(w / 640, h / 520)})`}>{children}</g>
    </g>
  );
}

export function Screen({ x, y, w, h, children, accent }: { x: number; y: number; w: number; h: number; children: ReactNode; accent: string }) {
  return (
    <g>
      <rect x={x + w / 2 - 14} y={y + h} width="28" height="60" fill="#9aa0ad" />
      <rect x={x + w / 2 - 80} y={y + h + 56} width="160" height="14" rx="7" fill="#9aa0ad" />
      <rect x={x} y={y} width={w} height={h} rx="20" fill="#0d1020" stroke="#d7dae3" strokeWidth="10" />
      <rect x={x + 16} y={y + 16} width={w - 32} height={h - 32} rx="10" fill={accent} opacity="0.4" />
      <g transform={`translate(${x + w / 2} ${y + h / 2 + 6}) scale(${Math.min(w / 640, h / 520)})`}>{children}</g>
    </g>
  );
}

export function Plant({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-24 0 L-30 -50 H30 L24 0 Z" fill="#c26b3c" />
      <path d="M0 -50 Q-50 -90 -40 -150 Q-10 -110 0 -50 Z M0 -50 Q40 -100 30 -170 Q0 -120 0 -50 Z M0 -50 Q10 -110 -6 -190 Q-20 -120 0 -50 Z" fill="#3aa76d" />
    </g>
  );
}

export function ChartCard({ x, y, accent }: { x: number; y: number; accent: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="170" height="120" rx="16" fill="#ffffff" opacity="0.95" />
      {[30, 60, 90, 120].map((bx, i) => (
        <rect key={bx} x={bx - 10} y={95 - [30, 50, 42, 70][i]} width="20" height={[30, 50, 42, 70][i]} rx="5" fill={i === 3 ? accent : "#c8ccd8"} />
      ))}
      <path d="M22 70 L58 52 L92 60 L140 26" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

export function CheckBadge({ x, y, accent }: { x: number; y: number; accent: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="38" fill={accent} stroke="#fff" strokeWidth="6" />
      <path d="M-15 0 L-4 12 L17 -12" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

export function Bubble({ x, y, w, h, children }: { x: number; y: number; w: number; h: number; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M0 0 H${w} a20 20 0 0 1 20 20 V${h - 20} a20 20 0 0 1 -20 20 H60 L30 ${h + 34} L34 ${h} H0 a20 20 0 0 1 -20 -20 V20 a20 20 0 0 1 20 -20 Z`} fill="#fff" opacity="0.96" />
      {children}
    </g>
  );
}
