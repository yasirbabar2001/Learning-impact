import Link from "next/link";
import { suggestionAction } from "@/app/admin/portal-actions";
import { listSuggestions, SUGGESTION_STATUS, type Suggestion } from "@/lib/portal/suggestions";

export const metadata = { title: "Training suggestions" };
export const dynamic = "force-dynamic";

const FILTERS: { key: Suggestion["status"] | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "read", label: "Read" },
  { key: "planned", label: "Planned" },
  { key: "declined", label: "Declined" },
];

const BADGE: Record<Suggestion["status"], string> = { new: "badge--new", read: "badge--closed", planned: "badge--confirmed", declined: "badge--closed" };

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" });

/** Private inbox of "Suggest a training" messages: what was asked for, by whom, and how to reach them. */
export default async function AdminSuggestions({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "all" } = await searchParams;
  const all = listSuggestions();
  const items = status === "all" ? all : all.filter((s) => s.status === status);
  const count = (k: string) => (k === "all" ? all.length : all.filter((s) => s.status === k).length);

  return (
    <div className="board dash-admin">
      <div className="board__head">
        <div>
          <h1 className="h3">Training suggestions</h1>
          <p className="muted">
            What visitors and learners asked us to add, through “Suggest a training” in the bar under the header. Only administrators see this page.
          </p>
        </div>
      </div>
      <div className="tabs suggest-filters" role="tablist" aria-label="Filter suggestions">
        {FILTERS.map((f) => (
          <Link key={f.key} href={f.key === "all" ? "/admin/suggestions" : `/admin/suggestions?status=${f.key}`} className={`tab ${status === f.key ? "is-active" : ""}`}>
            {f.label} ({count(f.key)})
          </Link>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="muted">No suggestions here yet.</p>
      ) : (
        <ul className="req-list">
          {items.map((s) => (
            <li key={s.id} className="order-admin glass suggestion">
              <div className="order-admin__head">
                <span className={`badge ${BADGE[s.status]}`}>{SUGGESTION_STATUS[s.status]}</span>
                <strong>{s.title}</strong>
                <span className="muted">{when(s.created_at)}</span>
              </div>
              {s.details && <p className="suggestion__details">{s.details}</p>}
              <p className="muted suggestion__who">
                <b>{s.name}</b> · <a href={`mailto:${s.email}?subject=${encodeURIComponent(`Your training suggestion: ${s.title}`)}`} className="inline-link">{s.email}</a>
                {s.phone && (
                  <>
                    {" "}
                    · <a href={`tel:${s.phone.replace(/[^\d+]/g, "")}`} className="inline-link">{s.phone}</a>
                  </>
                )}
                {s.organisation && <> · {s.organisation}</>}
                {s.user_id ? (
                  <>
                    {" "}
                    ·{" "}
                    <Link href={`/admin/learners?q=${encodeURIComponent(s.email)}`} className="inline-link">
                      registered learner
                    </Link>
                  </>
                ) : (
                  " · visitor (no account)"
                )}
                {s.page && <> · sent from {s.page}</>}
              </p>
              <div className="admin-inline">
                {(["read", "planned", "declined"] as const)
                  .filter((k) => k !== s.status)
                  .map((k) => (
                    <form key={k} action={suggestionAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="status" value={k} />
                      <button className="btn btn--ghost btn--sm">
                        <span className="btn__label">Mark {SUGGESTION_STATUS[k].toLowerCase()}</span>
                      </button>
                    </form>
                  ))}
                <form action={suggestionAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="status" value="delete" />
                  <button className="btn btn--ghost btn--sm btn--danger">
                    <span className="btn__label">Delete</span>
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
