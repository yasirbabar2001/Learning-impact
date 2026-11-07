import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { CertCatalog } from "@/components/portal/CertCatalog";
import { Reveal } from "@/components/Reveal";
import Link from "next/link";
import { cookies } from "next/headers";
import { catalog, formatPkr } from "@/lib/courses/catalog";
import { REF_COOKIE, REFERRAL_XP, referrerByCode } from "@/lib/portal/referrals";

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

export default async function CertificationsPage() {
  const referrer = referrerByCode((await cookies()).get(REF_COOKIE)?.value);
  const items = catalog().map((c) => ({
    slug: c.slug,
    title: c.title,
    tagline: c.course?.tagline ?? c.tagline,
    category: c.category,
    color: c.color,
    available: c.available,
    price: c.available ? formatPkr(c.pricePkr) : null,
    level: c.course?.level ?? null,
    hours: c.course?.hours ?? null,
    stages: c.course?.sessions.length ?? null,
    questName: c.available ? (c.course?.quest.name ?? null) : null,
  }));
  return (
    <>
      <PageHero eyebrow="Professional certifications" title="Certifications you play" highlight="like a quest.">
        <p>
          Fourteen professional certifications for the corporate and banking sector. Learn in short stages, earn XP and badges, pass every stage test and
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
      <section className="container section section--tight">
        <Reveal>
          <CertCatalog items={items} />
        </Reveal>
      </section>
    </>
  );
}
