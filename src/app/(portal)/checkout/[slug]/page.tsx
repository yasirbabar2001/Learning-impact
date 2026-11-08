import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckoutForm, UnlockChoice } from "@/components/portal/CommerceForms";
import { catalogEntry, formatPkr } from "@/lib/courses/catalog";
import { companyOf, requireUser } from "@/lib/portal/auth";
import { unlockOffer } from "@/lib/portal/commerce";
import { enrollmentFor } from "@/lib/portal/learning";

export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ team?: string }> }) {
  const [{ slug }, { team }] = await Promise.all([params, searchParams]);
  const isTeam = team === "1";
  const user = await requireUser(`/checkout/${slug}${isTeam ? "?team=1" : ""}`);
  const e = catalogEntry(slug);
  if (!e || !e.course) notFound();
  if (!e.available) redirect(`/certifications/${slug}`);
  if (!isTeam && enrollmentFor(user.id, slug)) redirect(`/learn/${slug}`);
  const company = user.account_type === "company" && user.company_role === "manager" ? companyOf(user) : null;
  if (isTeam && !company) redirect("/company/setup");
  if (isTeam && company?.status !== "approved") redirect("/company/pending");
  const offer = isTeam ? null : unlockOffer(user.id, slug, e.pricePkr);

  return (
    <section className="container section checkout" style={{ ["--c" as string]: e.color }}>
      <div className="checkout__grid">
        <div className="glass checkout__card">
          <p className="eyebrow">
            <span className="eyebrow__dot" /> {isTeam ? "Team seats" : "Enrolment"}
          </p>
          <h1 className="h3">{e.title}</h1>
          <p className="muted">{e.course.tagline}</p>
          {offer ? (
            <UnlockChoice
              slug={slug}
              full={formatPkr(offer.full)}
              next={offer.next ? { number: offer.next.number, title: offer.next.title, price: formatPkr(offer.next.price) } : null}
              remainingStages={offer.remainingStages}
              paidSoFar={offer.paidSoFar ? formatPkr(offer.paidSoFar) : null}
            />
          ) : (
            <CheckoutForm slug={slug} team={isTeam} unitPrice={e.pricePkr} companyName={company?.name ?? null} />
          )}
          <p className="checkout__switch">
            {isTeam ? (
              <Link href={`/checkout/${slug}`} className="inline-link">
                Just for me instead
              </Link>
            ) : (
              <Link href={`/checkout/${slug}?team=1`} className="inline-link">
                Buying for several employees? Get team seats
              </Link>
            )}
          </p>
        </div>
        <aside className="glass checkout__summary">
          <h2>Summary</h2>
          <dl>
            <div>
              <dt>Certification</dt>
              <dd>{e.title}</dd>
            </div>
            <div>
              <dt>{isTeam ? "Price per learner" : "Full quest"}</dt>
              <dd>{formatPkr(e.pricePkr)}</dd>
            </div>
            {offer && (
              <div>
                <dt>Or per stage</dt>
                <dd>
                  {formatPkr(offer.perStage)} (stage 1 is free)
                </dd>
              </div>
            )}
            <div>
              <dt>Includes</dt>
              <dd>
                {e.course.sessions.length} stages, stage tests, final exam (3 attempts), verified certificate
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
