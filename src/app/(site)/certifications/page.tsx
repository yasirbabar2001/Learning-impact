import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { CertCatalog } from "@/components/portal/CertCatalog";
import { Reveal } from "@/components/Reveal";
import Link from "next/link";
import { cookies } from "next/headers";
import { Flag } from "@/components/Flag";
import { catalog, regulatoryCatalog } from "@/lib/courses/catalog";
import { formatMoney } from "@/lib/money";
import { currentUser } from "@/lib/portal/auth";
import { priceIn, viewerCurrency } from "@/lib/portal/currency";
import { REF_COOKIE, REFERRAL_XP, referrerByCode } from "@/lib/portal/referrals";
import { flagSvg } from "@/lib/regulatory/flags";
import { TARGETS } from "@/lib/regulatory/targets";

export const metadata: Metadata = {
  title: "Professional Certifications",
  description:
    "Gamified professional certifications for professionals worldwide: leadership, AI, AML/CFT, HR, procurement, customer experience, green banking and more. Session tests, a tough final exam and verified certificates.",
  alternates: { canonical: "/certifications" },
};
export const dynamic = "force-dynamic";

const HOW = [
  { icon: "🗺️", title: "Pick your quest", text: "Each certification is a quest of five stages with a story to follow." },
  { icon: "🎬", title: "Live the story", text: "Story scenes, narrated mini-movies, animated visuals, decisions, games and real-world cases from organisations around the world." },
  { icon: "🎯", title: "Beat every stage test", text: "A scored SCORM test closes each stage. Score 7/10 to unlock the next one." },
  { icon: "🐉", title: "Defeat the final boss", text: "A timed exam of 40 questions drawn from a larger bank. Pass mark 75%." },
  { icon: "🎓", title: "Get certified", text: "A certificate with a QR code that employers can verify online." },
];

