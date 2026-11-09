import Link from "next/link";
import { notFound } from "next/navigation";
import { saveCourseSettingsAction } from "@/app/admin/portal-actions";
import { regulatoryCatalog } from "@/lib/courses/catalog";
import { priceIn } from "@/lib/portal/currency";
import { groupedPrograms, jurisdiction, questStatuses, unassessed } from "@/lib/regulatory/library";
import { PROGRAM_CATEGORIES } from "@/lib/regulatory/programs";
import { CLASSIFICATION_HELP, CLASSIFICATION_LABELS, CLASSIFICATIONS, FREQUENCY_LABELS, isProvisional } from "@/lib/regulatory/schema";

export default async function AdminJurisdiction({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const j = jurisdiction(code);
  if (!j) notFound();
  const groups = groupedPrograms(j);
  const status = questStatuses();
  const quests = regulatoryCatalog().filter((q) => q.jurisdiction === j.code);
  const todo = unassessed(j);

  return (
    <div className="board dash-admin lib">
      <div className="board__head">
        <div>
          <p className="muted">
            <Link href="/admin/library" className="inline-link">
              Regulatory library
            </Link>{" "}
            › {j.region}
          </p>
          <h1 className="h3">{j.name}</h1>
          <p className="muted">{j.summary}</p>
          <p className="muted lib__reviewed">
            Reviewed <b>{j.reviewed}</b>. {j.programs.length} of 202 programs assessed. {j.programs.filter(isProvisional).length} classification(s) still
            waiting for the official text to be opened (marked ⏳): open the linked source and confirm before relying on them.
          </p>
        </div>
      </div>

      <section className="dash-admin__group">
        <h2 className="dash-admin__title">Banking regulators{j.kind === "regional" ? " (regional jurisdiction)" : ""}</h2>
        {j.members && <p className="muted">Member countries: {j.members.join(", ")}</p>}
        <div className="dash-admin__cols">
          {j.regulators.map((r) => (
            <a key={r.name} href={r.url} target="_blank" rel="noreferrer" className="glass dash-admin__panel dash-admin__panel--link">
              <strong>
                {r.name}
                {r.abbr ? ` (${r.abbr})` : ""} ↗
              </strong>
              <span className="muted">{r.role}</span>
            </a>
          ))}
        </div>
        {j.notes.length > 0 && (
          <div className="glass dash-admin__panel lib__notes">
            <strong>Recent and upcoming changes</strong>
            <ul>
              {j.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="dash-admin__group">
        <h2 className="dash-admin__title">Quests for {j.name}</h2>
        {quests.length === 0 ? (
          <p className="muted">No quest has been written for {j.name} yet.</p>
        ) : (
          <ul className="req-list">
            {quests.map((q) => {
              const st = status.get(q.slug);
              return (
                <li key={q.slug} className="order-admin glass" style={{ ["--c" as string]: q.color }}>
                  <div className="order-admin__head">
                    <span className={`badge ${q.available ? "badge--confirmed" : "badge--new"}`}>{q.available ? "Live" : "Draft – review"}</span>
                    <strong>{q.title}</strong>
                    <span className="muted">
                      {st?.trial ?? 0} on the free stage · {st?.enrolled ?? 0} enrolled · {st?.completedStages ?? 0} stages passed · exam {st?.examPassed ?? 0}/
                      {st?.examTaken ?? 0} passed · {st?.certified ?? 0} certified
                    </span>
                  </div>
                  <form action={saveCourseSettingsAction} className="admin-inline">
                    <input type="hidden" name="slug" value={q.slug} />
                    <label className="admin-field">
                      <span className="admin-field__label">Price per learner (PKR)</span>
                      <input name="price" type="number" min={0} step={500} defaultValue={q.pricePkr || ""} placeholder="e.g. 15000" />
                    </label>
                    <label className="admin-field">
                      <span className="admin-field__label">Price outside Pakistan (US$)</span>
                      <input
                        name="price_usd"
                        type="number"
                        min={0}
                        step={1}
                        defaultValue={q.priceUsd || ""}
                        placeholder={q.pricePkr ? `auto: $${priceIn({ pricePkr: q.pricePkr, priceUsd: 0 }, "USD")}` : "e.g. 59"}
                      />
                    </label>
                    <label className="admin-checks admin-checks--inline">
                      <input type="checkbox" name="published" defaultChecked={q.published} /> Published
                    </label>
                    <button className="btn btn--primary btn--sm">
                      <span className="btn__label">Save</span>
                    </button>
                    <a href={`/learn/${q.slug}`} target="_blank" className="btn btn--ghost btn--sm">
                      <span className="btn__label">👁️ Review quest</span>
                    </a>
                    <a href={`/certifications/${q.slug}`} target="_blank" className="inline-link">
                      Sales page ↗
                    </a>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {CLASSIFICATIONS.map((c) => (
        <section key={c} className="dash-admin__group">
          <h2 className="dash-admin__title">
            <span className={`cls cls--${c}`}>{CLASSIFICATION_LABELS[c]}</span> {groups[c].length}
          </h2>
          <p className="muted">{CLASSIFICATION_HELP[c]}</p>
          {groups[c].length === 0 ? (
            <p className="muted">None identified.</p>
          ) : (
            <div className="lib__list">
              {groups[c].map((m) => {
                const q = m.quest ? quests.find((x) => x.slug === m.quest) : null;
                return (
                  <details key={m.program} className="glass lib__item">
                    <summary>
                      <span className="lib__no">#{m.program}</span>
                      <span className="lib__title">
                        <strong>{m.title}</strong>
                        <span className="muted">
                          {m.master} · {PROGRAM_CATEGORIES[m.category as keyof typeof PROGRAM_CATEGORIES]}
                        </span>
                      </span>
                      <span className="lib__freq">
                        {m.frequency.map((f) => FREQUENCY_LABELS[f]).join(" · ")}
                        {isProvisional(m) && <span className="lib__pending"> · ⏳ source check pending</span>}
                      </span>
                      <span className={`badge ${q ? (q.available ? "badge--confirmed" : "badge--new") : "badge--closed"}`}>
                        {q ? (q.available ? "Quest live" : "Quest draft") : "No quest yet"}
                      </span>
                    </summary>
                    <div className="lib__body">
                      <p>{m.why}</p>
                      <p className="muted">
                        <b>Who:</b> {m.audience.join(", ")}
                      </p>
                      {m.references.length > 0 && (
                        <ul className="lib__refs">
                          {m.references.map((r) => (
                            <li key={r.url + r.title}>
                              <a href={r.url} target="_blank" rel="noreferrer" className="inline-link">
                                {r.title}
                              </a>{" "}
                              <span className="muted">
                                ({r.issuer}
                                {r.provision ? `, ${r.provision}` : ""}
                                {r.effective ? `, effective ${r.effective}` : ""})
                              </span>
                              <span className={r.checked ? "lib__ok" : "lib__pending"}>
                                {r.checked ? ` ✓ official text checked ${r.checked}` : " ⏳ found on the official site; full text not opened yet"}
                              </span>
                              {r.note && <span className="lib__note">{r.note}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                      {q && (
                        <p>
                          <a href={`/learn/${q.slug}`} target="_blank" className="inline-link">
                            Open the quest ↗
                          </a>
                        </p>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </section>
      ))}

      <section className="dash-admin__group">
        <details className="glass dash-admin__panel">
          <summary>
            <strong>Not yet assessed for {j.name}</strong> <span className="muted">({todo.length} programs)</span>
          </summary>
          <p className="muted">These programs have not been researched for this jurisdiction yet, so no classification is shown.</p>
          <ol className="lib__todo">
            {todo.map((p) => (
              <li key={p.no} value={p.no}>
                {p.title}
              </li>
            ))}
          </ol>
        </details>
      </section>
    </div>
  );
}
