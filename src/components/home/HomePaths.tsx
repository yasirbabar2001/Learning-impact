import Link from "next/link";
import { Flag } from "@/components/Flag";
import { Reveal } from "@/components/Reveal";
import { catalog, regulatoryCatalog } from "@/lib/courses/catalog";
import { flagSvg } from "@/lib/regulatory/flags";
import { TARGETS } from "@/lib/regulatory/targets";
import type { Program } from "@/lib/types";

/**
 * The first thing a visitor sees under the headline: the three ways in, side by side.
 * 1. Skills certification quests (capacity building and technical);
 * 2. Regulatory compliance quests (banking regulation, by country);
 * 3. Corporate training (book a program or hire a trainer).
 * Every card shows real choices (quests, flags, actions) so a visitor can click straight in.
 */
export function HomePaths({ programs }: { programs: Program[] }) {
  const skills = catalog();
  const skillsLive = skills.filter((c) => c.available);
  const sampleSkills = [...skillsLive, ...skills.filter((c) => !c.available)].slice(0, 3);
  const regulatory = regulatoryCatalog().filter((q) => q.available);
  const countries = TARGETS.map((t) => ({ ...t, flag: flagSvg(t.code), quests: regulatory.filter((q) => q.jurisdiction === t.code).length })).filter((t) => t.quests > 0);

  return (
    <div className="paths3" id="start">
      <Reveal delay={0.55} className="path3 path3--skills">
        <span className="path3__badge">
          <span aria-hidden="true">⚔️</span> Capacity building &amp; technical
        </span>
        <h2>Skills certification quests</h2>
        <p className="muted">Leadership, AI and IT, HR, procurement, communication, green banking and more, played as quests with a verified certificate.</p>
        <ul className="path3__list">
          {sampleSkills.map((c) => (
            <li key={c.slug}>
              <Link href={`/certifications/${c.slug}`} className="path3__item" style={{ ["--c" as string]: c.color }}>
                <span>{c.title}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="path3__facts">
          <strong>{skills.length}</strong> quests · stage 1 free
        </p>
        <Link href="/certifications?view=skills#quests" className="btn btn--primary path3__cta">
          <span className="btn__label">Explore skills quests</span>
          <span className="btn__arrow">→</span>
        </Link>
      </Reveal>

      <Reveal delay={0.65} className="path3 path3--regulatory">
        <span className="path3__badge">
          <span aria-hidden="true">🌍</span> Banking regulation
        </span>
        <h2>Regulatory compliance quests</h2>
        <p className="muted">The training your banking regulator expects, country by country: AML/CFT, customer protection, cyber security, governance.</p>
        {countries.length > 0 ? (
          <ul className="path3__flags" aria-label="Countries covered">
            {countries.map((c) => (
              <li key={c.code}>
                <Link href={`/regulatory#${c.code}`} className="path3__flag" title={`${c.name}: ${c.quests} quest${c.quests === 1 ? "" : "s"}`}>
                  <Flag svg={c.flag} label={c.name} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Country quests are opening soon.</p>
        )}
        <p className="path3__facts">
          <strong>{regulatory.length}</strong> quests · <strong>{countries.length}</strong> countries · stage 1 free
        </p>
        <Link href="/regulatory" className="btn btn--primary path3__cta">
          <span className="btn__label">Find your country</span>
          <span className="btn__arrow">→</span>
        </Link>
      </Reveal>

      <Reveal delay={0.75} className="path3 path3--corporate">
        <span className="path3__badge">
          <span aria-hidden="true">🏢</span> For organisations
        </span>
        <h2>Corporate training &amp; trainers</h2>
        <p className="muted">Book a ready-to-run program for your team, or hire a specialist trainer. On-site, live online or hybrid.</p>
        <ul className="path3__list">
          <li>
            <Link href="/programs" className="path3__item">
              <span>📚 Book a training program</span>
              <span aria-hidden="true">→</span>
            </Link>
          </li>
          <li>
            <Link href="/trainers" className="path3__item">
              <span>🎯 Hire a trainer</span>
              <span aria-hidden="true">→</span>
            </Link>
          </li>
          <li>
            <Link href="/industries" className="path3__item">
              <span>🏭 Training by industry</span>
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        </ul>
        <p className="path3__facts">
          <strong>{programs.length}</strong> programs · proposal within one working day
        </p>
        <Link href="/book" className="btn btn--primary path3__cta">
          <span className="btn__label">Plan training for my team</span>
          <span className="btn__arrow">→</span>
        </Link>
      </Reveal>
    </div>
  );
}
