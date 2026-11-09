import type { Metadata } from "next";
import Link from "next/link";
import { catalogEntry } from "@/lib/courses/catalog";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/portal/auth";
import { ORDER_STATUS, ordersOf } from "@/lib/portal/commerce";

export const metadata: Metadata = { title: "Orders & payments" };

export default async function OrdersPage() {
  const user = await requireUser("/learn/orders");
  const orders = ordersOf(user.id);
  return (
    <div className="container dash">
      <h1 className="h2">Orders & payments</h1>
      {orders.length === 0 ? (
        <div className="empty glass">
          <h3>No orders yet</h3>
          <Link href="/certifications" className="btn btn--primary">
            <span className="btn__label">Browse certifications</span>
            <span className="btn__arrow">→</span>
          </Link>
        </div>
      ) : (
        <ul className="req-list">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.reference}`} className="req spot">
                <span className={`badge badge--${o.status === "approved" ? "confirmed" : o.status === "submitted" ? "contacted" : o.status === "rejected" ? "new" : "closed"}`}>{ORDER_STATUS[o.status]}</span>
                <span className="req__main">
                  <strong>{catalogEntry(o.course_slug)?.title}</strong>
                  <span className="muted">
                    {o.kind === "seats" ? `${o.seats} seats · ` : ""}
                    {formatMoney(o.amount_pkr, o.currency)}
                  </span>
                </span>
                <span className="req__meta">
                  <span className="mono">{o.reference}</span>
                  <span className="muted">{new Date(o.created_at).toLocaleDateString("en-GB")}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
