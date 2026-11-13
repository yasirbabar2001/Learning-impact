import Link from "next/link";
import { Flag } from "@/components/Flag";
import { IconBook } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";
import { regulatoryCatalog } from "@/lib/courses/catalog";
import { flagSvg } from "@/lib/regulatory/flags";
import { TARGETS } from "@/lib/regulatory/targets";
import type { Program } from "@/lib/types";

/**
 * Home page, straight after the hero: the two main ways in. Left, corporate training programs; right, Global Banking
 * Regulatory Training by country. Each side shows real choices (programs, flags) so a visitor can click straight in.
 */
export function TwoWays({ programs }: { programs: Program[] }) {
  const live = regulatoryCatalog().filter((q) => q.available);
  const countries = TARGETS.map((t) => ({ ...t, flag: flagSvg(t.code), quests: live.filter((q) => q.jurisdiction === t.code).length })).filter((t) => t.quests > 0);
  const popular = (programs.some((p) => p.featured) ? programs.filter((p) => p.featured) : programs).slice(0, 4);

  return (
    <section className="section container two-ways" aria-labelledby="two-ways-title">
      <Reveal className="two-ways__head">
        <p className="eyebrow">
          <span className="eyebrow__dot" /> Start here
        </p>
        <h2 className="h2" id="two-ways-title">
          Two ways to <span className="rainbow-text">learn.</span>
        </h2>
        <p className="muted">Build your team&apos;s skills with a training program, or meet what your banking regulator expects with a country-specific certification.</p>
      </Reveal>

      <div className="two-ways__grid">
        <Reveal delay={0.05} className="way way--programs">
          <span className="way__icon">
            <IconBook size={26} />
          </span>
          <p className="way__kicker">For organisations</p>
          <h3>Corporate training programs</h3>
          <p className="muted">
            Ready-to-run programs in leadership, communication, sales, digital skills and more, adapted to your team and delivered on-site, live online or
            hybrid.
          </p>
          {popular.length > 0 && (
            <ul className="way__list" aria-label="Popular programs">
              {popular.map((p) => (
                <li key={p.id}>
                  <Link href={`/book?program=${p.slug}`} className="way__item">
                    <span>
                      <strong>{p.title}</strong>
                      <span className="muted">
                        {p.category} · {p.duration}
                      </span>
                    </span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="way__facts">
            <span>
              <strong>{programs.length}</strong> programs
            </span>
            <span>Proposal within one working day</span>
          </p>
          <div className="way__ctas">
            <Link href="/programs" className="btn btn--primary">
              <span className="btn__label">Browse programs</span>
              <span className="btn__arrow">→</span>
            </Link>
            <Link href="/book" className="btn btn--ghost">
              <span className="btn__label">Book training</span>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.15} className="way way--regulatory">
          <span className="way__icon" aria-hidden="true">
            🌍
          </span>
          <p className="way__kicker">For banking professionals</p>
          <h3>Regulatory requirement training</h3>
          <p className="muted">
            Need the training your banking regulator requires? Country-by-country certifications on AML/CFT, customer protection, cyber security and
            governance, each built on the regulator&apos;s own rules, with stage 1 free.
          </p>
          {countries.length > 0 ? (
            <ul className="way__flags" aria-label="Countries covered">
              {countries.map((c) => (
                <li key={c.code}>
                  <Link href={`/regulatory#${c.code}`} className="way__flag" title={`${c.name}: ${c.quests} certification${c.quests === 1 ? "" : "s"}`}>
                    <Flag svg={c.flag} label={`Flag of ${c.name}`} />
                    <span>{c.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Country quests are opening soon. Companies can reserve seats now.</p>
          )}
          <p className="way__facts">
            <span>
              <strong>{live.length}</strong> certifications
            </span>
            <span>
              <strong>{countries.length}</strong> countries
            </span>
            <span>Stage 1 free</span>
          </p>
          <div className="way__ctas">
            <Link href="/regulatory" className="btn btn--primary">
              <span className="btn__label">Find your country</span>
              <span className="btn__arrow">→</span>
            </Link>
            <Link href="/certifications" className="btn btn--ghost">
              <span className="btn__label">All certifications</span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
