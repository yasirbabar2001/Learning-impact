"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useState } from "react";

export type CatalogCard = {
  slug: string;
  title: string;
  tagline: string;
  category: string;
  color: string;
  available: boolean;
  price: string | null;
  level: string | null;
  hours: number | null;
  stages: number | null;
  questName: string | null;
};

export function CertCatalog({ items }: { items: CatalogCard[] }) {
  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category)))];
  const [cat, setCat] = useState("All");
  const shown = items.filter((i) => cat === "All" || i.category === cat);
  return (
    <LayoutGroup>
      <div className="explorer__bar">
        <div className="tabs" role="tablist" aria-label="Certification categories">
          {categories.map((c) => (
            <button key={c} role="tab" aria-selected={cat === c} className={`tab ${cat === c ? "is-active" : ""}`} onClick={() => setCat(c)}>
              {cat === c && <motion.span layoutId="cert-pill" className="tab__pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span>{c}</span>
            </button>
          ))}
        </div>
      </div>
      <motion.div layout className="cert-grid">
        <AnimatePresence mode="popLayout">
          {shown.map((c, i) => (
            <motion.div
              layout
              key={c.slug}
              initial={{ opacity: 0, y: 26, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: Math.min(i * 0.04, 0.35) }}
            >
              <Link href={`/certifications/${c.slug}`} className={`cert-card spot ${c.available ? "" : "is-soon"}`} style={{ ["--c" as string]: c.color }}>
                <span className="cert-card__glow" aria-hidden="true" />
                <span className="cert-card__top">
                  <span className="tag">{c.category}</span>
                  {c.available ? <span className="tag free-tag">🎁 Start for free</span> : <span className="tag">Coming soon</span>}
                </span>
                <h3>{c.title}</h3>
                {c.questName && <span className="cert-card__quest">⚔️ {c.questName}</span>}
                <p className="muted">{c.tagline}</p>
                <span className="cert-card__meta">
                  {c.stages ? <span>{c.stages} stages</span> : null}
                  {c.hours ? <span>{c.hours} hours</span> : null}
                  {c.level ? <span>{c.level}</span> : null}
                </span>
                <span className="cert-card__foot">
                  <strong>{c.available ? `Stage 1 free · then ${c.price}` : "Register interest"}</strong>
                  <span className="cert-card__go" aria-hidden="true">
                    →
                  </span>
                </span>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );
}
