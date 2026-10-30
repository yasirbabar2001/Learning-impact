"use client";

import Link from "next/link";
import { motion } from "motion/react";

const COLORS = ["#ff4d6d", "#ff9f1c", "#ffd23f", "#2ee59d", "#00c2ff", "#7b61ff", "#ff4dd8"];

/** Deterministic scatter so the confetti renders the same on every pass. */
const rand = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const PIECES = Array.from({ length: 46 }, (_, i) => ({
  x: (rand(i, 1) - 0.5) * 760,
  y: -120 - rand(i, 2) * 320,
  r: rand(i, 3) * 720 - 360,
  c: COLORS[i % COLORS.length],
  d: rand(i, 4) * 0.25,
  w: 6 + rand(i, 5) * 8,
}));

export function Success({ title, reference, body }: { title: string; reference?: string; body: string }) {
  return (
    <motion.div className="success" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
      <div className="success__confetti" aria-hidden="true">
        {PIECES.map((p, i) => (
          <motion.span
            key={i}
            style={{ background: p.c, width: p.w, height: p.w * 0.45 }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: p.x, y: [0, p.y, p.y + 420], rotate: p.r, opacity: [1, 1, 0] }}
            transition={{ duration: 2.2, delay: p.d, ease: "easeOut", times: [0, 0.35, 1] }}
          />
        ))}
      </div>
      <svg className="success__check" viewBox="0 0 80 80" aria-hidden="true">
        <motion.circle cx="40" cy="40" r="36" fill="none" stroke="url(#rb)" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
        <motion.path d="M24 41 L35 52 L57 29" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.7 }} />
        <defs>
          <linearGradient id="rb" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff4d6d" />
            <stop offset="0.35" stopColor="#ffd23f" />
            <stop offset="0.65" stopColor="#00c2ff" />
            <stop offset="1" stopColor="#ff4dd8" />
          </linearGradient>
        </defs>
      </svg>
      <h2>{title}</h2>
      {reference && (
        <p className="success__ref">
          Your reference <strong>{reference}</strong>
        </p>
      )}
      <p className="muted">{body}</p>
      <div className="success__actions">
        <Link href="/" className="btn btn--ghost">
          <span className="btn__label">Back to home</span>
          <span className="btn__arrow">→</span>
        </Link>
        <Link href="/programs" className="btn btn--primary">
          <span className="btn__label">Explore programs</span>
          <span className="btn__arrow">→</span>
        </Link>
      </div>
    </motion.div>
  );
}
