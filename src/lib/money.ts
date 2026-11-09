/** Learners in Pakistan pay in rupees; everyone else pays in US dollars. */
export type Currency = "PKR" | "USD";

export const CURRENCY_COOKIE = "li_cur";

export const formatMoney = (n: number, currency: Currency | string) =>
  currency === "USD" ? `$${Math.round(n).toLocaleString("en-US")}` : `PKR ${Math.round(n).toLocaleString("en-PK")}`;

/** A Pakistani mobile number: +92 / 0092 / 92 prefix, or the local 03XX format. */
export function isPakistaniPhone(phone: string | null | undefined) {
  const d = String(phone ?? "").replace(/\D/g, "");
  return /^(0092|92)3\d{9}$/.test(d) || /^03\d{9}$/.test(d);
}
