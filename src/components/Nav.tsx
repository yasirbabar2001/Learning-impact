"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { HIRE_LINK, MOBILE_EXTRA_LINKS, NAV_LINKS, PROGRAMS_MENU } from "@/lib/site";
import { BrandTagline } from "./BrandTagline";
import { Logo } from "./Logo";
import { SuggestDialog } from "./SuggestTraining";

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

/** `account` is the signed-in user (null when signed out): the header shows Log in / Create account, or the dashboard. */
export function Nav({ account = null }: { account?: { home: string; admin: boolean; team?: boolean; name?: string; email?: string } | null }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [suggest, setSuggest] = useState(false);
  const [programs, setPrograms] = useState(false);
  const signedIn = account?.name && account.email ? { name: account.name, email: account.email } : null;
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
          <Link href="/" className="nav__brand brand" aria-label="Learning Impact home" onClick={() => setOpen(false)}>
            <Logo />
            <BrandTagline />
          </Link>

          <nav className="nav__links" aria-label="Main" onPointerLeave={() => setHovered(null)}>
            {NAV_LINKS.map((l) => {
              const link = (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`nav__link ${isActive(path, l.href) ? "is-active" : ""}`}
                  onPointerEnter={() => setHovered(l.href)}
                  aria-current={isActive(path, l.href) ? "page" : undefined}
                  {...(l.href === "/programs" ? { "aria-haspopup": "true" as const, "aria-expanded": programs } : {})}
                >
                  {pill === l.href && (
                    <motion.span layoutId="nav-pill" className="nav__pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                  )}
                  <span>
                    {l.label}
                    {l.href === "/programs" && <span className="nav__caret" aria-hidden="true"> ▾</span>}
                  </span>
                </Link>
              );
              if (l.href !== "/programs") return link;
              // "Programs" opens a small menu of the three kinds of training (on hover, or on keyboard focus).
              return (
                <div
                  key={l.href}
                  className={`nav__dd ${programs ? "is-open" : ""}`}
                  onPointerEnter={() => setPrograms(true)}
                  onPointerLeave={() => setPrograms(false)}
                  onFocus={() => setPrograms(true)}
                  onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setPrograms(false)}
                >
                  {link}
                  <div className="nav__menu" role="menu" aria-label="Programs">
                    {PROGRAMS_MENU.map((m) => (
                      <Link key={m.href} href={m.href} role="menuitem" className="nav__menu-item" onClick={() => setPrograms(false)}>
                        <span className="nav__menu-icon" aria-hidden="true">
                          {m.icon}
                        </span>
                        <span>
                          <strong>{m.label}</strong>
                          <small>{m.note}</small>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          <button type="button" className="nav__suggest" onClick={() => setSuggest(true)}>
            <span aria-hidden="true">💡</span> <span className="nav__long">Suggest a training</span>
            <span className="nav__short">Suggest</span>
          </button>

          <Link href={HIRE_LINK.href} className={`nav__hire ${isActive(path, HIRE_LINK.href) ? "is-active" : ""}`}>
            <span aria-hidden="true">🎯</span> <span className="nav__long">{HIRE_LINK.label}</span>
            <span className="nav__short">Hire</span>
          </Link>

          {account ? (
            <>
              {account.admin ? (
                <Link href="/admin" className="nav__login nav__login--admin">
                  🛡️ Admin
                </Link>
              ) : account.team ? (
                <Link href="/team" className="nav__login nav__login--admin">
                  📊 Team dashboard
                </Link>
              ) : null}
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
                <span className="nav__long">Create account</span>
                <span className="nav__short">Sign up</span>
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
              <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.5 }}>
                <Link href={HIRE_LINK.href} className="menu__hire" onClick={() => setOpen(false)}>
                  🎯 {HIRE_LINK.label} <span aria-hidden="true">→</span>
                </Link>
                <button
                  type="button"
                  className="menu__suggest"
                  onClick={() => {
                    setOpen(false);
                    setSuggest(true);
                  }}
                >
                  💡 Suggest a training
                </button>
              </motion.div>
              {[
                ...NAV_LINKS,
                ...MOBILE_EXTRA_LINKS,
                ...(account
                  ? [{ href: account.home, label: "My dashboard" }, ...(account.admin ? [{ href: "/admin", label: "Admin panel" }] : account.team ? [{ href: "/team", label: "Team dashboard" }] : [])]
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
                    <span className="menu__index">{String(i + 1).padStart(2, "0")}</span>
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
      {suggest && <SuggestDialog onClose={() => setSuggest(false)} signedIn={signedIn} />}
    </>
  );
}
