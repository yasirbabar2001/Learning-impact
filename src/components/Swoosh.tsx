"use client";

import { motion } from "motion/react";

/** The logo's gold underline and dot, drawn as the element scrolls into view. */
export function Swoosh({ className = "" }: { className?: string }) {
  return (
    <svg className={`swoosh ${className}`} viewBox="0 0 310 20" preserveAspectRatio="none" aria-hidden="true">
      <motion.path
        d="M3 15 Q170 17 296 6"
        stroke="var(--gold)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1], delay: 0.2 }}
      />
      <motion.circle
        cx="300"
        cy="6"
        r="5"
        fill="var(--gold)"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 400, damping: 12, delay: 1.15 }}
      />
    </svg>
  );
}
