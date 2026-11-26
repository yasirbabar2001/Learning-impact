"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { InstallApp, isStandalone } from "./InstallApp";

const KEY = "li-app-prompt-dismissed";

/** Top-right card offering the app on every device. Closing it hides it for 30 days; never shown inside the installed app. */
export function AppPrompt() {
  const path = usePathname();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const forced = new URLSearchParams(location.search).has("app-prompt");
    if (isStandalone() || (navigator.webdriver && !forced)) return;
    try {
      const at = Number(localStorage.getItem(KEY) || 0);
      if (!forced && Date.now() - at < 30 * 864e5) return;
    } catch {
      /* storage blocked: still show */
    }
    const t = setTimeout(() => setShow(true), forced ? 0 : 1500);
    return () => clearTimeout(t);
  }, []);
  if (!show || path === "/app") return null;
  const close = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="appcard" role="region" aria-label="Get the app">
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icon */}
      <img src="/icons/icon-192.png" alt="" width={44} height={44} />
      <p>
        <b>Get the Learning Impact app</b>
        <span>Free · Android, iPhone &amp; desktop</span>
      </p>
      <InstallApp className="appcard__btn" label="Install" compact />
      <button type="button" className="appcard__x" aria-label="Close" onClick={close}>
        ×
      </button>
    </div>
  );
}
