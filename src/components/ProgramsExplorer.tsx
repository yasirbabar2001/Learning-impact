"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { FORMAT_LABELS, type Program } from "@/lib/types";
import { FORMAT_ICONS, IconClock } from "./Icons";
import { Portal } from "./Portal";

const ease = [0.22, 1, 0.36, 1] as const;

export function ProgramsExplorer({ programs }: { programs: Program[] }) {
  const categories = useMemo(() => ["All", ...Array.from(new Set(programs.map((p) => p.category)))], [programs]);
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Program | null>(null);

  const shown = programs.filter((p) => {
    if (cat !== "All" && p.category !== cat) return false;
    const q = query.trim().toLowerCase();
    return !q || `${p.title} ${p.summary} ${p.category} ${p.outcomes.join(" ")}`.toLowerCase().includes(q);
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <LayoutGroup>
      <div className="explorer__bar">
        <div className="tabs" role="tablist" aria-label="Program categories">
          {categories.map((c) => (
            <button key={c} role="tab" aria-selected={cat === c} className={`tab ${cat === c ? "is-active" : ""}`} onClick={() => setCat(c)}>
              {cat === c && <motion.span layoutId="tab-pill" className="tab__pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span>{c}</span>
            </button>
          ))}
        </div>
        <label className="search">
          <span className="sr-only">Search programs</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input type="search" placeholder="Search programs" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      <motion.div layout className="program-grid">
        <AnimatePresence mode="popLayout">
          {shown.map((p, i) => (
            <motion.button
              layout
              layoutId={`card-${p.id}`}
              key={p.id}
              className="program-card spot"
              onClick={() => setOpen(p)}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
              transition={{ duration: 0.55, ease, delay: Math.min(i * 0.04, 0.3) }}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.97 }}
              aria-haspopup="dialog"
            >
              <span className="program-card__top">
                <span className="tag">{p.category}</span>
                {p.featured && <span className="tag tag--gold">Popular</span>}
              </span>
              <motion.h3 layoutId={`title-${p.id}`}>{p.title}</motion.h3>
              <p>{p.summary}</p>
              <span className="program-card__meta">
                <span>
                  <IconClock size={16} /> {p.duration}
                </span>
                <span>{p.level}</span>
                <span className="program-card__formats">
                  {p.formats.map((f) => (
                    <span key={f} title={FORMAT_LABELS[f]}>
                      {FORMAT_ICONS[f]}
                    </span>
                  ))}
                </span>
              </span>
              <span className="program-card__more">
                View details <span aria-hidden="true">→</span>
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      {shown.length === 0 && (
        <motion.div className="empty glass" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3>No program matches that yet.</h3>
          <p className="muted">We design tailored programs all the time. Tell us what you need.</p>
          <Link href={`/trainers?topic=${encodeURIComponent(query)}`} className="btn btn--primary">
            <span className="btn__label">Request a tailored program</span>
            <span className="btn__arrow">→</span>
          </Link>
        </motion.div>
      )}

      <Portal>
      <AnimatePresence>
        {open && (
          <motion.div className="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <motion.div
              layoutId={`card-${open.id}`}
              className="modal__card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="program-title"
              onClick={(e) => e.stopPropagation()}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              <button className="modal__close" onClick={() => setOpen(null)} aria-label="Close">
                ×
              </button>
              <span className="program-card__top">
                <span className="tag">{open.category}</span>
                <span className="tag">{open.level}</span>
                <span className="tag">
                  <IconClock size={14} /> {open.duration}
                </span>
              </span>
              <motion.h3 layoutId={`title-${open.id}`} id="program-title" className="modal__title">
                {open.title}
              </motion.h3>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5, ease }}>
                <p className="modal__summary">{open.summary}</p>
                {open.outcomes.length > 0 && (
                  <>
                    <h4>Participants will be able to</h4>
                    <ul className="outcomes">
                      {open.outcomes.map((o, i) => (
                        <motion.li key={o} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.06 }}>
                          {o}
                        </motion.li>
                      ))}
                    </ul>
                  </>
                )}
                <h4>Available as</h4>
                <div className="format-pills">
                  {open.formats.map((f) => (
                    <span key={f} className="format-pill">
                      {FORMAT_ICONS[f]} {FORMAT_LABELS[f]}
                    </span>
                  ))}
                </div>
                <div className="modal__actions">
                  <Link href={`/book?program=${open.slug}`} className="btn btn--primary">
                    <span className="btn__label">Book this program</span>
                    <span className="btn__arrow">→</span>
                  </Link>
                  <Link href={`/trainers?topic=${encodeURIComponent(open.title + " (tailored)")}`} className="btn btn--ghost">
                    <span className="btn__label">Request a tailored version</span>
                    <span className="btn__arrow">→</span>
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </Portal>
    </LayoutGroup>
  );
}
