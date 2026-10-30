import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Learning Impact about corporate training programs, trainers and partnerships.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const s = await getSettings();
  const wa = s.whatsapp.replace(/[^\d]/g, "");
  const cards = [
    s.email && { label: "E-mail", value: s.email, href: `mailto:${s.email}` },
    s.phone && { label: "Phone", value: s.phone, href: `tel:${s.phone.replace(/\s/g, "")}` },
    wa && { label: "WhatsApp", value: s.whatsapp, href: `https://wa.me/${wa}` },
    s.address && { label: "Based in", value: s.address },
  ].filter(Boolean) as { label: string; value: string; href?: string }[];

  return (
    <>
      <PageHero eyebrow="Contact" title="Let's start a" highlight="conversation.">
        <p>Tell us about your team and what you want to achieve. We reply within one working day.</p>
      </PageHero>
      <section className="container section section--tight contact">
        <div className="contact__cards">
          {cards.map((c, i) => (
            <Reveal key={c.label} delay={i * 0.08}>
              {c.href ? (
                <a className="contact-card spot" href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                  <span className="muted">{c.label}</span>
                  <strong>{c.value}</strong>
                </a>
              ) : (
                <div className="contact-card spot">
                  <span className="muted">{c.label}</span>
                  <strong>{c.value}</strong>
                </div>
              )}
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1}>
          <ContactForm />
        </Reveal>
      </section>
    </>
  );
}
