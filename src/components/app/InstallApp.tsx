"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { InstallSteps, STEPS, type Platform } from "./steps";

function detect(): Platform {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function isStandalone() {
  return (
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function subscribe(cb: () => void) {
  window.addEventListener("li-installable", cb);
  window.addEventListener("li-installed", cb);
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", cb);
  return () => {
    window.removeEventListener("li-installable", cb);
    window.removeEventListener("li-installed", cb);
    mq.removeEventListener("change", cb);
  };
}

/** Shared state for every Get the app button: can the browser install directly, and is the app already open as an app. */
export function useInstall() {
  const canPrompt = useSyncExternalStore(subscribe, () => Boolean(window.__liInstall), () => false);
  const standalone = useSyncExternalStore(subscribe, isStandalone, () => false);
  return { canPrompt, standalone };
}

/** The "Get the app" button: installs straight away where the browser allows it, otherwise shows the steps for this device. */
export function InstallApp({ className = "btn btn--primary", label = "Get the app", compact = false }: { className?: string; label?: string; compact?: boolean }) {
  const { canPrompt, standalone } = useInstall();
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  if (standalone) return null;

  const click = async () => {
    const ev = window.__liInstall;
    if (ev) {
      await ev.prompt();
      const choice = await ev.userChoice.catch(() => null);
      if (choice?.outcome === "accepted") window.__liInstall = null;
      return;
    }
    setPlatform(detect());
    setOpen(true);
  };

  return (
    <>
      <button type="button" className={`${className} appbtn`} onClick={click} data-installable={canPrompt ? "yes" : "no"}>
        <span aria-hidden="true">📲</span> <span className={compact ? "" : "btn__label"}>{label}</span>
      </button>
      {open &&
        createPortal(
          <div className="appmodal" role="dialog" aria-modal="true" aria-labelledby="appmodal-title" onClick={() => setOpen(false)}>
            <div className="appmodal__card" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="appmodal__x" aria-label="Close" onClick={() => setOpen(false)}>
                ×
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icon */}
              <img src="/icons/icon-192.png" alt="" width={64} height={64} className="appmodal__icon" />
              <h2 id="appmodal-title">Install the Learning Impact app</h2>
              <p className="muted">Free. No app store needed. Takes 10 seconds.</p>
              <div className="appmodal__tabs" role="tablist">
                {(["android", "ios", "desktop"] as Platform[]).map((p) => (
                  <button key={p} type="button" role="tab" aria-selected={platform === p} className={platform === p ? "is-on" : ""} onClick={() => setPlatform(p)}>
                    {STEPS[p].icon} {STEPS[p].title}
                  </button>
                ))}
              </div>
              <InstallSteps platform={platform} />
              <a href="/app" className="appmodal__more">
                More about the app →
              </a>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
