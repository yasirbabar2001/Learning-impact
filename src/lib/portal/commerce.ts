import "server-only";
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { all, now, one, run, tx } from "../db";
import { newId, newToken, tokenHash } from "./auth";

export type Order = {
  id: string;
  reference: string;
  user_id: string;
  company_id: string | null;
  kind: "individual" | "seats";
  course_slug: string;
  seats: number;
  unit_price_pkr: number;
  amount_pkr: number;
  status: "awaiting_payment" | "submitted" | "approved" | "rejected" | "cancelled";
  payment_method: string;
  transaction_ref: string;
  proof_file: string | null;
  buyer_note: string;
  admin_note: string;
  created_at: string;
  submitted_at: string | null;
  decided_at: string | null;
};

export const ORDER_STATUS: Record<Order["status"], string> = {
  awaiting_payment: "Awaiting payment",
  submitted: "Payment submitted",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const PAYMENT_METHODS = ["Bank transfer (IBFT)", "Easypaisa", "JazzCash", "Cheque / pay order", "Other"] as const;

/* ---------- Payment instructions (admin-editable) ---------- */

export type PaymentSettings = {
  accountTitle: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  branch: string;
  wallets: string;
  instructions: string;
};

const DEFAULT_PAYMENT: PaymentSettings = {
  accountTitle: "Learning Impact (SMC-Private) Limited",
  bankName: "",
  accountNumber: "",
  iban: "",
  branch: "",
  wallets: "",
  instructions: "Use your order reference as the payment description. Your access is activated as soon as we confirm the payment, normally within one working day.",
};

export function paymentSettings(): PaymentSettings {
  const row = one<{ value: string }>("SELECT value FROM kv WHERE key = 'payment'");
  return { ...DEFAULT_PAYMENT, ...(row ? (JSON.parse(row.value) as Partial<PaymentSettings>) : {}) };
}

export function savePaymentSettings(s: PaymentSettings) {
  run("INSERT INTO kv (key, value) VALUES ('payment', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", JSON.stringify(s));
}

/* ---------- Orders ---------- */

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const orderRef = () => "LIC-" + Array.from(randomBytes(6), (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("");

export function createOrder(o: { userId: string; companyId: string | null; kind: Order["kind"]; slug: string; seats: number; unitPrice: number }): Order {
  const id = newId();
  run(
    `INSERT INTO orders (id, reference, user_id, company_id, kind, course_slug, seats, unit_price_pkr, amount_pkr, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    orderRef(),
    o.userId,
    o.companyId,
    o.kind,
    o.slug,
    o.seats,
    o.unitPrice,
    o.unitPrice * o.seats,
    now(),
  );
  return one<Order>("SELECT * FROM orders WHERE id = ?", id)!;
}

export const orderByRef = (ref: string) => one<Order>("SELECT * FROM orders WHERE reference = ?", ref) ?? null;
export const ordersOf = (userId: string) => all<Order>("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", userId);

/** An unfinished order for the same thing, so buyers are not charged twice by mistake. */
export const openOrderFor = (userId: string, slug: string, kind: Order["kind"]) =>
  one<Order>(
    "SELECT * FROM orders WHERE user_id = ? AND course_slug = ? AND kind = ? AND status IN ('awaiting_payment', 'submitted') ORDER BY created_at DESC LIMIT 1",
    userId,
    slug,
    kind,
  ) ?? null;

/* ---------- Payment proof uploads ---------- */

const UPLOAD_DIR = () => path.join(process.env.DATA_DIR || path.join(process.cwd(), ".data"), "uploads");
export const PROOF_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };
export const MAX_PROOF_BYTES = 5 * 1024 * 1024;

/** Checks the file really is what its type claims (magic bytes), then stores it under a random name. */
export function storeProof(bytes: Buffer, mime: string): string | null {
  const ext = PROOF_TYPES[mime];
  if (!ext || bytes.length === 0 || bytes.length > MAX_PROOF_BYTES) return null;
  const sig = bytes.subarray(0, 12);
  const ok =
    (ext === "jpg" && sig[0] === 0xff && sig[1] === 0xd8) ||
    (ext === "png" && sig.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ||
    (ext === "webp" && sig.subarray(0, 4).toString() === "RIFF" && sig.subarray(8, 12).toString() === "WEBP") ||
    (ext === "pdf" && sig.subarray(0, 5).toString() === "%PDF-");
  if (!ok) return null;
  mkdirSync(UPLOAD_DIR(), { recursive: true });
  const name = `${newId()}.${ext}`;
  writeFileSync(path.join(UPLOAD_DIR(), name), bytes);
  return name;
}

export function readProof(name: string): { bytes: Buffer; type: string } | null {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/.test(name)) return null;
  try {
    const ext = name.split(".").pop()!;
    const type = Object.entries(PROOF_TYPES).find(([, e]) => e === ext)![0];
    return { bytes: readFileSync(path.join(UPLOAD_DIR(), name)), type };
  } catch {
    return null;
  }
}

export function submitPayment(order: Order, method: string, txRef: string, note: string, proof: string | null) {
  run(
    `UPDATE orders SET status = 'submitted', payment_method = ?, transaction_ref = ?, buyer_note = ?,
       proof_file = COALESCE(?, proof_file), submitted_at = ? WHERE id = ? AND status IN ('awaiting_payment', 'submitted', 'rejected')`,
    method,
    txRef,
    note,
    proof,
    now(),
    order.id,
  );
}

/* ---------- Enrolment, seats, approval ---------- */

export function enroll(userId: string, slug: string, source: "purchase" | "company" | "admin", orderId: string | null, companyId: string | null) {
  run(
    `INSERT OR IGNORE INTO enrollments (id, user_id, course_slug, source, order_id, company_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    newId(),
    userId,
    slug,
    source,
    orderId,
    companyId,
    now(),
  );
}

/** Approving an order enrols the buyer (individual) or adds seats to the company's pool. */
export function approveOrder(orderId: string, adminNote: string) {
  return tx(() => {
    const o = one<Order>("SELECT * FROM orders WHERE id = ?", orderId);
    if (!o || o.status === "approved") return o ?? null;
    run("UPDATE orders SET status = 'approved', admin_note = ?, decided_at = ? WHERE id = ?", adminNote, now(), o.id);
    if (o.kind === "individual") enroll(o.user_id, o.course_slug, "purchase", o.id, null);
    else if (o.company_id)
      run("INSERT INTO seat_pools (id, company_id, course_slug, order_id, total, created_at) VALUES (?, ?, ?, ?, ?, ?)", newId(), o.company_id, o.course_slug, o.id, o.seats, now());
    return one<Order>("SELECT * FROM orders WHERE id = ?", o.id)!;
  });
}

export function rejectOrder(orderId: string, adminNote: string) {
  run("UPDATE orders SET status = 'rejected', admin_note = ?, decided_at = ? WHERE id = ? AND status != 'approved'", adminNote, now(), orderId);
}

export type SeatSummary = { course_slug: string; total: number; used: number; pending: number };

/** Seats bought, seats used by accepted invitations and seats held by pending invitations, per course. */
export function seatSummary(companyId: string): SeatSummary[] {
  return all<SeatSummary>(
    `SELECT p.course_slug,
            SUM(p.total) AS total,
            (SELECT COUNT(*) FROM invitations i WHERE i.company_id = p.company_id AND i.course_slug = p.course_slug AND i.status = 'accepted') AS used,
            (SELECT COUNT(*) FROM invitations i WHERE i.company_id = p.company_id AND i.course_slug = p.course_slug AND i.status = 'pending') AS pending
     FROM seat_pools p WHERE p.company_id = ? GROUP BY p.course_slug ORDER BY p.course_slug`,
    companyId,
  );
}

export function seatsFree(companyId: string, slug: string) {
  const s = seatSummary(companyId).find((r) => r.course_slug === slug);
  return s ? s.total - s.used - s.pending : 0;
}

export type Invitation = {
  id: string;
  company_id: string;
  course_slug: string;
  email: string;
  status: "pending" | "accepted" | "revoked";
  created_at: string;
  accepted_at: string | null;
  accepted_user_id: string | null;
};

/** Holds a seat for an e-mail address and returns the secret invitation token. */
export function createInvitation(companyId: string, slug: string, email: string): string | null {
  return tx(() => {
    if (seatsFree(companyId, slug) < 1) return null;
    const existing = one<Invitation>("SELECT * FROM invitations WHERE company_id = ? AND course_slug = ? AND email = ? AND status IN ('pending', 'accepted')", companyId, slug, email);
    if (existing) return null;
    const token = newToken();
    run(
      "INSERT INTO invitations (id, token_hash, company_id, course_slug, email, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      newId(),
      tokenHash(token),
      companyId,
      slug,
      email,
      now(),
    );
    return token;
  });
}

export const invitationByToken = (token: string) => one<Invitation>("SELECT * FROM invitations WHERE token_hash = ?", tokenHash(token)) ?? null;
export const invitationsOf = (companyId: string) => all<Invitation>("SELECT * FROM invitations WHERE company_id = ? ORDER BY created_at DESC", companyId);

/** Accepting: the learner joins the company (as a member, unless already its manager) and is enrolled. */
export function acceptInvitation(inv: Invitation, userId: string) {
  return tx(() => {
    const fresh = one<Invitation>("SELECT * FROM invitations WHERE id = ?", inv.id);
    if (!fresh || fresh.status !== "pending") return false;
    run("UPDATE invitations SET status = 'accepted', accepted_at = ?, accepted_user_id = ? WHERE id = ?", now(), userId, inv.id);
    run(
      "UPDATE users SET company_id = ?, company_role = CASE WHEN company_id = ? AND company_role = 'manager' THEN 'manager' ELSE 'member' END WHERE id = ?",
      inv.company_id,
      inv.company_id,
      userId,
    );
    enroll(userId, inv.course_slug, "company", null, inv.company_id);
    return true;
  });
}

export function revokeInvitation(companyId: string, invitationId: string) {
  run("UPDATE invitations SET status = 'revoked' WHERE id = ? AND company_id = ? AND status = 'pending'", invitationId, companyId);
}

export function createCompany(name: string, managerId: string) {
  const id = newId();
  tx(() => {
    run("INSERT INTO companies (id, name, created_at) VALUES (?, ?, ?)", id, name, now());
    run("UPDATE users SET company_id = ?, company_role = 'manager', organisation = ? WHERE id = ?", id, name, managerId);
  });
  return id;
}

export const companyById = (id: string) => one<{ id: string; name: string; created_at: string }>("SELECT * FROM companies WHERE id = ?", id) ?? null;

export type TeamRow = {
  user_id: string;
  name: string;
  email: string;
  designation: string;
  course_slug: string;
  enrolled_at: string;
  completed_at: string | null;
  last_active_day: string | null;
  xp: number;
  stages_passed: number;
  best_exam: number | null;
  attempts: number;
  cert_code: string | null;
};

/** Every company-sponsored enrolment with its progress, for the manager's dashboard and report. */
export function teamProgress(companyId: string): TeamRow[] {
  return all<TeamRow>(
    `SELECT u.id AS user_id, u.name, u.email, u.designation, e.course_slug, e.created_at AS enrolled_at, e.completed_at, u.last_active_day, u.xp,
       (SELECT COUNT(*) FROM session_progress p WHERE p.user_id = u.id AND p.course_slug = e.course_slug AND p.quiz_passed_at IS NOT NULL) AS stages_passed,
       (SELECT MAX(percent) FROM exam_attempts a WHERE a.user_id = u.id AND a.course_slug = e.course_slug AND a.submitted_at IS NOT NULL) AS best_exam,
       (SELECT COUNT(*) FROM exam_attempts a WHERE a.user_id = u.id AND a.course_slug = e.course_slug AND a.submitted_at IS NOT NULL) AS attempts,
       (SELECT code FROM certificates c WHERE c.user_id = u.id AND c.course_slug = e.course_slug AND c.revoked_at IS NULL) AS cert_code
     FROM enrollments e JOIN users u ON u.id = e.user_id
     WHERE e.company_id = ? ORDER BY e.course_slug, u.name`,
    companyId,
  );
}
