"use client";

import { useEffect } from "react";

/** After the page (and its entrance animation) has rendered, scrolls to the #anchor in the URL, e.g. #quests. */
export function ScrollToHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const go = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    const t = window.setTimeout(go, 350);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}
