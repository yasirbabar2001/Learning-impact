import type { Metadata } from "next";
import Link from "next/link";
import { InviteForm } from "@/components/portal/InviteForm";
import { Reveal } from "@/components/Reveal";
import { revokeInvite } from "@/lib/actions/company";
import { catalogEntry, getCourse } from "@/lib/courses/catalog";
import { requireCompanyManager } from "@/lib/portal/auth";
import { companyById, invitationsOf, seatSummary, teamProgress } from "@/lib/portal/commerce";
import { leaderboard, publicName } from "@/lib/portal/game";

export const metadata: Metadata = { title: "My team" };

export default async function CompanyPage() {
  const manager = await requireCompanyManager();
  const company = companyById(manager.company_id)!;
  const seats = seatSummary(company.id);
  const team = teamProgress(company.id);
  const pending = invitationsOf(company.id).filter((i) => i.status === "pending");
  const board = leaderboard({ companyId: company.id, days: 30, limit: 5 });
  const certified = team.filter((t) => t.cert_code).length;
  const avgExam = team.filter((t) => t.best_exam != null);
  const totals = seats.reduce((a, s) => ({ total: a.total + s.total, used: a.used + s.used }), { total: 0, used: 0 });

  return (
    <div className="container dash">
      <Reveal className="dash__hello">
        <p className="eyebrow">
          <span className="eyebrow__dot" /> Company dashboard
        </p>
        <h1 className="h2">{company.name}</h1>
        <p className="muted">Invite employees to the certifications you bought, and follow their progress and results.</p>
      </Reveal>

      <div className="stats">
        {[
          { label: "Seats bought", value: totals.total },
          { label: "Seats in use", value: totals.used },
          { label: "Certified", value: certified },
          { label: "Average best exam", value: avgExam.length ? `${Math.round(avgExam.reduce((n, t) => n + (t.best_exam ?? 0), 0) / avgExam.length)}%` : "–" },
        ].map((s) => (
          <div key={s.label} className="stat spot">
            <span className="stat__value">{s.value}</span>
            <span className="muted">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="dash__cols">
        <div className="glass dash__panel">
          <h2 className="h3">Seats</h2>
          {seats.length === 0 ? (
            <p className="muted">No seats yet.</p>
          ) : (
            <ul className="seat-list">
              {seats.map((s) => (
                <li key={s.course_slug}>
                  <strong>{catalogEntry(s.course_slug)?.title}</strong>
                  <span className="seat-bar">
                    <span style={{ width: `${(s.used / s.total) * 100}%` }} />
                    <span className="seat-bar__pending" style={{ width: `${(s.pending / s.total) * 100}%` }} />
                  </span>
                  <span className="muted">
                    {s.used} used · {s.pending} invited · {s.total - s.used - s.pending} free of {s.total}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/certifications" className="inline-link">
            Buy seats for another certification
          </Link>
        </div>
        <div className="glass dash__panel">
          <h2 className="h3">Invite your team</h2>
          <InviteForm courses={seats.map((s) => ({ slug: s.course_slug, title: catalogEntry(s.course_slug)?.title ?? s.course_slug, free: s.total - s.used - s.pending }))} />
        </div>
      </div>

      <section className="dash__section">
        <div className="board__head">
          <h2 className="h3">Team progress</h2>
          {team.length > 0 && (
            <a className="btn btn--ghost btn--sm" href="/company/export">
              <span className="btn__label">Download report (CSV)</span>
              <span className="btn__arrow">↓</span>
            </a>
          )}
        </div>
        {team.length === 0 ? (
          <p className="muted">Nobody has joined yet. Employees appear here once they accept their invitation.</p>
        ) : (
          <div className="table-wrap glass">
            <table className="team-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Certification</th>
                  <th>Stages</th>
                  <th>Best exam</th>
                  <th>Status</th>
                  <th>Last active</th>
                </tr>
              </thead>
              <tbody>
                {team.map((t) => {
                  const course = getCourse(t.course_slug);
                  const n = course?.sessions.length ?? 5;
                  return (
                    <tr key={`${t.user_id}-${t.course_slug}`}>
                      <td>
                        <strong>{t.name}</strong>
                        <span className="muted">{t.designation || t.email}</span>
                      </td>
                      <td>{course?.title}</td>
                      <td>
                        <span className="pips">
                          {Array.from({ length: n }, (_, k) => (
                            <i key={k} className={`pip ${k < t.stages_passed ? "pip--passed" : ""}`} />
                          ))}
                        </span>
                      </td>
                      <td>{t.best_exam != null ? `${t.best_exam}% (${t.attempts} att.)` : "–"}</td>
                      <td>{t.cert_code ? <span className="badge badge--confirmed">Certified</span> : t.stages_passed ? <span className="badge badge--contacted">In progress</span> : <span className="badge badge--closed">Not started</span>}</td>
                      <td className="muted">{t.last_active_day ?? "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="dash__cols">
        <div className="glass dash__panel">
          <h2 className="h3">Pending invitations</h2>
          {pending.length === 0 ? (
            <p className="muted">None.</p>
          ) : (
            <ul className="xp-feed">
              {pending.map((p) => (
                <li key={p.id}>
                  <span>{p.email}</span>
                  <span className="muted">{catalogEntry(p.course_slug)?.title}</span>
                  <form action={revokeInvite}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="inline-link">Cancel</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="glass dash__panel">
          <h2 className="h3">Team top 5 (30 days)</h2>
          {board.length === 0 ? (
            <p className="muted">No XP yet.</p>
          ) : (
            <ol className="lboard">
              {board.map((r, i) => (
                <li key={r.id}>
                  <span className="lboard__rank">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
                  <span className="lboard__name">{publicName(r.name)}</span>
                  <span className="lboard__xp">{r.xp.toLocaleString()} XP</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
