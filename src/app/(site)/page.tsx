import Image from "next/image";
import Link from "next/link";
import { Faq } from "@/components/Faq";
import { TwoWays } from "@/components/home/TwoWays";
import { HomeQuests } from "@/components/portal/HomeQuests";
import { IconBuilding, IconChart, IconGlobe, IconHybrid, IconMic, IconScreen, IconShield, IconSpark, IconTarget, IconUsers } from "@/components/Icons";
import { Magnetic } from "@/components/Magnetic";
import { Reveal } from "@/components/Reveal";
import { Swoosh } from "@/components/Swoosh";
import { RotatingWords, SplitWords } from "@/components/Text";
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
  { icon: <IconGlobe />, title: "Anywhere you work", text: "Live online for teams anywhere in the world, or on-site at your offices or a venue of your choice." },
  { icon: <IconMic />, title: "English or Urdu", text: "Delivery in the language your people learn best in, or a natural mix of both." },
];

const FEATURED_INDUSTRIES = ["commercial-banking", "islamic-banking", "insurance-and-takaful", "telecommunications", "pharmaceutical", "fmcg", "manufacturing", "oil-and-gas", "government-and-public-sector", "education", "hospitality-and-hotels", "fintech"];

const FAQ = [
  { q: "How quickly can a training be arranged?", a: "For catalogue programs, usually within two to three weeks of confirmation. Tailored programs and specialist trainers may need a little longer; tell us your dates and we will be upfront about what is possible." },
  { q: "Can you customise a program for our company?", a: "Yes. Every catalogue program can be adapted, and we also design programs from scratch around your goals, culture and the challenges your people face." },
  { q: "Do you work with organisations outside Pakistan?", a: "Yes. Our certifications are fully online and open to learners worldwide, live virtual sessions work for teams in any time zone, and on-site delivery can be arranged on request." },
  { q: "What is the minimum or maximum group size?", a: "Interactive workshops work best with 8 to 25 participants. For larger audiences we run multiple cohorts or keynote-style sessions." },
  { q: "Do participants receive certificates?", a: "Yes, participants receive a certificate of completion. We can also include assessments if you need evidence of learning." },
  { q: "How is pricing decided?", a: "Pricing depends on the program, duration, number of participants and format. Send a request and we will share a clear proposal with no obligation." },
];

export default async function Home() {
  const [settings, programs] = await Promise.all([getSettings(), getPublishedPrograms()]);

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
          <Magnetic href="/certifications">🎁 Start a certification free</Magnetic>
          <Magnetic href="/trainers" variant="ghost">
            Hire a trainer
          </Magnetic>
        </Reveal>
        <Reveal delay={1.12} className="hero__trust">
          <span>✓ Stage 1 of every certification is free</span>
          <span>✓ Certificates any employer can verify</span>
          <span>✓ Training shaped for {INDUSTRIES.length} industries</span>
        </Reveal>
        <Reveal delay={1.2} className="hero__for">
          <span className="muted">Training for</span> <RotatingWords words={["new managers", "sales teams", "senior leaders", "frontline staff", "graduate hires", "whole organisations"]} />
        </Reveal>
        <div className="hero__scroll" aria-hidden="true">
          <span />
        </div>
      </section>

      <TwoWays programs={programs} />

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

      <HomeQuests />

      <section className="section container" aria-labelledby="hire-title">
        <Reveal className="hire-band">
          <div className="hire-band__text">
            <p className="eyebrow">
              <span className="eyebrow__dot" /> Hire a trainer
            </p>
            <h2 className="h2" id="hire-title">
              Need an expert in the room? <span className="rainbow-text">We will find them.</span>
            </h2>
            <p className="muted">
              Workshops, course series, coaching or a keynote: tell us the topic, audience and dates, and we match you with vetted trainers who have done
              the job themselves.
            </p>
          </div>
          <ul className="ticks hire-band__ticks">
            <li>Matched to topic, industry and audience</li>
            <li>Trainer profiles shared before you commit</li>
            <li>English, Urdu or both · on-site or online</li>
          </ul>
          <div className="hire-band__ctas">
            <Link href="/trainers" className="btn btn--primary">
              <span className="btn__label">
                <IconUsers size={18} /> Hire a trainer
              </span>
              <span className="btn__arrow">→</span>
            </Link>
            <span className="muted">Free to ask, no obligation.</span>
          </div>
        </Reveal>
      </section>

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
            { icon: <IconBuilding size={30} />, title: "On-site", text: "Immersive in-person sessions at your office or a venue we arrange, in Pakistan or abroad on request." },
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

      <section className="section container">
        <Reveal className="final-cta glass">
          <h2 className="h2">
            Not sure where to start? <span className="rainbow-text">Try a stage for free.</span>
          </h2>
          <p className="muted">Every certification opens with a free stage, no payment needed. Or tell us what your team needs and we will suggest a plan.</p>
          <div className="hero__ctas final-cta__ctas">
            <Magnetic href="/certifications">Start for free</Magnetic>
            <Magnetic href="/trainers" variant="ghost">
              Hire a trainer
            </Magnetic>
            <Magnetic href="/contact" variant="ghost">
              Talk to us
            </Magnetic>
          </div>
        </Reveal>
      </section>
    </>
  );
}
