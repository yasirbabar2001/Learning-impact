"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CURRENCY_COOKIE } from "@/lib/money";

/**
 * Prices are shown in PKR to visitors in Pakistan and in US dollars elsewhere. Visitors who are not signed in are
 * placed by their browser's time zone; the answer is kept in a cookie and the page re-renders once with it.
 */
export function CurrencyProbe() {
  const router = useRouter();
  useEffect(() => {
    try {
      if (document.cookie.split("; ").some((c) => c.startsWith(`${CURRENCY_COOKIE}=`))) return;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const currency = tz === "Asia/Karachi" ? "PKR" : "USD";
      document.cookie = `${CURRENCY_COOKIE}=${currency}; path=/; max-age=31536000; samesite=lax`;
      if (currency === "USD") router.refresh();
    } catch {
      /* keep the default (PKR) */
    }
  }, [router]);
  return null;
}
