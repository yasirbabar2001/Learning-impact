import Image from "next/image";
import Link from "next/link";
import { Faq } from "@/components/Faq";
import { IconBook, IconBuilding, IconChart, IconGlobe, IconHybrid, IconMic, IconScreen, IconShield, IconSpark, IconTarget, IconUsers } from "@/components/Icons";
import { Magnetic } from "@/components/Magnetic";
import { Reveal } from "@/components/Reveal";
import { Swoosh } from "@/components/Swoosh";
import { RotatingWords, SplitWords } from "@/components/Text";
import { TiltCard } from "@/components/TiltCard";
import { getPublishedPrograms, getSettings } from "@/lib/data";
import { INDUSTRIES } from "@/lib/industries";

const TOPICS = [
  "Leadership",
  "Communication",
  "Sales",
  "Customer Experience",
  "AI at Work",
  "Data Literacy",
  "Excel",
  "Project Management",
  "Finance for Managers",
  "Wellbeing",
  "Presentation Skills",
  "Train the Trainer",
];

const STEPS = [
  { n: "01", title: "Tell us the need", text: "Book a program or describe the trainer you need. It takes about two minutes." },
  { n: "02", title: "We shape the plan", text: "A learning consultant confirms goals, audience and logistics, then sends a clear proposal." },
  { n: "03", title: "Training goes live", text: "Expert trainers deliver on-site, live online or hybrid, with practical exercises throughout." },
  { n: "04", title: "Measure the impact", text: "Feedback, assessments and a short report so you can see what changed." },
];

const WHY = [
  { icon: <IconTarget />, title: "Tailored to your context", text: "Examples, cases and role-plays drawn from your industry and your team's real work." },
  { icon: <IconSpark />, title: "Practical, not theoretical", text: "Most of the time is spent practising, so new habits survive the return to the desk." },
  { icon: <IconChart />, title: "Measurable results", text: "Pre- and post-session checks and a summary report available for every engagement." },
  { icon: <IconUsers />, title: "Vetted expert trainers", text: "Practitioners with real industry experience, matched carefully to your audience." },
  { icon: <IconGlobe />, title: "Anywhere in Pakistan", text: "On-site in your offices or a venue of your choice, or live online for distributed teams." },
  { icon: <IconMic />, title: "English or Urdu", text: "Delivery in the language your people learn best in, or a natural mix of both." },
];

const FEATURED_INDUSTRIES = ["commercial-banking", "islamic-banking", "insurance-and-takaful", "telecommunications", "pharmaceutical", "fmcg", "manufacturing", "oil-and-gas", "government-and-public-sector", "education", "hospitality-and-hotels", "fintech"];

const FAQ = [
  { q: "How quickly can a training be arranged?", a: "For catalogue programs, usually within two to three weeks of confirmation. Tailored programs and specialist trainers may need a little longer; tell us your dates and we will be upfront about what is possible." },
  { q: "Can you customise a program for our company?", a: "Yes. Every catalogue program can be adapted, and we also design programs from scratch around your goals, culture and the challenges your people face." },
  { q: "Do you deliver outside Karachi, Lahore and Islamabad?", a: "Yes. We deliver on-site anywhere in Pakistan, and live virtual sessions work for teams spread across cities." },
  { q: "What is the minimum or maximum group size?", a: "Interactive workshops work best with 8 to 25 participants. For larger audiences we run multiple cohorts or keynote-style sessions." },
  { q: "Do participants receive certificates?", a: "Yes, participants receive a certificate of completion. We can also include assessments if you need evidence of learning." },
  { q: "How is pricing decided?", a: "Pricing depends on the program, duration, number of participants and format. Send a request and we will share a clear proposal with no obligation." },
];

