"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { catalogEntry, formatPkr } from "../courses/catalog";
import { run } from "../db";
import { requireUser } from "../portal/auth";
import {
  createCompany,
  createOrder,
  MAX_PROOF_BYTES,
  openOrderFor,
  orderByRef,
  PAYMENT_METHODS,
  PROOF_TYPES,
  storeProof,
  submitPayment,
} from "../portal/commerce";
import { enrollmentFor } from "../portal/learning";
import { esc, sendMail } from "../portal/mail";
import { SITE_URL } from "../site";

export type CheckoutState = { message?: string; errors?: Record<string, string>; values?: Record<string, string> };

export async function startCheckout(_: CheckoutState, fd: FormData): Promise<CheckoutState> {
  const slug = String(fd.get("slug") ?? "");
  const team = fd.get("kind") === "seats";
  const user = await requireUser(`/checkout/${slug}${team ? "?team=1" : ""}`);
  const entry = catalogEntry(slug);
  if (!entry?.available) return { message: "This certification is not open for enrolment yet." };

  if (!team) {
    if (enrollmentFor(user.id, slug)) redirect(`/learn/${slug}`);
    const open = openOrderFor(user.id, slug, "individual");
    if (open) redirect(`/orders/${open.reference}`);
    const order = createOrder({ userId: user.id, companyId: null, kind: "individual", slug, seats: 1, unitPrice: entry.pricePkr });
    redirect(`/orders/${order.reference}`);
  }

  const seats = Number(fd.get("seats"));
  if (!Number.isInteger(seats) || seats < 2 || seats > 1000) return { errors: { seats: "Choose between 2 and 1,000 seats." } };
  let companyId = user.company_id;
  if (!companyId || user.company_role !== "manager") {
    const name = z.string().trim().min(2).max(120).safeParse(fd.get("company"));
    if (!name.success) return { errors: { company: "Enter your company's name." }, values: { company: String(fd.get("company") ?? "") } };
    if (user.company_id && user.company_role !== "manager") return { message: "Your account belongs to another company's team. Ask its manager to buy seats, or use a different account." };
    companyId = createCompany(name.data, user.id);
  }
  const order = createOrder({ userId: user.id, companyId, kind: "seats", slug, seats, unitPrice: entry.pricePkr });
  redirect(`/orders/${order.reference}`);
}

export type PaymentState = { ok?: boolean; message?: string; errors?: Record<string, string>; values?: Record<string, string> };

export async function submitPaymentProof(_: PaymentState, fd: FormData): Promise<PaymentState> {
  const ref = String(fd.get("reference") ?? "");
  const user = await requireUser(`/orders/${ref}`);
  const order = orderByRef(ref);
  if (!order || order.user_id !== user.id) return { message: "Order not found." };
  if (order.status === "approved" || order.status === "cancelled") return { message: "This order can no longer be changed." };

  const method = String(fd.get("method") ?? "");
  const txRef = String(fd.get("transaction") ?? "").trim().slice(0, 80);
  const note = String(fd.get("note") ?? "").trim().slice(0, 500);
  const errors: Record<string, string> = {};
  if (!(PAYMENT_METHODS as readonly string[]).includes(method)) errors.method = "Choose how you paid.";
  if (txRef.length < 3) errors.transaction = "Enter the transaction ID or reference from your bank or wallet.";

  let proof: string | null = null;
  const file = fd.get("proof");
  if (file instanceof File && file.size > 0) {
    if (!PROOF_TYPES[file.type]) errors.proof = "Upload a JPG, PNG, WEBP or PDF.";
    else if (file.size > MAX_PROOF_BYTES) errors.proof = "The file must be 5 MB or smaller.";
    else {
      proof = storeProof(Buffer.from(await file.arrayBuffer()), file.type);
      if (!proof) errors.proof = "That file could not be read. Please upload a clear screenshot or PDF.";
    }
  } else if (!order.proof_file) errors.proof = "Attach a screenshot or PDF of your payment receipt.";
  if (Object.keys(errors).length) return { errors, values: { method, transaction: txRef, note } };

  submitPayment(order, method, txRef, note, proof);
  const notify = process.env.NOTIFY_EMAIL_TO;
  if (notify) {
    void sendMail(
      notify,
      `Payment submitted: ${order.reference}`,
      `<p>${esc(user.name)} (${esc(user.email)}) submitted payment of <b>${formatPkr(order.amount_pkr)}</b> via ${esc(method)} (ref ${esc(txRef)}) for order ${order.reference}.</p><p><a href="${SITE_URL}/admin/orders">Review it in the admin panel</a></p>`,
    );
  }
  revalidatePath(`/orders/${ref}`);
  return { ok: true, message: "Thank you! We have your payment details and will confirm shortly, normally within one working day." };
}

export async function cancelOrder(fd: FormData) {
  const ref = String(fd.get("reference") ?? "");
  const user = await requireUser(`/orders/${ref}`);
  const order = orderByRef(ref);
  if (order && order.user_id === user.id && order.status === "awaiting_payment") run("UPDATE orders SET status = 'cancelled' WHERE id = ?", order.id);
  redirect("/learn/orders");
}