export default async function CertificationsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  // ?view=skills: only the capacity building & technical quests, catalogue first (the home page's "Skills" card links here).
  const skillsOnly = (await searchParams).view === "skills";
  const currency = await viewerCurrency(await currentUser());
  const referrer = referrerByCode((await cookies()).get(REF_COOKIE)?.value);
  const items = catalog().map((c) => ({
    slug: c.slug,
    title: c.title,
    tagline: c.course?.tagline ?? c.tagline,
    category: c.category,
    color: c.color,
    available: c.available,
    price: c.available ? formatMoney(priceIn(c, currency), currency) : null,
    level: c.course?.level ?? null,
    hours: c.course?.hours ?? null,
    stages: c.course?.sessions.length ?? null,
    questName: c.available ? (c.course?.quest.name ?? null) : null,
  }));
  const live = regulatoryCatalog().filter((q) => q.available);
  const regulatory = live.length;
  const countries = TARGETS.map((t) => ({ ...t, flag: flagSvg(t.code), quests: live.filter((q) => q.jurisdiction === t.code).length })).filter((t) => t.quests > 0);
  const name = (code: string | null) => TARGETS.find((t) => t.code === code)?.name ?? "";
  if (!skillsOnly) items.push(
    ...live.map((q) => ({
      slug: q.slug,
      title: q.title.replace(/^[^|]+\|\s*/, ""),
      tagline: q.course?.tagline ?? q.tagline,
      category: "Banking Regulation",
      color: q.color,
      available: true,
      price: formatMoney(priceIn(q, currency), currency),
      level: q.course?.level ?? null,
      hours: q.course?.hours ?? null,
      stages: q.course?.sessions.length ?? null,
      questName: q.course?.quest.name ?? null,
      country: name(q.jurisdiction),
      flag: q.jurisdiction ? flagSvg(q.jurisdiction) : null,
    })),
  );
  return skillsOnly ? (
    <>
      <PageHero eyebrow="Capacity building & technical" title="Skills certifications you play" highlight="like a quest.">
        <p>
          {items.length} professional certifications in leadership, technology, HR, operations, communication and banking skills. Learn in short stages, earn XP and
          badges, pass every stage test and defeat a tough final exam to earn a verified certificate. Stage 1 of every quest is free.
        </p>
      </PageHero>
      {referrer && (
        <section className="container section--tight">
          <p className="auth__invite">
            🎁 <strong>{referrer.name.split(" ")[0]}</strong> invited you to Learning Impact.{" "}
            <Link href="/register" className="inline-link">
              Create your free account
            </Link>{" "}
            and get a {REFERRAL_XP.welcome} XP welcome bonus.
          </p>
        </section>
      )}
      <section id="quests" className="container section section--tight cert-quests">
        <Reveal>
          <CertCatalog items={items} />
        </Reveal>
      </section>
      {regulatory > 0 && (
        <section className="container section--tight">
          <Link href="/regulatory" className="reg-switch glass">
            <span className="reg-switch__flags" aria-hidden="true">
              {countries.slice(0, 5).map((c) => (
                <Flag key={c.code} svg={c.flag} label="" className="flag flag--sm" />
              ))}
            </span>
            <span>
              Looking for <strong>regulatory compliance quests</strong>? {regulatory} country-specific certifications for banking staff in {countries.length}{" "}
              countries.
            </span>
            <span className="reg-switch__go">Browse by country →</span>
          </Link>
        </section>
      )}
      <section className="container section section--tight">
        <ol className="how-strip">
          {HOW.map((h, i) => (
            <Reveal key={h.title} delay={i * 0.07}>
              <li className="how-strip__item spot">
                <span className="how-strip__icon">{h.icon}</span>
                <strong>{h.title}</strong>
                <span className="muted">{h.text}</span>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>
    </>
  ) : (
    <>
      <PageHero eyebrow="Professional certifications" title="Certifications you play" highlight="like a quest.">
        <p>
          Fourteen professional certifications for the corporate and banking sector
          {regulatory > 0 ? `, plus ${regulatory} country-specific banking regulatory certifications` : ""}. Learn in short stages, earn XP and badges, pass every stage test and
          defeat a tough final exam to earn a verified certificate.
        </p>
      </PageHero>
      {referrer && (
        <section className="container section--tight">
          <p className="auth__invite">
            🎁 <strong>{referrer.name.split(" ")[0]}</strong> invited you to Learning Impact.{" "}
            <Link href="/register" className="inline-link">
              Create your free account
            </Link>{" "}
            and get a {REFERRAL_XP.welcome} XP welcome bonus.
          </p>
        </section>
      )}
      {regulatory > 0 && (
        <section className="container section section--tight">
          <Reveal className="reg-feature glass">
            <div className="reg-feature__text">
              <span className="eyebrow">🌍 Global Banking Regulatory Training</span>
              <h2 className="h2">Does your regulator require it? We have the training.</h2>
              <p className="muted">
                A collection of compliance certifications built country by country on each banking regulator&apos;s own rules: AML/CFT, customer
                protection, cyber security, governance and more. Every quest names the official sources it follows, and stage 1 is always free.
              </p>
              <p className="reg-feature__stats">
                <span>
                  <strong>{regulatory}</strong> certifications
                </span>
                <span>
                  <strong>{countries.length}</strong> countries
                </span>
                <span>
                  <strong>Stage 1</strong> free
                </span>
              </p>
              <Link href="/regulatory" className="btn btn--primary">
                <span className="btn__label">Find your country&apos;s training</span>
                <span className="btn__arrow">→</span>
              </Link>
            </div>
            <ul className="reg-feature__flags" aria-label="Countries covered">
              {countries.map((c) => (
                <li key={c.code}>
                  <Link href={`/regulatory#${c.code}`} className="reg-flag">
                    <Flag svg={c.flag} label={`Flag of ${c.name}`} />
                    <span className="reg-flag__name">{c.name}</span>
                    <span className="reg-flag__count">
                      {c.quests} quest{c.quests === 1 ? "" : "s"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      )}
      <section className="container section section--tight">
        <ol className="how-strip">
          {HOW.map((h, i) => (
            <Reveal key={h.title} delay={i * 0.07}>
              <li className="how-strip__item spot">
                <span className="how-strip__icon">{h.icon}</span>
                <strong>{h.title}</strong>
                <span className="muted">{h.text}</span>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>
      <section id="quests" className="container section section--tight cert-quests">
        <Reveal>
          <CertCatalog items={items} />
        </Reveal>
      </section>
    </>
  );
}
