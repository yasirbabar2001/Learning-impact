"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { Portal } from "../Portal";

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <Portal>
    <AnimatePresence>
      {open && (
        <motion.div className="drawer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.aside
            className="drawer__panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer__head">
              <h2>{title}</h2>
              <button className="modal__close" onClick={onClose} aria-label="Close">
                ×
              </button>
            </div>
            <div className="drawer__body">{children}</div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
    </Portal>
  );
}
