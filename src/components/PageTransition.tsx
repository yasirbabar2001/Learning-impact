"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Wraps each page (via the route template): a quick rainbow curtain sweep and the new page rising in.
 * Kept short and blur-free so clicks feel instant, even on modest laptops.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <>
      <motion.div
        className="curtain"
        aria-hidden="true"
        initial={{ y: "0%" }}
        animate={{ y: "-110%", transitionEnd: { display: "none" } }}
        transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
      >
        <span className="curtain__edge" />
      </motion.div>
      <motion.main
        id="main"
        className="page"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      >
        {children}
      </motion.main>
    </>
  );
}
