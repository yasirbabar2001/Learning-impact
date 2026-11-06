"use client";

import Link from "next/link";
import { animate, AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { levelFor } from "@/lib/portal/levels";
import { play } from "@/lib/portal/sfx";

const COLORS = ["#ff4d6d", "#ff9f1c", "#ffd23f", "#2ee59d", "#00c2ff", "#7b61ff", "#ff4dd8"];
const rand = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const PIECES = Array.from({ length: 56 }, (_, i) => ({
  x: (rand(i, 1) - 0.5) * 1100,
  y: -200 - rand(i, 2) * 420,
  r: rand(i, 3) * 900 - 450,
  c: COLORS[i % COLORS.length],
  d: rand(i, 4) * 0.3,
  w: 7 + rand(i, 5) * 9,
}));

export type CelebrationAction = { label: string; href?: string; onClick?: () => void; primary?: boolean; pending?: boolean };

/**
 * Full-screen reward moment: confetti, a big icon, XP counting up and the level bar filling.
 * Shows a level-up banner when the XP crosses a level.
 */
export function Celebration({
  icon,
  title,
  subtitle,
  xpBefore,
  xpGained,
  actions,
  share,
}: {
  icon: string;
  title: string;
  subtitle: string;
  xpBefore: number;
  xpGained: number;
  actions: CelebrationAction[];
  share?: { text: string; url: string };
}) {
  const before = levelFor(xpBefore);
  const after = levelFor(xpBefore + xpGained);
  const levelled = after.index > before.index;
  const [shown, setShown] = useState(0);
  const [bar, setBar] = useState(before.progress);

  useEffect(() => {
    play(levelled ? "levelup" : "win");
    const c = animate(0, xpGained, { duration: 1.2, delay: 0.4, ease: "easeOut", onUpdate: (v) => setShown(Math.round(v)) });
    const t = setTimeout(() => setBar(levelled ? 1 : after.progress), 600);
    const t2 = levelled ? setTimeout(() => setBar(after.progress), 1700) : undefined;
    return () => {
      c.stop();
      clearTimeout(t);
      if (t2) clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wa = share ? `https://wa.me/?text=${encodeURIComponent(`${share.text} ${share.url}`)}` : null;
  const li = share ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(share.url)}` : null;

  return (
    <motion.div className="celebrate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="dialog" aria-modal="true" aria-label={title}>
      <div className="celebrate__confetti" aria-hidden="true">
        {/* Plain CSS animation: far cheaper than animating 70 components in JavaScript. */}
        {PIECES.map((p, i) => (
          <span
            key={i}
            style={{ background: p.c, width: p.w, height: p.w * 0.45, ["--x" as string]: `${p.x}px`, ["--y" as string]: `${p.y}px`, ["--r" as string]: `${p.r}deg`, animationDelay: `${p.d}s` }}
          />
        ))}
      </div>
      <motion.div className="celebrate__card glass" initial={{ scale: 0.7, y: 40 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 220, damping: 18 }}>
        <motion.span className="celebrate__icon" initial={{ scale: 0, rotate: -180 }} animate={{ scale: [0, 1.3, 1], rotate: 0 }} transition={{ duration: 0.9, delay: 0.1 }}>
          {icon}
        </motion.span>
        <h2>{title}</h2>
        <p className="muted">{subtitle}</p>
        {xpGained > 0 && (
          <motion.p className="celebrate__xp" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}>
            +{shown} XP
          </motion.p>
        )}
        <div className="celebrate__level">
          <span>
            L{levelled && bar === 1 ? before.index : after.index} {levelled && bar === 1 ? before.name : after.name}
          </span>
          <div className="level-card__bar">
            <motion.span animate={{ width: `${Math.round(bar * 100)}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
          </div>
          <span className="muted">{after.next ? `${after.toNext} XP to ${after.next.name}` : "Legend!"}</span>
        </div>
        <AnimatePresence>
          {levelled && (
            <motion.div className="celebrate__levelup" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.7, type: "spring" }}>
              ⬆️ Level up! You are now <strong>{after.name}</strong>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="lesson__actions celebrate__actions">
          {actions.map((a) =>
            a.pending ? (
              <button key={a.label} className={`btn ${a.primary ? "btn--primary" : "btn--ghost"}`} disabled>
                <span className="btn__label">Saving…</span>
              </button>
            ) : a.href ? (
              <Link key={a.label} href={a.href} className={`btn ${a.primary ? "btn--primary" : "btn--ghost"}`}>
                <span className="btn__label">{a.label}</span>
                {a.primary && <span className="btn__arrow">→</span>}
              </Link>
            ) : (
              <button key={a.label} className={`btn ${a.primary ? "btn--primary" : "btn--ghost"}`} onClick={a.onClick}>
                <span className="btn__label">{a.label}</span>
                {a.primary && <span className="btn__arrow">→</span>}
              </button>
            ),
          )}
        </div>
        {share && (
          <div className="share-row">
            <span className="muted">Share it:</span>
            <a href={wa!} target="_blank" rel="noopener noreferrer" className="share-btn share-btn--wa">
              WhatsApp
            </a>
            <a href={li!} target="_blank" rel="noopener noreferrer" className="share-btn share-btn--li">
              LinkedIn
            </a>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
