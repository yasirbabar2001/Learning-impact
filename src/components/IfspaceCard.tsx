"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const KEY = "li-ifspace-min";
const URL = "https://islamicfinancespace.com";

/**
 * A small ifSPACE window shown on every page (except the admin panel). Visitors can shrink it to a
 * badge; that choice is remembered in this browser only.
 */
export function IfspaceCard() {
  const path = usePathname();
  const [min, setMin] = useState(true); // start small until we know the visitor's choice (no layout jump)
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch {
      /* storage blocked */
    }
    // Phones, and pages built around a form or an exam, start with the badge so nothing important is covered.
    const busy = /^\/(login|register|forgot-password|reset-password|verify-email|checkout|book|trainers|contact)|\/exam\/sit/.test(window.location.pathname);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMin(stored ? stored === "1" : busy || window.innerWidth < 700);
    setReady(true);
  }, []);

  const toggle = (value: boolean) => {
    setMin(value);
    try {
      localStorage.setItem(KEY, value ? "1" : "0");
    } catch {
      /* storage blocked */
    }
  };

  if (!ready || path.startsWith("/admin")) return null;

  return (
    <aside className="ifspace" aria-label="ifSPACE, Islamic finance training">
      <AnimatePresence mode="wait" initial={false}>
        {min ? (
          <motion.button
            key="badge"
            className="ifspace__badge"
            onClick={() => toggle(false)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            aria-label="Islamic finance training? Open the ifSPACE note"
          >
            <Image src="/ifspace-logo.png" alt="ifSPACE" width={561} height={206} className="ifspace__badge-logo" />
            <span className="ifspace__badge-text">Islamic finance training?</span>
          </motion.button>
        ) : (
          <motion.div
            key="card"
            className="ifspace__card"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <a href={URL} target="_blank" rel="noopener noreferrer" className="ifspace__link" aria-label="Looking for Islamic Finance training programs? Visit ifSPACE (opens in a new tab)">
              <Image src="/ifspace-logo.png" alt="" width={561} height={206} className="ifspace__logo" />
              <span className="ifspace__text">
                Looking for <strong>Islamic Finance Training Programs</strong>? <span className="ifspace__visit">Visit ifSPACE ↗</span>
              </span>
            </a>
            <button className="ifspace__close" onClick={() => toggle(true)} aria-label="Minimise">
              –
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
