import { saveCourseSettingsAction } from "@/app/admin/portal-actions";
import { PaymentSettingsForm } from "@/components/admin/PortalAdminForms";
import { catalog } from "@/lib/courses/catalog";
import { all } from "@/lib/db";
import { paymentSettings } from "@/lib/portal/commerce";

export default async function AdminCertifications() {
  const items = catalog();
  const counts = new Map(all<{ course_slug: string; n: number }>("SELECT course_slug, COUNT(*) AS n FROM enrollments GROUP BY course_slug").map((r) => [r.course_slug, r.n]));
  const certs = new Map(all<{ course_slug: string; n: number }>("SELECT course_slug, COUNT(*) AS n FROM certificates WHERE revoked_at IS NULL GROUP BY course_slug").map((r) => [r.course_slug, r.n]));
  const ready = items.filter((i) => i.course && !i.available).length;
  return (
    <div className="board">
      <div className="board__head">
        <div>
          <h1 className="h3">Certifications</h1>
          <p className="muted">Set a price (PKR per learner) and publish each certification once its content is ready. Session tests can be downloaded as SCORM 1.2 packages for a client&apos;s own LMS.</p>
        </div>
      </div>
      {ready > 0 && <p className="form-ok">{ready} certification(s) have content ready: set a price and tick Published to start selling.</p>}
      <ul className="req-list">
        {items.map((i) => (
          <li key={i.slug} className="order-admin glass" style={{ ["--c" as string]: i.color }}>
            <div className="order-admin__head">
              <span className={`badge ${i.available ? "badge--confirmed" : i.course ? "badge--new" : "badge--closed"}`}>{i.available ? "Live" : i.course ? "Ready to publish" : "Content in preparation"}</span>
              <strong>{i.title}</strong>
              <span className="muted">
                {counts.get(i.slug) ?? 0} enrolled · {certs.get(i.slug) ?? 0} certified
              </span>
            </div>
            {i.course ? (
              <>
                <form action={saveCourseSettingsAction} className="admin-inline">
                  <input type="hidden" name="slug" value={i.slug} />
                  <label className="admin-field">
                    <span className="admin-field__label">Price per learner (PKR)</span>
                    <input name="price" type="number" min={0} step={500} defaultValue={i.pricePkr || ""} placeholder="e.g. 25000" />
                  </label>
                  <label className="admin-checks admin-checks--inline">
                    <input type="checkbox" name="published" defaultChecked={i.published} /> Published
                  </label>
                  <button className="btn btn--primary btn--sm">
                    <span className="btn__label">Save</span>
                  </button>
                  <a href={`/certifications/${i.slug}`} target="_blank" className="inline-link">
                    Preview page ↗
                  </a>
                </form>
                <p className="muted scorm-links">
                  SCORM 1.2 stage tests:{" "}
                  {i.course.sessions.map((s, k) => (
                    <a key={s.id} href={`/admin/scorm/${i.slug}/${s.id}`} className="inline-link">
                      Stage {k + 1}
                    </a>
                  ))}
                </p>
              </>
            ) : (
              <p className="muted">Content for this certification is not loaded yet.</p>
            )}
          </li>
        ))}
      </ul>
      <section className="settings__group glass admin-pay">
        <h2>Payment details shown to buyers</h2>
        <PaymentSettingsForm s={paymentSettings()} />
      </section>
    </div>
  );
}
