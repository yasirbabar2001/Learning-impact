import Link from "next/link";
import { GENDERS } from "@/lib/portal/genders";
import { adminUsers } from "@/lib/portal/users";

export const dynamic = "force-dynamic";

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");

type Search = { q?: string; type?: string; gender?: string; status?: string };

/** Every user in one table, with filters and an Excel download of exactly what is shown. */
export default async function AdminUsers({ searchParams }: { searchParams: Promise<Search> }) {
  const f = await searchParams;
  const users = adminUsers(f);
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();
  const counts = {
    individual: users.filter((u) => u.account_type === "individual").length,
    company: users.filter((u) => u.account_type === "company").length,
    female: users.filter((u) => u.gender === "Female").length,
    male: users.filter((u) => u.gender === "Male").length,
  };
  return (
    <div className="board">
      <div className="board__head">
        <div>
          <h1 className="h3">Users</h1>
          <p className="muted">
            {users.length} user(s) shown · {counts.individual} individual · {counts.company} company · {counts.female} female · {counts.male} male
          </p>
        </div>
        <a className="btn btn--primary btn--sm" href={`/admin/users-export${qs ? `?${qs}` : ""}`} download>
          <span className="btn__label">Download Excel</span>
          <span className="btn__arrow">↓</span>
        </a>
      </div>

      <form className="users-filter">
        <input name="q" defaultValue={f.q ?? ""} placeholder="Search name, e-mail, mobile, company…" aria-label="Search users" />
        <select name="type" defaultValue={f.type ?? ""} aria-label="Account type">
          <option value="">All account types</option>
          <option value="individual">Individual</option>
          <option value="company">Company</option>
        </select>
        <select name="gender" defaultValue={f.gender ?? ""} aria-label="Gender">
          <option value="">All genders</option>
          {GENDERS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
          <option value="not set">Not set (older accounts)</option>
        </select>
        <select name="status" defaultValue={f.status ?? ""} aria-label="Status">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="unverified">E-mail not verified</option>
        </select>
        <button className="btn btn--ghost btn--sm">
          <span className="btn__label">Apply</span>
        </button>
        {qs && (
          <Link href="/admin/users" className="inline-link">
            Clear
          </Link>
        )}
      </form>

      <div className="table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>E-mail</th>
              <th>Mobile</th>
              <th>Gender</th>
              <th>Type</th>
              <th>Organisation</th>
              <th>Designation</th>
              <th>Status</th>
              <th className="num">Enrolled</th>
              <th className="num">Free stage</th>
              <th className="num">Certs</th>
              <th className="num">XP</th>
              <th>Joined</th>
              <th>Last login</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={15} className="muted">
                  No users match these filters.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.name}</strong>
                  {u.admin && <span className="tag tag--gold">Admin</span>}
                </td>
                <td>{u.email}</td>
                <td className="nowrap">{u.phone || "—"}</td>
                <td>{u.gender || "—"}</td>
                <td>{u.account_type === "company" ? "Company" : "Individual"}</td>
                <td>{u.company ?? u.organisation ?? "—"}</td>
                <td>{u.designation || "—"}</td>
                <td>
                  <span className={`badge ${u.status !== "active" ? "badge--closed" : u.email_verified_at ? "badge--confirmed" : "badge--new"}`}>
                    {u.status !== "active" ? "Disabled" : u.email_verified_at ? "Active" : "Unverified"}
                  </span>
                </td>
                <td className="num">{u.enrolments}</td>
                <td className="num">{u.free_stage}</td>
                <td className="num">{u.certificates}</td>
                <td className="num" title={u.level}>
                  {u.xp}
                </td>
                <td className="nowrap">{date(u.created_at)}</td>
                <td className="nowrap">{date(u.last_login_at)}</td>
                <td>
                  <Link href={`/admin/learners?q=${encodeURIComponent(u.email)}`} className="inline-link nowrap">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
