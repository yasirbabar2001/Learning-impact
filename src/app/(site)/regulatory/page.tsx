import { Flag } from "@/components/Flag";
import { flagSvg } from "@/lib/regulatory/flags";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { regulatoryCatalog } from "@/lib/courses/catalog";
import { formatMoney } from "@/lib/money";
import { currentUser } from "@/lib/portal/auth";
import { priceIn, viewerCurrency } from "@/lib/portal/currency";
import { jurisdiction } from "@/lib/regulatory/library";
import { CLASSIFICATION_LABELS, REGIONS } from "@/lib/regulatory/schema";
import { TARGETS } from "@/lib/regulatory/targets";

export const metadata: Metadata = {
  title: "Global Banking Regulatory Training",
  description:
    "Country-by-country banking compliance quests: AML/CFT, sanctions, conduct, consumer protection, data protection and more, written against each regulator's official requirements.",
  alternates: { canonical: "/regulatory" },
};
export const dynamic = "force-dynamic";

export default async function RegulatoryLibraryPage() {
  const currency = await viewerCurrency(await currentUser());
  const live = regulatoryCatalog().filter((q) => q.available);
  const regions = REGIONS.map((region) => {
    const countries = TARGETS.filter((t) => t.region === region)
      .map((t) => ({ t, j: jurisdiction(t.code), quests: live.filter((q) => q.jurisdiction === t.code) }))
      .filter((x) => x.quests.length);
    return { region, countries };
  }).filter((r) => r.countries.length);

  return (
    <>
      <PageHero eyebrow="Global Banking Regulatory Training" title="Banking compliance, country by country," highlight="as a quest.">
        <p>
          Quests written for the banking regulators of each country: the rules your staff must know, why they exist, real cases and practical scenarios,
          stage tests and a final exam with a verified certificate. Every quest lists the official sources it is based on.
        </p>
      </PageHero>
      <section className="container section section--tight">
        {regions.length === 0 ? (
          <Reveal className="cert__description glass">
            <h2 className="h3">The library is opening soon</h2>
            <p className="muted">
              Country quests are being written and reviewed against official regulatory sources. Companies can reserve seats for their teams now.
            </p>
            <p>
              <Link href="/contact" className="btn btn--primary">
                <span className="btn__label">Reserve seats</span>
                <span className="btn__arrow">→</span>
              </Link>
            </p>
          </Reveal>
        ) : (
          regions.map((r) => (
            <div key={r.region} className="reg-region">
              <h2 className="h3">{r.region}</h2>
              <div className="reg-countries">
                {r.countries.map(({ t, j, quests }) => (
                  <Reveal key={t.code} className="glass reg-country">
                    <h3 id={t.code} className="reg-country__name">
                      <Flag svg={flagSvg(t.code)} label={`Flag of ${t.name}`} />
                      {t.name}
                    </h3>
                    <p className="muted reg-country__regs">{j ? j.regulators.map((x) => x.abbr ?? x.name).join(" · ") : t.regulators}</p>
                    <ul>
                      {quests.map((q) => (
                        <li key={q.slug}>
                          <Link href={`/certifications/${q.slug}`} className="reg-quest" style={{ ["--c" as string]: q.color }}>
                            <strong>{q.title}</strong>
                            <span className="muted">
                              {q.course?.jurisdiction && CLASSIFICATION_LABELS[q.course.jurisdiction.classification]} · {q.course?.sessions.length} stages ·{" "}
                              {formatMoney(priceIn(q, currency), currency)} · Stage 1 free
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
