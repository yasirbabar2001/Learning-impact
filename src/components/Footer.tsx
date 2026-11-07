import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { Logo } from "./Logo";

export function Footer({ settings }: { settings: SiteSettings }) {
  const socials = [
    { label: "LinkedIn", href: settings.linkedin },
    { label: "Instagram", href: settings.instagram },
    { label: "Facebook", href: settings.facebook },
  ].filter((s) => s.href);
  const wa = settings.whatsapp.replace(/[^\d]/g, "");

  return (
    <footer className="footer">
      <div className="footer__cta">
        <p className="eyebrow">Ready when you are</p>
        <h2 className="footer__headline">
          Let&apos;s build your team&apos;s <span className="rainbow-text">next leap.</span>
        </h2>
        <div className="footer__actions">
          <Link prefetch={false} href="/book" className="btn btn--primary">
            <span className="btn__label">Book a program</span>
            <span className="btn__arrow">→</span>
          </Link>
          <Link prefetch={false} href="/trainers" className="btn btn--ghost">
            <span className="btn__label">Request a trainer</span>
            <span className="btn__arrow">→</span>
          </Link>
        </div>
      </div>

      <div className="footer__grid">
        <div>
          <Logo className="footer__logo" animated={false} />
          <p className="muted">Corporate training, professional certifications and expert trainers for organisations worldwide.</p>
        </div>
        <div>
          <h3>Explore</h3>
          <Link prefetch={false} href="/certifications">Certifications</Link>
          <Link prefetch={false} href="/programs">Programs</Link>
          <Link prefetch={false} href="/industries">Industries</Link>
          <Link prefetch={false} href="/trainers">Hire a trainer</Link>
          <Link prefetch={false} href="/about">About us</Link>
          <Link prefetch={false} href="/contact">Contact</Link>
          <Link prefetch={false} href="/verify">Verify a certificate</Link>
          <Link prefetch={false} href="/login">Learner login</Link>
        </div>
        <div>
          <h3>Contact</h3>
          {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
          {settings.phone && <a href={`tel:${settings.phone.replace(/\s/g, "")}`}>{settings.phone}</a>}
          {wa && (
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          )}
          {settings.address && <span className="muted">{settings.address}</span>}
        </div>
        {socials.length > 0 && (
          <div>
            <h3>Follow</h3>
            {socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            ))}
          </div>
        )}
      </div>
      <div className="footer__base">
        <span>© {new Date().getFullYear()} Learning Impact. All rights reserved.</span>
        <span className="muted">learningimpact.pk</span>
      </div>
    </footer>
  );
}
