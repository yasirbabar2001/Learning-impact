"use client";

import { useEffect } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
declare global {
  interface Window {
    __liInstall?: InstallEvent | null;
  }
}

/** Registers the app's service worker and keeps the browser's "install app" offer for the Get the app buttons. */
export function PwaRegister() {
  useEffect(() => {
    const keep = (e: Event) => {
      e.preventDefault();
      window.__liInstall = e as InstallEvent;
      window.dispatchEvent(new Event("li-installable"));
    };
    const installed = () => {
      window.__liInstall = null;
      window.dispatchEvent(new Event("li-installed"));
    };
    window.addEventListener("beforeinstallprompt", keep);
    window.addEventListener("appinstalled", installed);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", keep);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  return null;
}
