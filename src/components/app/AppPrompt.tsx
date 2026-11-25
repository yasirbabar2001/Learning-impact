"use client";

import { useEffect, useState } from "react";
import { InstallApp, isStandalone } from "./InstallApp";

const KEY = "li-app-prompt-dismissed";

/** On phones, a small one-time bar offering the app. Dismissing it hides it for 30 days. */
export function AppPrompt() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (isStandalone() || navigator.webdriver || !window.matchMedia("(max-width: 760px)").matches) return;
    try {
      const at = Number(localStorage.getItem(KEY) || 0);
      if (Date.now() - at < 30 * 864e5) return;
    } catch {
      /* storage blocked: still show */
    }
    const t = setTimeout(() => setShow(true), 12000);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  const close = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="appbar" role="region" aria-label="Get the app">
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icon */}
      <img src="/icons/icon-192.png" alt="" width={40} height={40} />
      <p>
        <b>Learning Impact app</b>
        <span>Learn faster from your home screen</span>
      </p>
      <InstallApp className="appbar__btn" label="Install" compact />
      <button type="button" className="appbar__x" aria-label="Not now" onClick={close}>
        ×
      </button>
    </div>
  );
}
