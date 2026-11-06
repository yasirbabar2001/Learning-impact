"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/lib/actions/account";
import { levelFor } from "@/lib/portal/levels";
import { Logo } from "../Logo";

type NavUser = { name: string; xp: number; streak: number; level: number; levelName: string; progress: number; manager: boolean };

export function PortalNav({ user }: { user: NavUser | null }) {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setMenu(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  const links = [
    { href: "/learn", label: "My quests", exact: true },
    { href: "/certifications", label: "Catalogue" },
    { href: "/learn/leaderboard", label: "Leaderboard" },
    { href: "/learn/certificates", label: "Certificates" },
    ...(user?.manager ? [{ href: "/company", label: "My team" }] : []),
  ];
  // XP earned on this page is announced by the lesson player ("li:xp") so the header updates instantly,
  // without reloading the page from the server. A fresh server value resets it.
  const [extra, setExtra] = useState({ base: user?.xp ?? 0, xp: 0 });
  if (user && extra.base !== user.xp) setExtra({ base: user.xp, xp: 0 });
  useEffect(() => {
    const onXp = (e: Event) => setExtra((x) => ({ ...x, xp: x.xp + Number((e as CustomEvent<number>).detail || 0) }));
    window.addEventListener("li:xp", onXp);
    return () => window.removeEventListener("li:xp", onXp);
  }, []);
  const xp = (user?.xp ?? 0) + extra.xp;
  const lvl = levelFor(xp);

  const active = (l: { href: string; exact?: boolean }) => (l.exact ? path === l.href : path.startsWith(l.href));
  const initials = user?.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <header className="pnav">
      <div className="pnav__inner">
        <Link href={user ? "/learn" : "/"} className="pnav__brand" aria-label="Learning Impact">
          <Logo />
        </Link>
        {user && (
          <nav className="pnav__links" aria-label="Portal">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={`pnav__link ${active(l) ? "is-active" : ""}`} aria-current={active(l) ? "page" : undefined}>
                {active(l) && <motion.span layoutId="pnav-pill" className="pnav__pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span>{l.label}</span>
              </Link>
            ))}
          </nav>
        )}
        {user ? (
          <div className="pnav__me" ref={ref}>
            <span className="streak-chip" title={`${user.streak}-day learning streak`}>
              🔥 {user.streak}
            </span>
            <span className="xp-chip" title={`Level ${lvl.index} ${lvl.name} · ${xp} XP`}>
              <span className="xp-chip__lvl">L{lvl.index}</span>
              <span className="xp-chip__bar">
                <motion.span initial={{ width: 0 }} animate={{ width: `${Math.round(lvl.progress * 100)}%` }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
              </span>
              <span className="xp-chip__xp">{xp.toLocaleString()} XP</span>
            </span>
            <button className="avatar" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label="Account menu">
              {initials}
            </button>
            <AnimatePresence>
              {menu && (
                <motion.div
                  className="pmenu glass"
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="pmenu__name">{user.name}</p>
                  <p className="pmenu__lvl muted">
                    Level {user.level} · {user.levelName}
                  </p>
                  <nav className="pmenu__links">
                    {links.map((l) => (
                      <Link key={l.href} href={l.href} onClick={() => setMenu(false)} className="pmenu__mobile">
                        {l.label}
                      </Link>
                    ))}
                    <Link href="/learn/account" onClick={() => setMenu(false)}>
                      Profile & settings
                    </Link>
                    <Link href="/learn/orders" onClick={() => setMenu(false)}>
                      Orders & payments
                    </Link>
                    {!user.manager && (
                      <Link href="/company/setup" onClick={() => setMenu(false)}>
                        Set up a company account
                      </Link>
                    )}
                  </nav>
                  <form action={logout}>
                    <button className="btn btn--ghost btn--sm pmenu__out">
                      <span className="btn__label">Log out</span>
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="pnav__me">
            <Link href="/login" className="btn btn--ghost btn--sm">
              <span className="btn__label">Log in</span>
            </Link>
            <Link href="/register" className="btn btn--primary btn--sm">
              <span className="btn__label">Sign up</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
