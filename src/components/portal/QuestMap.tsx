"use client";

import Link from "next/link";
import { motion } from "motion/react";

export type MapNode = {
  key: string;
  href: string | null;
  n: string;
  stage: string;
  title: string;
  status: "locked" | "open" | "lesson-done" | "passed" | "boss-locked" | "boss-open" | "boss-done";
  note: string;
};

const ICON: Record<MapNode["status"], string> = {
  locked: "🔒",
  open: "▶",
  "lesson-done": "🎯",
  passed: "✓",
  "boss-locked": "🐉",
  "boss-open": "🐉",
  "boss-done": "🏆",
};

/** A winding trail of stage nodes; the active node pulses. */
export function QuestMap({ nodes }: { nodes: MapNode[] }) {
  const current = nodes.findIndex((n) => n.status === "open" || n.status === "lesson-done" || n.status === "boss-open");
  return (
    <ol className="qmap">
      {nodes.map((n, i) => {
        const side = i % 2 === 0 ? "left" : "right";
        const inner = (
          <>
            <motion.span
              className={`qnode__orb qnode__orb--${n.status}`}
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.3 + i * 0.12 }}
            >
              <span>{ICON[n.status]}</span>
              {i === current && <span className="qnode__pulse" aria-hidden="true" />}
            </motion.span>
            <motion.span className="qnode__card glass" initial={{ opacity: 0, x: side === "left" ? -30 : 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}>
              <span className="qnode__n">{n.n}</span>
              <strong>{n.stage}</strong>
              <span className="qnode__title">{n.title}</span>
              <span className="qnode__note">{n.note}</span>
            </motion.span>
          </>
        );
        return (
          <li key={n.key} className={`qnode qnode--${side} ${i === current ? "is-current" : ""}`}>
            {i < nodes.length - 1 && <span className={`qnode__trail ${n.status === "passed" ? "is-done" : ""}`} aria-hidden="true" />}
            {n.href ? (
              <Link href={n.href} className="qnode__link" aria-label={`${n.n}: ${n.stage}, ${n.note}`}>
                {inner}
              </Link>
            ) : (
              <span className="qnode__link is-locked" aria-label={`${n.n}: ${n.stage}, locked`}>
                {inner}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
