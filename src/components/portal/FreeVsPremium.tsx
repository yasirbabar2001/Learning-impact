import Link from "next/link";

type Row = { label: string; free: string | boolean; premium: string | boolean };

/** Side-by-side comparison of the free Basic level and Premium for a Free & Premium course. */
export function FreeVsPremium({
  freeCount,
  total,
  price,
  examQuestions,
  upgradeHref,
  heading = true,
}: {
  freeCount: number;
  total: number;
  price: string;
  examQuestions: number;
  upgradeHref?: string | null;
  heading?: boolean;
}) {
  const adv = total - freeCount;
  const rows: Row[] = [
    { label: `Basic level: stages 1 to ${freeCount}`, free: true, premium: true },
    { label: `Advanced level: stages ${freeCount + 1} to ${total}`, free: false, premium: true },
    { label: "Story lessons, games, quizzes & XP", free: `${freeCount} stages`, premium: `All ${total} stages` },
    { label: "Listen mode & downloadable PDF slides", free: true, premium: true },
    { label: "Certificate of Completion (Basic level)", free: true, premium: true },
    { label: `Final certification exam (${examQuestions} questions)`, free: false, premium: true },
    { label: "Verified Learning Impact certificate with QR code", free: false, premium: true },
    { label: "Employers can verify it online; share it on LinkedIn", free: false, premium: true },
  ];
  const cell = (v: string | boolean) =>
    v === true ? (
      <span className="fvp__yes" aria-label="Included">
        ✓
      </span>
    ) : v === false ? (
      <span className="fvp__no" aria-label="Not included">
        —
      </span>
    ) : (
      <span className="fvp__txt">{v}</span>
    );
  return (
    <div className="fvp">
      {heading && (
        <div className="fvp__head">
          <p className="eyebrow">Free vs Premium</p>
          <h2 className="h3">Start free. Go Premium when you want more.</h2>
        </div>
      )}
      <div className="fvp__table" role="table" aria-label="Free vs Premium">
        <div className="fvp__row fvp__row--top" role="row">
          <span role="columnheader" className="fvp__label">
            What you get
          </span>
          <span role="columnheader" className="fvp__col fvp__col--free">
            🎁 Free
            <small>PKR 0</small>
          </span>
          <span role="columnheader" className="fvp__col fvp__col--premium">
            👑 Premium
            <small>{price} once</small>
          </span>
        </div>
        {rows.map((r) => (
          <div key={r.label} className="fvp__row" role="row">
            <span role="rowheader" className="fvp__label">
              {r.label}
            </span>
            <span role="cell" className="fvp__col fvp__col--free">
              {cell(r.free)}
            </span>
            <span role="cell" className="fvp__col fvp__col--premium">
              {cell(r.premium)}
            </span>
          </div>
        ))}
      </div>
      <p className="muted fvp__note">
        Upgrade at any stage: your progress, XP and free certificate are kept, and the {adv} Advanced stages open as soon as your payment is confirmed (within one working day).
      </p>
      {upgradeHref && (
        <Link href={upgradeHref} className="btn btn--primary fvp__cta">
          <span className="btn__label">⭐ Upgrade to Premium · {price}</span>
          <span className="btn__arrow">→</span>
        </Link>
      )}
    </div>
  );
}
