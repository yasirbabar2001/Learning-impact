import Link from "next/link";
import { catalog } from "@/lib/courses/catalog";
import { formatMoney } from "@/lib/money";
import { priceIn, viewerCurrency } from "@/lib/portal/currency";
import { Reveal } from "../Reveal";

const GAME = [
  { icon: "⚔️", title: "Quests, not courses", text: "Five stages with a story, unlocked one by one." },
  { icon: "⭐", title: "XP, levels & streaks", text: "From Explorer to Legend, one stage at a time." },
  { icon: "🎯", title: "SCORM stage tests", text: "Scored after every session, with instant feedback." },
  { icon: "🐉", title: "A tough final boss", text: "40 questions, timed, 75% to pass." },
  { icon: "🏅", title: "Badges & leaderboard", text: "Compete with colleagues across companies." },
  { icon: "🎓", title: "Verified certificate", text: "QR-coded, checkable by any employer." },
];

/** Home-page showcase of the certification quests. */
export async function HomeQuests() {
  const items = catalog();
  const currency = await viewerCurrency();
  const live = items.filter((i) => i.available);
  const shown = [...live, ...items.filter((i) => !i.available)].slice(0, 6);
  return (
    <section className="section container home-quests">
      <Reveal className="section__head">
        <div>
          <p className="eyebrow">
            <span className="eyebrow__dot" /> Professional certifications
          </p>
          <h2 className="h2">
            Get certified the way you <span className="rainbow-text">play a game.</span>
          </h2>
        </div>
        <Link href="/certifications" className="link-arrow">
          All {items.length} certifications <span>→</span>
        </Link>
      </Reveal>
      <div className="game-strip">
        {GAME.map((g, i) => (
          <Reveal key={g.title} delay={i * 0.05}>
            <div className="game-strip__item spot">
              <span>{g.icon}</span>
              <strong>{g.title}</strong>
              <span className="muted">{g.text}</span>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="cert-grid home-quests__grid">
        {shown.map((c, i) => (
          <Reveal key={c.slug} delay={i * 0.06}>
            <Link href={`/certifications/${c.slug}`} className={`cert-card spot ${c.available ? "" : "is-soon"}`} style={{ ["--c" as string]: c.color }}>
              <span className="cert-card__glow" aria-hidden="true" />
              <span className="cert-card__top">
                <span className="tag">{c.category}</span>
                {c.available ? <span className="tag free-tag">🎁 Start for free</span> : <span className="tag">Coming soon</span>}
              </span>
              <h3>{c.title}</h3>
              {c.available && c.course && <span className="cert-card__quest">⚔️ {c.course.quest.name}</span>}
              <p className="muted">{c.course?.tagline ?? c.tagline}</p>
              <span className="cert-card__foot">
                <strong>{c.available ? `Stage 1 free · then ${formatMoney(priceIn(c, currency), currency)}` : "Register interest"}</strong>
                <span className="cert-card__go" aria-hidden="true">
                  →
                </span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
