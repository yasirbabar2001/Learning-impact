import Link from "next/link";
import { freeCatalog } from "@/lib/courses/catalog";
import { formatMoney } from "@/lib/money";
import { priceIn, viewerCurrency } from "@/lib/portal/currency";

const SHORT: Record<string, string> = {
  "ai-tools-everyday-work": "🤖 AI & ChatGPT",
  "canva-design": "🎨 Canva design",
  "freelancing-starter": "💻 Freelancing",
  "office-essentials": "📊 MS Office",
  "workplace-english": "🗣️ Spoken English",
};

/** Home page, first screen: the free courses with their free certificate, and the Premium upgrade. */
export async function FreeBanner() {
  const free = freeCatalog().filter((c) => c.available);
  if (!free.length) return null;
  const currency = await viewerCurrency();
  const premium = formatMoney(priceIn(free[0], currency), currency);
  return (
    <div className="freeband">
      <div className="freeband__text">
        <p className="freeband__badge">🎁 Free courses · free certificate</p>
        <h2 className="freeband__title">
          Start free. Get certified. <span className="rainbow-text">Level up.</span>
        </h2>
        <p className="freeband__sub">
          {free.length} free courses with a free Certificate of Completion. Ready for more? Go Premium for {premium} and earn the verified certificate.
        </p>
      </div>
      <ul className="freeband__chips" aria-label="Free courses">
        {free.map((c) => (
          <li key={c.slug}>
            <Link href={`/certifications/${c.slug}`} className="freeband__chip">
              {SHORT[c.slug] ?? c.title.split(":")[0]}
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/certifications?view=free#quests" className="btn btn--primary freeband__cta">
        <span className="btn__label">Start a free course</span>
        <span className="btn__arrow">→</span>
      </Link>
    </div>
  );
}
