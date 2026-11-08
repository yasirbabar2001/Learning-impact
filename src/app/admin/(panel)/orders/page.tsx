import { approveOrderAction, rejectOrderAction } from "@/app/admin/portal-actions";
import { catalogEntry, formatPkr } from "@/lib/courses/catalog";
import { all } from "@/lib/db";
import { ORDER_STATUS, orderStageLabel, type Order } from "@/lib/portal/commerce";

type Row = Order & { name: string; email: string; phone: string; company: string | null };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show } = await searchParams;
  const everything = show === "all";
  const orders = all<Row>(
    `SELECT o.*, u.name, u.email, u.phone, c.name AS company FROM orders o JOIN users u ON u.id = o.user_id LEFT JOIN companies c ON c.id = o.company_id
     ${everything ? "" : "WHERE o.status IN ('submitted', 'awaiting_payment', 'rejected')"}
     ORDER BY CASE o.status WHEN 'submitted' THEN 0 WHEN 'awaiting_payment' THEN 1 ELSE 2 END, o.created_at DESC LIMIT 500`,
  );
  const toReview = orders.filter((o) => o.status === "submitted").length;
  return (
    <div className="board">
      <div className="board__head">
        <div>
          <h1 className="h3">Payments</h1>
          <p className="muted">Check each receipt against your bank or wallet statement, then approve to unlock the certification or the company&apos;s seats.</p>
        </div>
        <a className="btn btn--ghost btn--sm" href={everything ? "/admin/orders" : "/admin/orders?show=all"}>
          <span className="btn__label">{everything ? "Show open orders" : "Show all orders"}</span>
        </a>
      </div>
      <div className="stats">
        <div className={`stat ${toReview ? "stat--hot" : ""}`}>
          <span className="stat__value">{toReview}</span>
          <span className="muted">Waiting for review</span>
        </div>
      </div>
      {orders.length === 0 ? (
        <div className="empty glass">
          <h3>No open orders.</h3>
        </div>
      ) : (
        <ul className="req-list">
          {orders.map((o) => (
            <li key={o.id} className="order-admin glass">
              <div className="order-admin__head">
                <span className={`badge badge--${o.status === "approved" ? "confirmed" : o.status === "submitted" ? "new" : o.status === "rejected" ? "proposal" : "closed"}`}>{ORDER_STATUS[o.status]}</span>
                <strong>{o.reference}</strong>
                <span>{formatPkr(o.amount_pkr)}</span>
                <span className="muted">{new Date(o.created_at).toLocaleString("en-GB")}</span>
              </div>
              <dl className="order-admin__facts">
                <div>
                  <dt>Buyer</dt>
                  <dd>
                    {o.name} · {o.email}
                    {o.phone ? ` · ${o.phone}` : ""}
                  </dd>
                </div>
                <div>
                  <dt>Item</dt>
                  <dd>
                    {catalogEntry(o.course_slug)?.title}
                    {o.kind === "seats" ? ` · ${o.seats} seats for ${o.company}` : o.stage_id ? ` · individual · ${orderStageLabel(o)}` : " · individual · full quest"}
                  </dd>
                </div>
                {o.submitted_at && (
                  <div>
                    <dt>Payment</dt>
                    <dd>
                      {o.payment_method} · ref <strong>{o.transaction_ref}</strong>
                      {o.buyer_note ? ` · “${o.buyer_note}”` : ""}
                      {o.proof_file && (
                        <>
                          {" · "}
                          <a href={`/admin/proof/${o.proof_file}`} target="_blank" rel="noopener" className="inline-link">
                            View receipt
                          </a>
                        </>
                      )}
                    </dd>
                  </div>
                )}
                {o.admin_note && (
                  <div>
                    <dt>Admin note</dt>
                    <dd>{o.admin_note}</dd>
                  </div>
                )}
              </dl>
              {o.status !== "approved" && o.status !== "cancelled" && (
                <form className="order-admin__actions">
                  <input type="hidden" name="id" value={o.id} />
                  <input name="note" placeholder="Note to buyer (required when rejecting)" className="order-admin__note" maxLength={500} />
                  <button formAction={approveOrderAction} className="btn btn--primary btn--sm">
                    <span className="btn__label">Approve & unlock</span>
                  </button>
                  <button formAction={rejectOrderAction} className="btn btn--ghost btn--sm btn--danger">
                    <span className="btn__label">Reject</span>
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
