"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useState } from "react";
import { INDUSTRIES, INDUSTRY_GROUPS, type IndustryGroup } from "@/lib/industries";

const ease = [0.22, 1, 0.36, 1] as const;

export function IndustriesExplorer() {
  const [group, setGroup] = useState<IndustryGroup | "all">("all");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const matches = INDUSTRIES.filter(
    (i) => (group === "all" || i.group === group) && (!q || `${i.name} ${i.focus.join(" ")}`.toLowerCase().includes(q)),
  );
  const sections = INDUSTRY_GROUPS.map((g) => ({ ...g, items: matches.filter((i) => i.group === g.id) })).filter((g) => g.items.length);

  return (
    <LayoutGroup>
      <div className="explorer__bar">
        <div className="tabs" role="tablist" aria-label="Industry groups">
          {[{ id: "all" as const, title: "All industries" }, ...INDUSTRY_GROUPS].map((g) => (
            <button key={g.id} role="tab" aria-selected={group === g.id} className={`tab ${group === g.id ? "is-active" : ""}`} onClick={() => setGroup(g.id)}>
              {group === g.id && <motion.span layoutId="industry-pill" className="tab__pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span>{g.title}</span>
            </button>
          ))}
        </div>
        <label className="search">
          <span className="sr-only">Search industries or topics</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input type="search" placeholder="Search an industry or topic, e.g. safety" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      <AnimatePresence mode="popLayout">
        {sections.map((g) => (
          <motion.section key={g.id} layout className={`sector sector--${g.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-labelledby={`sector-${g.id}`}>
            <div className="sector__head">
              <h2 className="h3" id={`sector-${g.id}`}>
                {g.title} <span className="sector__count">{g.items.length}</span>
              </h2>
              <p className="muted">{g.intro}</p>
            </div>
            <motion.div layout className="industry-grid">
              <AnimatePresence mode="popLayout">
                {g.items.map((ind, i) => (
                  <motion.article
                    layout
                    key={ind.slug}
                    className="industry-card spot"
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.5, ease, delay: Math.min(i * 0.03, 0.3) }}
                  >
                    <h3>{ind.name}</h3>
                    <ul className="focus-chips" aria-label={`Typical training for ${ind.name}`}>
                      {ind.focus.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    <div className="industry-card__actions">
                      <Link href={`/book?industry=${ind.slug}`} className="industry-card__book">
                        Book training <span aria-hidden="true">→</span>
                      </Link>
                      <Link
                        href={`/trainers?industry=${ind.slug}&topic=${encodeURIComponent(`${ind.focus.join(", ")} for ${ind.name}`.slice(0, 200))}`}
                        className="industry-card__trainer"
                      >
                        Request a trainer
                      </Link>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.section>
        ))}
      </AnimatePresence>

      {sections.length === 0 && (
        <div className="empty glass">
          <h3>We haven&apos;t listed that one yet.</h3>
          <p className="muted">We work with many more sectors. Tell us about yours and we will shape the training around it.</p>
          <Link href={`/trainers?topic=${encodeURIComponent(query)}`} className="btn btn--primary">
            <span className="btn__label">Tell us what you need</span>
            <span className="btn__arrow">→</span>
          </Link>
        </div>
      )}
    </LayoutGroup>
  );
}
