import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentForm } from "@/components/portal/CommerceForms";
import { cancelOrder } from "@/lib/actions/commerce";
import { catalogEntry } from "@/lib/courses/catalog";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/portal/auth";
import { ORDER_STATUS, orderByRef, orderStageLabel, PAYMENT_METHODS, PAYMENT_METHODS_USD, paymentSettings } from "@/lib/portal/commerce";

export default async function OrderPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const user = await requireUser(`/orders/${ref}`);
  const order = orderByRef(ref);
  if (!order || order.user_id !== user.id) notFound();
  const entry = catalogEntry(order.course_slug);
  const pay = paymentSettings();
  const stage = orderStageLabel(order);
  const usd = order.currency === "USD";
  const bankRows = [
    ["Account title", pay.accountTitle],
    ["Bank", pay.bankName],
    ["Account number", pay.accountNumber],
    ["IBAN", pay.iban],
    ["Branch", pay.branch],
    ["Mobile wallets", pay.wallets],
  ].filter(([, v]) => v);

  return (
    <section className="container section checkout" style={{ ["--c" as string]: entry?.color ?? "#ffd23f" }}>
      <div className="checkout__grid">
        <div className="glass checkout__card">
          <p className="eyebrow">
            <span className="eyebrow__dot" /> Order {order.reference}
          </p>
          <h1 className="h3">
            {order.kind === "seats" ? `${order.seats} seats · ` : ""}
            {entry?.title}
          </h1>
          <p className={`order-status order-status--${order.status}`}>{ORDER_STATUS[order.status]}</p>

          {order.status === "approved" ? (
            <div className="order-done">
              <p>Payment confirmed. {order.kind === "individual" ? (stage ? `${stage.split(":")[0]} is unlocked.` : "Your quest is unlocked.") : "Your seats are ready to assign."}</p>
              <Link href={order.kind === "individual" ? `/learn/${order.course_slug}` : "/company"} className="btn btn--primary">
                <span className="btn__label">{order.kind === "individual" ? (stage ? "Continue the quest" : "Start the quest") : "Invite my team"}</span>
                <span className="btn__arrow">→</span>
              </Link>
            </div>
          ) : order.status === "cancelled" ? (
            <p className="muted">This order was cancelled.</p>
          ) : (
            <>
              {order.status === "rejected" && (
                <p className="form-alert">
                  We could not confirm this payment{order.admin_note ? `: ${order.admin_note}` : "."} Please check the details and submit again.
                </p>
              )}
              {order.status === "submitted" && <p className="form-ok">We have your payment details and are checking them. You can update them below if needed.</p>}
              <h2 className="checkout__h">1. Pay {formatMoney(order.amount_pkr, order.currency)}</h2>
              {usd ? (
                pay.international ? (
                  <div className="bank bank--intl">
                    {pay.international.split(/\n+/).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                    <p>
                      Payment description: <strong>{order.reference}</strong>
                    </p>
                  </div>
                ) : (
                  <p className="form-alert">
                    Please contact info@learningimpact.pk with your order reference <strong>{order.reference}</strong> and we will send you international payment
                    details (US dollars).
                  </p>
                )
              ) : bankRows.length > 1 ? (
                <dl className="bank">
                  {bankRows.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                  <div>
                    <dt>Payment description</dt>
                    <dd>
                      <strong>{order.reference}</strong>
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="form-alert">Our bank details are being updated. Please contact info@learningimpact.pk or +92 334 9990778 for payment details.</p>
              )}
              {pay.instructions && <p className="muted">{pay.instructions}</p>}
              <h2 className="checkout__h">2. Tell us you have paid</h2>
              <PaymentForm reference={order.reference} methods={usd ? PAYMENT_METHODS_USD : PAYMENT_METHODS} resubmit={Boolean(order.proof_file)} />
              {order.status === "awaiting_payment" && (
                <form action={cancelOrder} className="order-cancel">
                  <input type="hidden" name="reference" value={order.reference} />
                  <button className="inline-link">Cancel this order</button>
                </form>
              )}
            </>
          )}
        </div>
        <aside className="glass checkout__summary">
          <h2>Order summary</h2>
          <dl>
            <div>
              <dt>Reference</dt>
              <dd>{order.reference}</dd>
            </div>
            <div>
              <dt>Item</dt>
              <dd>
                {entry?.title}
                {stage && (
                  <>
                    <br />
                    <span className="muted">Single stage · {stage}</span>
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt>Quantity</dt>
              <dd>
                {order.seats} × {formatMoney(order.unit_price_pkr, order.currency)}
              </dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>
                <strong>{formatMoney(order.amount_pkr, order.currency)}</strong>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