export default async function Home() {
  const [settings, programs] = await Promise.all([getSettings(), getPublishedPrograms()]);
  const featured = (programs.some((p) => p.featured) ? programs.filter((p) => p.featured) : programs).slice(0, 4);

  return (
    <>
      <section className="hero container">
        <p className="eyebrow">
          <span className="eyebrow__dot" />
          {settings.heroEyebrow}
        </p>
        <h1 className="display display--xl">
          <SplitWords text={settings.heroTitle} delay={0.35} />
          {settings.heroHighlight && (
            <span className="display__highlight">
              <SplitWords text={settings.heroHighlight} className="rainbow-text" delay={0.35 + settings.heroTitle.split(" ").length * 0.07} />
              <Swoosh />
            </span>
          )}
        </h1>
        <Reveal delay={0.9} className="hero__sub">
          <p>{settings.heroSubtitle}</p>
        </Reveal>
        <Reveal delay={1.05} className="hero__ctas">
          <Magnetic href="/book">Book a training program</Magnetic>
          <Magnetic href="/trainers" variant="ghost">
            Request a trainer
          </Magnetic>
        </Reveal>
        <Reveal delay={1.2} className="hero__for">
          <span className="muted">Training for</span> <RotatingWords words={["new managers", "sales teams", "senior leaders", "frontline staff", "graduate hires", "whole organisations"]} />
        </Reveal>
        <div className="hero__scroll" aria-hidden="true">
          <span />
        </div>
      </section>

      <section className="marquee" aria-label="Training topics">
        {[0, 1].map((row) => (
          <div key={row} className={`marquee__track ${row ? "marquee__track--reverse" : ""}`}>
            {[...TOPICS, ...TOPICS].map((t, i) => (
              <span key={`${t}-${i}`} className={i % 3 === row ? "marquee__item marquee__item--outline" : "marquee__item"}>
                {t}
                <i aria-hidden="true">✦</i>
              </span>
            ))}
          </div>
        ))}
      </section>

      <section className="section container">
        <Reveal>
          <p className="eyebrow">Two ways to work with us</p>
          <h2 className="h2">
            Pick a program, or bring in <span className="rainbow-text">the right expert.</span>
          </h2>
        </Reveal>
        <div className="paths">
          <Reveal delay={0.05}>
            <TiltCard className="path">
              <span className="path__icon">
                <IconBook size={28} />
              </span>
              <h3>Book a training program</h3>
              <p className="muted">Choose from ready-to-run programs across leadership, communication, sales, digital skills and more. Delivered for your team, on your dates.</p>
              <ul className="ticks">
                <li>Proven outlines, adaptable to your context</li>
                <li>On-site, live virtual or hybrid</li>
                <li>Proposal within one working day</li>
              </ul>
              <Link href="/book" className="path__link">
                Book a program <span>→</span>
              </Link>
            </TiltCard>
          </Reveal>
          <Reveal delay={0.15}>
            <TiltCard className="path path--alt">
              <span className="path__icon">
                <IconUsers size={28} />
              </span>
              <h3>Request a trainer</h3>
              <p className="muted">Need a specialist for a workshop, a course series, coaching or a keynote? Tell us the brief and we will match you with trainers who fit.</p>
              <ul className="ticks">
                <li>Matched to topic, industry and audience</li>
                <li>Profiles shared before you commit</li>
                <li>English, Urdu or both</li>
              </ul>
              <Link href="/trainers" className="path__link">
                Request a trainer <span>→</span>
              </Link>
            </TiltCard>
          </Reveal>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section container">
          <Reveal className="section__head">
            <div>
              <p className="eyebrow">Popular programs</p>
              <h2 className="h2">Where teams usually start.</h2>
            </div>
            <Link href="/programs" className="link-arrow">
              See all programs <span>→</span>
            </Link>
          </Reveal>
          <div className="featured">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}>
                <Link href={`/book?program=${p.slug}`} className="feature-card spot">
                  <span className="feature-card__num">0{i + 1}</span>
                  <span className="tag">{p.category}</span>
                  <h3>{p.title}</h3>
                  <p className="muted">{p.summary}</p>
                  <span className="feature-card__foot">
                    <span>{p.duration}</span>
                    <span className="feature-card__go" aria-hidden="true">
                      →
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="section container">
        <Reveal>
          <p className="eyebrow">How it works</p>
          <h2 className="h2">
            From request to results in <span className="rainbow-text">four steps.</span>
          </h2>
        </Reveal>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <li className="step spot">
                <span className="step__n">{s.n}</span>
                <h3>{s.title}</h3>
                <p className="muted">{s.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="section container">
        <Reveal>
          <p className="eyebrow">Delivery formats</p>
          <h2 className="h2">Wherever your people are.</h2>
        </Reveal>
        <div className="formats">
          {[
            { icon: <IconBuilding size={30} />, title: "On-site", text: "Immersive in-person sessions at your office or a venue we arrange, anywhere in Pakistan." },
            { icon: <IconScreen size={30} />, title: "Live virtual", text: "Interactive online classrooms with breakouts, polls and real practice, never a passive webinar." },
            { icon: <IconHybrid size={30} />, title: "Hybrid", text: "A room and remote colleagues learning together, facilitated so nobody is a second-class participant." },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 0.1}>
              <div className="format-card spot">
                <span className="format-card__icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p className="muted">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section container">
        <Reveal>
          <p className="eyebrow">Why Learning Impact</p>
          <h2 className="h2">
            Training people talk about <span className="rainbow-text">long after.</span>
          </h2>
        </Reveal>
        <div className="why">
          {WHY.map((w, i) => (
            <Reveal key={w.title} delay={(i % 3) * 0.08}>
              <div className="why__item spot">
                <span className="why__icon">{w.icon}</span>
                <h3>{w.title}</h3>
                <p className="muted">{w.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section container" aria-labelledby="ifspace-title">
        <Reveal className="initiative">
          <a className="initiative__brand" href="https://islamicfinancespace.com" target="_blank" rel="noopener noreferrer" aria-label="Visit ifSPACE, Islamic Finance Space (opens in a new tab)">
            <Image src="/ifspace-logo.png" alt="ifSPACE: Islamic Finance Space" width={561} height={206} />
            <span className="initiative__visit">
              islamicfinancespace.com <span aria-hidden="true">↗</span>
            </span>
          </a>
          <div className="initiative__body">
            <p className="eyebrow">
              <span className="eyebrow__dot" />
              An initiative of Learning Impact
            </p>
            <h2 className="h3" id="ifspace-title">
              ifSPACE: a home for <span className="rainbow-text">Islamic finance</span> learning.
            </h2>
            <p className="muted">
              ifSPACE (Islamic Finance Space) is our dedicated platform for people building a career in Islamic banking and finance. It helps professionals
              prepare for recognised Islamic finance certifications and deepen their understanding of the field, from core Shariah principles to how they are
              applied in real products and institutions.
            </p>
            <ul className="ticks">
              <li>Guidance and preparation for professional certifications</li>
              <li>Structured study of Islamic banking, finance and Shariah principles</li>
              <li>For bankers, finance teams, students and Shariah professionals</li>
            </ul>
            <a className="btn btn--ghost" href="https://islamicfinancespace.com" target="_blank" rel="noopener noreferrer">
              <span className="btn__label">Explore ifSPACE</span>
              <span className="btn__arrow" aria-hidden="true">↗</span>
            </a>
          </div>
        </Reveal>
      </section>

      <section className="section container">
        <Reveal className="industries glass">
          <div>
            <p className="eyebrow">Built for your sector</p>
            <h2 className="h3">Every industry has its own language. We speak it.</h2>
            <p className="muted industries__lead">Training shaped around the regulations, risks and customers of {INDUSTRIES.length} industries.</p>
            <Link href="/industries" className="btn btn--primary industries__cta">
              <span className="btn__label">Explore training by industry</span>
              <span className="btn__arrow">→</span>
            </Link>
          </div>
          <div className="chips">
            {FEATURED_INDUSTRIES.map((slug) => INDUSTRIES.find((i) => i.slug === slug)!).map((ind) => (
              <Link key={ind.slug} href={`/book?industry=${ind.slug}`} className="chip">
                {ind.name}
              </Link>
            ))}
            <Link href="/industries" className="chip chip--more">
              +{INDUSTRIES.length - FEATURED_INDUSTRIES.length} more →
            </Link>
          </div>
          <span className="industries__badge">
            <IconShield size={18} /> Confidential by default
          </span>
        </Reveal>
      </section>

      <section className="section container faq-section">
        <Reveal>
          <p className="eyebrow">Questions</p>
          <h2 className="h2">Good to know.</h2>
          <p className="muted">
            Something else on your mind? <Link href="/contact" className="inline-link">Ask us directly.</Link>
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <Faq items={FAQ} />
        </Reveal>
      </section>
    </>
  );
}
