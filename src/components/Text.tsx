"use client";

import { AnimatePresence, motion } from "motion/react";
import { Fragment, useEffect, useState } from "react";

/** Headline whose words rise one after another. */
export function SplitWords({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={className}>
      {text.split(" ").map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="split__mask">
          <motion.span
            className="split__word"
            initial={{ y: "110%", rotate: 6 }}
            animate={{ y: "0%", rotate: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: delay + i * 0.07 }}
          >
            {word}
          </motion.span>
          </span>{" "}
        </Fragment>
      ))}
    </span>
  );
}

/** Cycles through words with a vertical flip. */
export function RotatingWords({ words, interval = 2200 }: { words: string[]; interval?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  return (
    <span className="rotator" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[i]}
          className="rotator__word rainbow-text"
          initial={{ y: "100%", opacity: 0, filter: "blur(8px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-100%", opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
