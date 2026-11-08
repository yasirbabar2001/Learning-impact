import { grantAttemptAction, markVerifiedAction, revokeCertificateAction, setAdminAction, setUserStatusAction } from "@/app/admin/portal-actions";
import { currentUser, isOwnerEmail } from "@/lib/portal/auth";
import { EnrollForm, ResetLinkButton, TestEmailForm } from "@/components/admin/PortalAdminForms";
import { mailConfigured } from "@/lib/portal/mail";
import { allTopics, catalogEntry } from "@/lib/courses/catalog";
import { all } from "@/lib/db";
import { levelFor } from "@/lib/portal/game";

type U = { id: string; name: string; email: string; phone: string; organisation: string; status: string; xp: number; created_at: string; last_login_at: string | null; company: string | null; account_type: string; email_verified_at: string | null; is_admin: number };
type E = { id: string; user_id: string; course_slug: string; source: string; extra_attempts: number; completed_at: string | null; attempts: number; best: number | null };
type C = { id: string; user_id: string; course_slug: string; code: string; percent: number };

export default async function AdminLearners({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const me = await currentUser();
  const like = `%${q.trim()}%`;
  const users = all<U>(
    `SELECT u.id, u.name, u.email, u.phone, u.organisation, u.status, u.xp, u.created_at, u.last_login_at, u.account_type, u.email_verified_at, u.is_admin, c.name AS company
     FROM users u LEFT JOIN companies c ON c.id = u.company_id
     WHERE u.name LIKE ? OR u.email LIKE ? OR u.organisation LIKE ? ORDER BY u.created_at DESC LIMIT 200`,
    like,
    like,
    like,
  );
  const ids = users.map((u) => u.id);
  const marks = ids.map(() => "?").join(",") || "''";
  const enrolments = all<E>(
    `SELECT e.id, e.user_id, e.course_slug, e.source, e.extra_attempts, e.completed_at,
       (SELECT COUNT(*) FROM exam_attempts a WHERE a.user_id = e.user_id AND a.course_slug = e.course_slug AND a.submitted_at IS NOT NULL) AS attempts,
       (SELECT MAX(percent) FROM exam_attempts a WHERE a.user_id = e.user_id AND a.course_slug = e.course_slug) AS best
     FROM enrollments e WHERE e.user_id IN (${marks})`,
    ...ids,
  );
  const certs = all<C>(`SELECT id, user_id, course_slug, code, percent FROM certificates WHERE revoked_at IS NULL AND user_id IN (${marks})`, ...ids);
  const total = all<{ n: number }>("SELECT COUNT(*) AS n FROM users")[0].n;

  return (
    <div className="board">
      <div className="board__head">
        <div>
          <h1 className="h3">Learners</h1>
          <p className="muted">{total} account(s). “Give admin access” lets someone switch to this panel from their normal login (header “Admin” button or account menu). Owner e-mails are always admins.</p>
        </div>
        <form className="search">
          <input type="search" name="q" defaultValue={q} placeholder="Search name, e-mail or organisation" />
        </form>
      </div>
      <section className="settings__group glass">
        <h2>E-mail check</h2>
        <TestEmailForm configured={mailConfigured()} host={process.env.SMTP_HOST ?? ""} />
      </section>
      <section className="settings__group glass">
        <h2>Enrol a learner manually</h2>
        <EnrollForm courses={allTopics()} />
      </section>
      <ul className="req-list">
        {users.map((u) => (
          <li key={u.id} className="order-admin glass">
            <div className="order-admin__head">
              <span className={`badge ${u.status === "active" ? "badge--confirmed" : "badge--closed"}`}>{u.status === "active" ? "Active" : "Disabled"}</span>
              <strong>{u.name}</strong>
              <span className="tag">{u.account_type === "company" ? "Company" : "Individual"}</span>
              {isOwnerEmail(u.email) ? <span className="tag tag--gold">Owner · Admin</span> : u.is_admin ? <span className="tag tag--gold">Admin</span> : null}
              {!u.email_verified_at && <span className="tag tag--gold">E-mail not verified</span>}
              <span className="muted">
                {u.email}
                {u.phone ? ` · ${u.phone}` : ""}
                {u.company ? ` · ${u.company}` : u.organisation ? ` · ${u.organisation}` : ""}
              </span>
              <span className="muted">
                L{levelFor(u.xp).index} · {u.xp} XP
              </span>
            </div>
            <ul className="admin-enrol">
              {enrolments
                .filter((e) => e.user_id === u.id)
                .map((e) => {
                  const cert = certs.find((c) => c.user_id === u.id && c.course_slug === e.course_slug);
                  return (
                    <li key={e.id}>
                      <span>{catalogEntry(e.course_slug)?.title}</span>
                      <span className="muted">
                        via {e.source} · exam {e.attempts}/{3 + e.extra_attempts} attempts{e.best != null ? ` · best ${e.best}%` : ""}
                      </span>
                      {cert ? (
                        <form action={revokeCertificateAction}>
                          <input type="hidden" name="id" value={cert.id} />
                          <a href={`/api/certificates/${cert.code}`} target="_blank" className="inline-link">
                            {cert.code}
                          </a>{" "}
                          <button className="inline-link btn--danger">Revoke</button>
                        </form>
                      ) : (
                        <form action={grantAttemptAction}>
                          <input type="hidden" name="id" value={e.id} />
                          <button className="inline-link">+1 exam attempt</button>
                        </form>
                      )}
                    </li>
                  );
                })}
            </ul>
            <div className="order-admin__actions">
              <ResetLinkButton id={u.id} />
              {!u.email_verified_at && (
                <form action={markVerifiedAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <button className="btn btn--ghost btn--sm">
                    <span className="btn__label">Mark e-mail verified</span>
                  </button>
                </form>
              )}
              {u.status === "active" && u.id !== me?.id && !isOwnerEmail(u.email) && (
                <form action={setAdminAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="admin" value={u.is_admin ? "0" : "1"} />
                  <button className="btn btn--ghost btn--sm" title={u.is_admin ? "This person can no longer open the admin panel" : "Lets this person switch to Admin from their normal login"}>
                    <span className="btn__label">{u.is_admin ? "Remove admin access" : "Give admin access"}</span>
                  </button>
                </form>
              )}
              <form action={setUserStatusAction}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="status" value={u.status === "active" ? "disabled" : "active"} />
                <button className="btn btn--ghost btn--sm btn--danger">
                  <span className="btn__label">{u.status === "active" ? "Disable account" : "Re-enable"}</span>
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
