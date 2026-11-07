"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MOBILE_EXTRA_LINKS, NAV_LINKS } from "@/lib/site";
import { Logo } from "./Logo";

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

/** `account` is the signed-in user (null when signed out): the header shows Log in / Create account, or the dashboard. */
export function Nav({ account = null }: { account?: { home: string; admin: boolean } | null }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const pill = hovered ?? NAV_LINKS.find((l) => isActive(path, l.href))?.href;

  return (
    <>
      <header className={`nav ${scrolled ? "nav--scrolled" : ""}`}>
        <div className="nav__inner">
          <Link href="/" className="nav__brand" aria-label="Learning Impact home" onClick={() => setOpen(false)}>
            <Logo />
          </Link>

          <nav className="nav__links" aria-label="Main" onPointerLeave={() => setHovered(null)}>
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`nav__link ${isActive(path, l.href) ? "is-active" : ""}`}
                onPointerEnter={() => setHovered(l.href)}
                aria-current={isActive(path, l.href) ? "page" : undefined}
              >
                {pill === l.href && (
                  <motion.span layoutId="nav-pill" className="nav__pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                )}
                <span>{l.label}</span>
              </Link>
            ))}
          </nav>

          {account ? (
            <>
              {account.admin && (
                <Link href="/admin" className="nav__login nav__login--admin">
                  🛡️ Admin
                </Link>
              )}
              <Link href={account.home} className="nav__cta">
                <span>My dashboard</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="nav__login">
                Log in
              </Link>
              <Link href="/register" className="nav__cta">
                <span>Create account</span>
              </Link>
            </>
          )}

          <button
            className={`nav__burger ${open ? "is-open" : ""}`}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="menu"
            initial={{ clipPath: "circle(0% at calc(100% - 44px) 40px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 44px) 40px)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 44px) 40px)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav aria-label="Mobile">
              {[
                ...NAV_LINKS,
                ...MOBILE_EXTRA_LINKS,
                ...(account
                  ? [{ href: account.home, label: "My dashboard" }, ...(account.admin ? [{ href: "/admin", label: "Admin panel" }] : [])]
                  : [
                      { href: "/login", label: "Log in" },
                      { href: "/register", label: "Create account" },
                    ]),
              ].map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ y: 60, opacity: 0, rotate: 4 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: 30, opacity: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link href={l.href} className={`menu__link ${isActive(path, l.href) ? "is-active" : ""}`} onClick={() => setOpen(false)}>
                    <span className="menu__index">0{i + 1}</span>
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
