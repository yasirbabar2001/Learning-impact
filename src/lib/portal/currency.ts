import "server-only";
import { cookies } from "next/headers";
import type { CatalogEntry } from "../courses/catalog";
import { one, run } from "../db";
import { CURRENCY_COOKIE, isPakistaniPhone, type Currency } from "../money";

/** Rupees per US dollar, used when a course has no dollar price of its own (admin-editable). */
export const DEFAULT_USD_RATE = 280;

export function usdRate(): number {
  const row = one<{ value: string }>("SELECT value FROM kv WHERE key = 'usd_rate'");
  const n = Number(row?.value);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_USD_RATE;
}

export function saveUsdRate(rate: number) {
  run("INSERT INTO kv (key, value) VALUES ('usd_rate', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", String(rate));
}

/**
 * Which currency this person sees and pays in. A signed-in learner with a Pakistani mobile number pays in PKR and
 * any other mobile number in USD; visitors are placed by their browser's time zone (cookie set on the first visit),
 * defaulting to PKR until it is known.
 */
export async function viewerCurrency(user?: { phone?: string | null } | null): Promise<Currency> {
  if (user?.phone) return isPakistaniPhone(user.phone) ? "PKR" : "USD";
  const c = (await cookies()).get(CURRENCY_COOKIE)?.value;
  return c === "USD" ? "USD" : "PKR";
}

/** Price of a certification in the given currency (the dollar price set by the admin, else converted and rounded). */
export function priceIn(entry: Pick<CatalogEntry, "pricePkr" | "priceUsd">, currency: Currency): number {
  if (currency === "PKR") return entry.pricePkr;
  if (entry.priceUsd > 0) return entry.priceUsd;
  return entry.pricePkr > 0 ? Math.max(1, Math.round(entry.pricePkr / usdRate())) : 0;
}

/** Converts an amount between currencies with the admin's rate (used to credit earlier stage payments). */
export function convert(amount: number, from: Currency, to: Currency) {
  if (from === to) return amount;
  return from === "PKR" ? Math.round(amount / usdRate()) : Math.round(amount * usdRate());
}
