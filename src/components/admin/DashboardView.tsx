import Link from "next/link";
import { catalog } from "@/lib/courses/catalog";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS } from "@/lib/portal/commerce";
import { VisitorsChart } from "@/components/admin/VisitorsChart";
import { dashboardStats, visitorStats, visitorTop } from "@/lib/portal/stats";
import { store } from "@/lib/store";

type Tile = { href: string; label: string; value: string | number; note?: string; tone?: "alert" | "good" | "info"; icon: string };

const ago = (iso: string) => {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 60) return `${Math.max(1, m)} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

const newerThan = (iso: string, days: number) => Date.parse(iso) > Date.now() - days * 864e5;

/** Opens the related admin page; in the read-only (team) view it is a plain box with no link. */
function Box({ href, className, readOnly, children }: { href: string; className: string; readOnly: boolean; children: React.ReactNode }) {
  return readOnly ? (
    <div className={className}>{children}</div>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/**
 * Dashboard with live numbers. Admins get clickable tiles, each opening the page where they act on it; the
 * Learning Impact Team gets the same numbers read-only (no links, no editing tiles).
 */
export async function DashboardView({ readOnly = false }: { readOnly?: boolean }) {
  const s = dashboardStats();
  const visits = visitorStats();
  const top = visitorTop();
  const requests = await store.listRequests();
  const newRequests = requests.filter((r) => r.status === "new").length;
  const requests7 = requests.filter((r) => newerThan(r.createdAt, 7)).length;
  const courses = catalog();
  const live = courses.filter((c) => c.available).length;
  const ready = courses.filter((c) => c.course && !c.available).length;
  const titles = new Map<string, string>(courses.map((c) => [c.slug, c.title]));

  const groups: { title: string; tiles: Tile[] }[] = [
    {
      title: "Money",
      tiles: [
        { href: "/admin/orders", icon: "💰", label: "Revenue (approved)", value: formatMoney(s.revenueTotal, "PKR"), note: `${formatMoney(s.revenueTotalUsd, "USD")} in dollars · this month ${formatMoney(s.revenueMonth, "PKR")} + ${formatMoney(s.revenueMonthUsd, "USD")}`, tone: "good" },
        { href: "/admin/orders", icon: "🧾", label: "Payments to review", value: s.paymentsToReview, note: "Receipts waiting for approval", tone: s.paymentsToReview ? "alert" : undefined },
        { href: "/admin/orders", icon: "⏳", label: "Awaiting payment", value: s.awaitingPayment, note: "Orders started, not paid yet" },
      ],
    },
    {
      title: "People",
      tiles: [
        { href: "/admin/users?type=individual", icon: "🧑‍🎓", label: "Learners", value: s.learners, note: `+${s.newLearners7} in the last 7 days` },
        { href: "/admin/companies", icon: "🏢", label: "Companies to approve", value: s.companiesPending, note: `${s.companiesApproved} approved`, tone: s.companiesPending ? "alert" : undefined },
        { href: "/admin/users?status=unverified", icon: "✉️", label: "E-mail not verified", value: s.unverified, note: "Can be marked verified" },
        { href: "/admin/learners", icon: "⚡", label: "Active in the last 24 h", value: s.activeToday, note: "Learners who earned XP" },
      ],
    },
    {
      title: "Learning",
      tiles: [
        { href: "/admin/certifications", icon: "🎁", label: "On the free stage", value: s.freeStage, note: `${s.conversion}% of starters went on to enrol`, tone: "info" },
        { href: "/admin/learners", icon: "🎓", label: "Enrolments", value: s.enrolments, note: `${s.seatsPending} company seat invitation(s) pending` },
        { href: "/admin/learners", icon: "🏁", label: "Stages cleared", value: s.stagesCleared, note: "Stage tests passed" },
        { href: "/admin/learners", icon: "🏆", label: "Certificates issued", value: s.certificates, note: s.examsTaken ? `Exam pass rate ${s.examPassRate}% (${s.examsTaken} sat)` : "No exams sat yet", tone: "good" },
      ],
    },
    {
      title: "Catalogue & requests",
      tiles: [
        { href: "/admin/certifications", icon: "📚", label: "Certifications live", value: `${live} / ${courses.length}`, note: ready ? `${ready} ready to publish` : "All ready ones are live", tone: ready ? "info" : undefined },
        { href: "/admin/requests", icon: "📨", label: "New training requests", value: newRequests, note: `${requests7} in the last 7 days`, tone: newRequests ? "alert" : undefined },
        { href: "/admin/programs", icon: "🗂️", label: "Programs", value: "Edit", note: "Corporate training catalogue" },
        { href: "/admin/settings", icon: "⚙️", label: "Site settings", value: "Edit", note: "Contact details, announcement" },
      ],
    },
  ];

  if (readOnly) for (const g of groups) g.tiles = g.tiles.filter((t) => t.value !== "Edit");

  const maxSign = Math.max(1, ...s.signups.map((d) => d.n));
  const maxCourse = Math.max(1, ...s.topCourses.map((c) => c.n));

  return (
    <div className="board dash-admin">
      <div className="board__head">
        <div>
          <h1 className="h3">{readOnly ? "Learning Impact dashboard" : "Dashboard"}</h1>
          <p className="muted">{readOnly ? "Everything at a glance, view only. Changes are made by administrators." : "Everything at a glance. Click a tile to open it."}</p>
        </div>
      </div>

      {groups.map((g) => (
        <section key={g.title} className="dash-admin__group">
          <h2 className="dash-admin__title">{g.title}</h2>
          <div className="tiles">
            {g.tiles.map((t) => (
              <Box key={t.label} href={t.href} readOnly={readOnly} className={`tile ${t.tone ? `tile--${t.tone}` : ""}`}>
                <span className="tile__icon" aria-hidden="true">
                  {t.icon}
                </span>
                <span className="tile__value">{t.value}</span>
                <span className="tile__label">{t.label}</span>
                {t.note && <span className="tile__note">{t.note}</span>}
                {!readOnly && (
                  <span className="tile__go" aria-hidden="true">
                    →
                  </span>
                )}
              </Box>
            ))}
          </div>
        </section>
      ))}

      <section className="dash-admin__group">
        <h2 className="dash-admin__title">Website</h2>
        <VisitorsChart periods={visits} />
        <div className="dash-admin__cols visitors__lists">
          <div className="glass dash-admin__panel">
            <h2 className="h3">Most visited pages (30 days)</h2>
            {top.pages.length === 0 ? (
              <p className="muted">No visits counted yet.</p>
            ) : (
              <ul className="hbars">
                {top.pages.map((x) => (
                  <li key={x.path} title={`${x.path}: ${x.n} views`}>
                    <span className="hbars__label">{x.path}</span>
                    <span className="hbars__track">
                      <span className="hbars__bar" style={{ width: `${(x.n / top.pages[0].n) * 100}%` }} />
                    </span>
                    <span className="hbars__value">{x.n}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="glass dash-admin__panel">
            <h2 className="h3">Where visitors came from (30 days)</h2>
            {top.referrers.length === 0 ? (
              <p className="muted">No referring websites yet (direct visits and bookmarks are not listed).</p>
            ) : (
              <ul className="hbars">
                {top.referrers.map((x) => (
                  <li key={x.referrer} title={`${x.referrer}: ${x.n} visits`}>
                    <span className="hbars__label">{x.referrer}</span>
                    <span className="hbars__track">
                      <span className="hbars__bar" style={{ width: `${(x.n / top.referrers[0].n) * 100}%` }} />
                    </span>
                    <span className="hbars__value">{x.n}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="dash-admin__cols">
        <div className="glass dash-admin__panel">
          <h2 className="h3">New accounts, last 14 days</h2>
          <div className="mini-bars" role="img" aria-label={`New accounts per day: ${s.signups.map((d) => d.n).join(", ")}`}>
            {s.signups.map((d) => (
              <span key={d.day} className="mini-bars__col" title={`${d.day}: ${d.n} new account(s)`}>
                <span className="mini-bars__bar" style={{ height: `${Math.max(2, (d.n / maxSign) * 100)}%` }} />
                <span className="mini-bars__day">{d.day.slice(8)}</span>
              </span>
            ))}
          </div>
          <p className="muted dash-admin__foot">Total in 14 days: {s.signups.reduce((a, d) => a + d.n, 0)}</p>
        </div>
        <div className="glass dash-admin__panel">
          <h2 className="h3">Top certifications by enrolments</h2>
          {s.topCourses.length === 0 ? (
            <p className="muted">No enrolments yet.</p>
          ) : (
            <ul className="hbars">
              {s.topCourses.map((c) => (
                <li key={c.course_slug} title={`${titles.get(c.course_slug)}: ${c.n}`}>
                  <span className="hbars__label">{titles.get(c.course_slug) ?? c.course_slug}</span>
                  <span className="hbars__track">
                    <span className="hbars__bar" style={{ width: `${(c.n / maxCourse) * 100}%` }} />
                  </span>
                  <span className="hbars__value">{c.n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="dash-admin__cols">
        <Box href="/admin/orders" readOnly={readOnly} className={`glass dash-admin__panel ${readOnly ? "" : "dash-admin__panel--link"}`}>
          <h2 className="h3">Latest orders{readOnly ? "" : " →"}</h2>
          {s.recentOrders.length === 0 ? (
            <p className="muted">No orders yet.</p>
          ) : (
            <ul className="feed">
              {s.recentOrders.map((o) => (
                <li key={o.reference}>
                  <strong>{o.reference}</strong>
                  <span>
                    {o.name} · {titles.get(o.course_slug) ?? o.course_slug}
                  </span>
                  <span className="muted">
                    {formatMoney(o.amount_pkr, o.currency)} · {ORDER_STATUS[o.status as keyof typeof ORDER_STATUS] ?? o.status} · {ago(o.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Box>
        <Box href="/admin/users" readOnly={readOnly} className={`glass dash-admin__panel ${readOnly ? "" : "dash-admin__panel--link"}`}>
          <h2 className="h3">Newest accounts{readOnly ? "" : " →"}</h2>
          <ul className="feed">
            {s.recentUsers.map((u) => (
              <li key={u.email}>
                <strong>{u.name}</strong>
                <span>{u.email}</span>
                <span className="muted">
                  {u.account_type === "company" ? "Company" : "Individual"} · {ago(u.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </Box>
      </section>
    </div>
  );
}
