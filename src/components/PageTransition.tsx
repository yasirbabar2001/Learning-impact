"use client";

import { motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { firstPaint } from "@/lib/first-paint";

/**
 * Wraps each page (via the route template): a quick rainbow curtain sweep and the new page rising in.
 * Kept short and blur-free so clicks feel instant, even on modest laptops. The first page of a visit is shown
 * straight away (no curtain, nothing hidden) so it is readable before the JavaScript has loaded.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const [animate] = useState(() => firstPaint.done);
  useEffect(() => {
    firstPaint.done = true;
  }, []);
  return (
    <>
      {animate && (
        <motion.div
          className="curtain"
          aria-hidden="true"
          initial={{ y: "0%" }}
          animate={{ y: "-110%", transitionEnd: { display: "none" } }}
          transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
        >
          <span className="curtain__edge" />
        </motion.div>
      )}
      <motion.main
        id="main"
        className="page"
        initial={animate ? { opacity: 0, y: 16 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      >
        {children}
      </motion.main>
    </>
  );
}
