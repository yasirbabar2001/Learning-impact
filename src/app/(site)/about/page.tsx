import type { Metadata } from "next";
import { Magnetic } from "@/components/Magnetic";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learning Impact designs and delivers corporate training that changes how people work, for organisations in Pakistan and around the world.",
  alternates: { canonical: "/about" },
};

const APPROACH = [
  { k: "Diagnose", t: "We start with the business problem, not the training topic: who needs to do what differently, and why it matters." },
  { k: "Design", t: "Sessions are built around real situations from your workplace, with plenty of practice and clear take-aways." },
  { k: "Deliver", t: "Experienced trainers facilitate with energy and care, on-site, online or both." },
  { k: "Measure", t: "We check what changed and share honest recommendations for what to do next." },
];

const VALUES = [
  { k: "Impact over activity", t: "Success is a change in how people work, not the number of hours in a classroom." },
  { k: "Respect for learners", t: "Adults learn best when their experience is valued and their time is used well." },
  { k: "Straightforward partnership", t: "Clear proposals, honest advice and no surprises." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About Learning Impact" title="We exist for the moment" highlight="learning sticks.">
        <p>
          Learning Impact connects organisations with training that actually changes behaviour at work. We combine a curated catalogue of practical programs with a network of experienced trainers, so every team gets learning that fits.
        </p>
      </PageHero>

      <section className="container section">
        <Reveal>
          <p className="eyebrow">Our approach</p>
          <h2 className="h2">
            Four moves, <span className="rainbow-text">one outcome.</span>
          </h2>
        </Reveal>
        <div className="approach">
          {APPROACH.map((a, i) => (
            <Reveal key={a.k} delay={i * 0.08}>
              <div className="approach__item spot">
                <span className="approach__k">{a.k}</span>
                <p className="muted">{a.t}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container section">
        <Reveal>
          <p className="eyebrow">What we believe</p>
          <h2 className="h2">Principles we work by.</h2>
        </Reveal>
        <div className="values">
          {VALUES.map((v, i) => (
            <Reveal key={v.k} delay={i * 0.1}>
              <div className="value">
                <span className="value__n">0{i + 1}</span>
                <h3>{v.k}</h3>
                <p className="muted">{v.t}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="center-cta">
          <Magnetic href="/programs">Explore our programs</Magnetic>
        </Reveal>
      </section>
    </>
  );
}
