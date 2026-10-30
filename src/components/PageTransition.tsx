"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Wraps each page (via the route template) so every navigation gets a rainbow curtain sweep
 * followed by the new page rising into focus.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <>
      <motion.div
        className="curtain"
        aria-hidden="true"
        initial={{ y: "0%" }}
        animate={{ y: "-110%", transitionEnd: { display: "none" } }}
        transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1], delay: 0.05 }}
      >
        <span className="curtain__edge" />
      </motion.div>
      <motion.main
        id="main"
        className="page"
        initial={{ opacity: 0, y: 40, scale: 0.985, filter: "blur(14px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
      >
        {children}
      </motion.main>
    </>
  );
}
