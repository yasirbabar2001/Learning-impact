import type { Metadata } from "next";
import { TrainerForm } from "@/components/forms/TrainerForm";
import { IconTarget, IconUsers, IconShield } from "@/components/Icons";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Hire a Corporate Trainer",
  description: "Request an expert trainer for workshops, courses, coaching or keynotes. Matched to your topic, industry and audience, anywhere in Pakistan.",
  alternates: { canonical: "/trainers" },
};

export default async function TrainersPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  return (
    <>
      <PageHero eyebrow="Hire a trainer" title="The right expert," highlight="right on time.">
        <p>Share your brief and we will shortlist trainers whose experience fits your topic, industry and audience, with profiles before you commit.</p>
      </PageHero>
      <section className="container section section--tight">
        <div className="trainer-points">
          {[
            { icon: <IconTarget />, title: "Precise matching", text: "Topic, seniority, industry and language all considered." },
            { icon: <IconUsers />, title: "Profiles first", text: "Review experience and approach before deciding." },
            { icon: <IconShield />, title: "Quality assured", text: "Session plans agreed with you before delivery." },
          ].map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08} className="trainer-point">
              <span className="why__icon">{p.icon}</span>
              <div>
                <h3>{p.title}</h3>
                <p className="muted">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="container section section--tight form-section">
        <Reveal>
          <TrainerForm topic={topic?.slice(0, 200)} />
        </Reveal>
      </section>
    </>
  );
}
