import { approveCompanyAction, rejectCompanyAction } from "@/app/admin/portal-actions";
import { all } from "@/lib/db";

type Row = {
  id: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  industry: string;
  city: string;
  address: string;
  employees: string;
  ntn: string;
  phone: string;
  review_note: string;
  created_at: string;
  manager: string | null;
  email: string | null;
  designation: string | null;
  verified: string | null;
  members: number;
};

const LABEL = { pending: "Waiting for approval", approved: "Approved", rejected: "Rejected" } as const;

export default async function AdminCompanies({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show } = await searchParams;
  const rows = all<Row>(
    `SELECT c.*, u.name AS manager, u.email, u.designation, u.email_verified_at AS verified,
       (SELECT COUNT(*) FROM users m WHERE m.company_id = c.id) AS members
     FROM companies c LEFT JOIN users u ON u.company_id = c.id AND u.company_role = 'manager'
     ${show === "all" ? "" : "WHERE c.status = 'pending'"}
     ORDER BY CASE c.status WHEN 'pending' THEN 0 ELSE 1 END, c.created_at DESC LIMIT 500`,
  );
  const waiting = all<{ n: number }>("SELECT COUNT(*) AS n FROM companies c JOIN users u ON u.company_id = c.id AND u.company_role = 'manager' WHERE c.status = 'pending' AND u.email_verified_at IS NOT NULL")[0].n;
  return (
    <div className="board">
      <div className="board__head">
        <div>
          <h1 className="h3">Companies</h1>
          <p className="muted">Company accounts can buy seats and invite staff only after you approve them. Check the company and contact details before approving.</p>
        </div>
        <a className="btn btn--ghost btn--sm" href={show === "all" ? "/admin/companies" : "/admin/companies?show=all"}>
          <span className="btn__label">{show === "all" ? "Show waiting only" : "Show all companies"}</span>
        </a>
      </div>
      <div className="stats">
        <div className={`stat ${waiting ? "stat--hot" : ""}`}>
          <span className="stat__value">{waiting}</span>
          <span className="muted">Verified and waiting</span>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="empty glass">
          <h3>No companies waiting for approval.</h3>
        </div>
      ) : (
        <ul className="req-list">
          {rows.map((c) => (
            <li key={c.id} className="order-admin glass">
              <div className="order-admin__head">
                <span className={`badge ${c.status === "approved" ? "badge--confirmed" : c.status === "pending" ? "badge--new" : "badge--closed"}`}>{LABEL[c.status]}</span>
                <strong>{c.name}</strong>
                <span className="muted">registered {new Date(c.created_at).toLocaleString("en-GB")}</span>
                {c.status === "pending" && !c.verified && <span className="tag">E-mail not verified yet</span>}
              </div>
              <dl className="order-admin__facts">
                <div>
                  <dt>Company</dt>
                  <dd>
                    {[c.industry, c.employees && `${c.employees} employees`, c.city, c.ntn && `NTN ${c.ntn}`].filter(Boolean).join(" · ")}
                    {c.address ? ` · ${c.address}` : ""}
                  </dd>
                </div>
                <div>
                  <dt>Contact</dt>
                  <dd>
                    {c.manager} {c.designation ? `(${c.designation})` : ""} · {c.email} · {c.phone}
                  </dd>
                </div>
                {c.status !== "pending" && (
                  <div>
                    <dt>Team</dt>
                    <dd>{c.members} account(s)</dd>
                  </div>
                )}
                {c.review_note && (
                  <div>
                    <dt>Note</dt>
                    <dd>{c.review_note}</dd>
                  </div>
                )}
              </dl>
              <form className="order-admin__actions">
                <input type="hidden" name="id" value={c.id} />
                <input name="note" placeholder="Reason (sent to the company when rejecting)" className="order-admin__note" maxLength={500} />
                {c.status !== "approved" && (
                  <button formAction={approveCompanyAction} className="btn btn--primary btn--sm">
                    <span className="btn__label">Approve company</span>
                  </button>
                )}
                {c.status !== "rejected" && (
                  <button formAction={rejectCompanyAction} className="btn btn--ghost btn--sm btn--danger">
                    <span className="btn__label">{c.status === "approved" ? "Suspend" : "Reject"}</span>
                  </button>
                )}
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
