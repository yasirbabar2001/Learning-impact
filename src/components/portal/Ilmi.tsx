"use client";

import { AnimatePresence, motion, type TargetAndTransition } from "motion/react";

export type IlmiMood = "idle" | "happy" | "cheer" | "think" | "sad";

const MOTION: Record<IlmiMood, TargetAndTransition> = {
  idle: { y: [0, -6, 0], rotate: 0, transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
  happy: { y: [0, -18, 0], rotate: [0, -6, 6, 0], transition: { duration: 0.6 } },
  cheer: { y: [0, -34, 0, -16, 0], rotate: [0, 360], scale: [1, 1.15, 1], transition: { duration: 1 } },
  think: { rotate: [-8, 8, -8], transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } },
  sad: { y: 6, rotate: -6, scale: 0.95, transition: { duration: 0.5 } },
};

/**
 * Ilmi ("knowledge"): the learner's guide. A glowing lantern-bot that reacts to answers and
 * cheers progress with short messages.
 */
export function Ilmi({ mood = "idle", message, size = 84 }: { mood?: IlmiMood; message?: string | null; size?: number }) {
  const eyes =
    mood === "happy" || mood === "cheer" ? (
      <g stroke="#0d2c66" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M33 50 Q40 41 47 50" />
        <path d="M53 50 Q60 41 67 50" />
      </g>
    ) : mood === "sad" ? (
      <g fill="#0d2c66">
        <ellipse cx="40" cy="51" rx="5" ry="6" />
        <ellipse cx="60" cy="51" rx="5" ry="6" />
        <path d="M33 42 L46 46 M67 42 L54 46" stroke="#0d2c66" strokeWidth="3" strokeLinecap="round" />
      </g>
    ) : (
      <g fill="#0d2c66">
        <ellipse cx="40" cy="49" rx="6" ry="8" />
        <ellipse cx="60" cy="49" rx="6" ry="8" />
        <circle cx="42" cy="46" r="2.2" fill="#fff" />
        <circle cx="62" cy="46" r="2.2" fill="#fff" />
      </g>
    );
  const mouth = mood === "sad" ? "M42 68 Q50 62 58 68" : mood === "think" ? "M44 66 L56 64" : "M40 63 Q50 74 60 63";
  return (
    <div className="ilmi" aria-live="polite">
      <AnimatePresence mode="wait">
        {message && (
          <motion.div key={message} className="ilmi__bubble" initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
            {message}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.svg width={size} height={size} viewBox="0 0 100 100" animate={MOTION[mood]} aria-label="Ilmi, your guide" role="img">
        <defs>
          <radialGradient id="ilmi-glow" cx="50%" cy="40%" r="60%">
            <stop offset="0" stopColor="#fff7c2" />
            <stop offset="0.6" stopColor="#ffd23f" />
            <stop offset="1" stopColor="#ff9f1c" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="56" r="44" fill="#ffd23f" opacity="0.18" />
        {/* antenna with a star */}
        <path d="M50 14 L50 24" stroke="#0d2c66" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 4 L53 11 L60 11 L54 15 L56 22 L50 18 L44 22 L46 15 L40 11 L47 11 Z" fill="#ff4dd8" />
        {/* lantern body */}
        <rect x="18" y="24" width="64" height="62" rx="28" fill="url(#ilmi-glow)" stroke="#0d2c66" strokeWidth="3" />
        <rect x="30" y="84" width="40" height="8" rx="4" fill="#0d2c66" />
        {eyes}
        <path d={mouth} stroke="#0d2c66" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="30" cy="62" r="5" fill="#ff7a8a" opacity="0.5" />
        <circle cx="70" cy="62" r="5" fill="#ff7a8a" opacity="0.5" />
      </motion.svg>
    </div>
  );
}

const PRAISE = ["Brilliant!", "Spot on!", "You've got this!", "Sharp thinking!", "Exactly right!", "Shabash!", "Nailed it!"];
const ENCOURAGE = ["Close one, read the explanation.", "No worries, that's how we learn.", "Good try! Look at why.", "Mistakes build memory. Keep going!"];

export const praise = (n: number) => (n >= 3 ? `${n} in a row! You're on fire 🔥` : PRAISE[Math.floor(Math.random() * PRAISE.length)]);
export const encourage = () => ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)];
