"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Always-visible upgrade strip inside a free course: current plan, a Free vs Premium comparison and the upgrade button. */
export function PremiumBar({ href, price, freeCount, children }: { href: string; price: string; freeCount: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);
  return (
    <>
      <div className="pbar" role="region" aria-label="Your plan">
        <span className="pbar__plan">
          <span className="pbar__badge">
            🎁 Free<span className="pbar__long"> plan</span>
          </span>
          <span className="pbar__text">Basic stages 1 to {freeCount} free</span>
        </span>
        <button type="button" className="pbar__compare" onClick={() => setOpen(true)}>
          <span className="pbar__long">Free vs Premium</span>
          <span className="pbar__short">Compare</span>
        </button>
        <Link href={href} className="pbar__go">
          👑 Upgrade<span className="pbar__long"> to Premium</span> · {price}
        </Link>
      </div>
      {open &&
        createPortal(
          <div className="pmodal" role="dialog" aria-modal="true" aria-label="Free vs Premium" onClick={() => setOpen(false)}>
            <div className="pmodal__card" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="pmodal__x" aria-label="Close" onClick={() => setOpen(false)}>
                ×
              </button>
              {children}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
