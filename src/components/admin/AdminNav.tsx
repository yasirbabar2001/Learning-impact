"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { logout } from "@/app/admin/actions";
import { Logo } from "../Logo";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/orders", label: "Payments" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/learners", label: "Manage learners" },
  { href: "/admin/certifications", label: "Certifications" },
  { href: "/admin/library", label: "Regulatory library" },
  { href: "/admin/programs", label: "Programs" },
  { href: "/admin/settings", label: "Site settings" },
];

/** `me` is the signed-in account (absent when using the owner password), so admins can switch back to it. */
export function AdminNav({ me }: { me?: { home: string; label: string } }) {
  const path = usePathname();
  return (
    <header className="admin-nav">
      <Link href="/admin" className="admin-nav__brand" aria-label="Admin home">
        <Logo animated={false} />
        <span className="tag">Admin</span>
      </Link>
      <nav className="tabs" aria-label="Admin">
        {LINKS.map((l) => {
          const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} className={`tab ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined}>
              {active && <motion.span layoutId="admin-pill" className="tab__pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span>{l.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="admin-nav__end">
        {me && (
          <Link href={me.home} className="role-switch">
            ↩ {me.label}
          </Link>
        )}
        <Link href="/" className="link-arrow" target="_blank">
          View site <span>↗</span>
        </Link>
        <form action={logout}>
          <button className="btn btn--ghost btn--sm">
            <span className="btn__label">Sign out</span>
          </button>
        </form>
      </div>
    </header>
  );
}
