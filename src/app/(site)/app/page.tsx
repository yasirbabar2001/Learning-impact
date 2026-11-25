import type { Metadata } from "next";
import { AppBand } from "@/components/app/AppBand";
import { InstallSteps, STEPS } from "@/components/app/steps";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Get the app",
  description: "Install the Learning Impact app on Android, iPhone, iPad, Windows or Mac. Free, no app store needed.",
  alternates: { canonical: "/app" },
};

const PERKS = [
  { icon: "⚡", title: "One tap to learn", text: "Opens straight to your quests from your home screen or desktop, full screen, no browser bars." },
  { icon: "🔥", title: "Keep your streak", text: "Pick up exactly where you left off. Your progress is saved to your account on every device." },
  { icon: "🎓", title: "Certificates at hand", text: "Download and share your certificates, or show the QR code, wherever you are." },
  { icon: "🪶", title: "Tiny and always fresh", text: "Takes almost no space and updates itself. No app store, no downloads to manage." },
];

export default function AppPage() {
  return (
    <>
      <PageHero eyebrow="Learning Impact app" title="Your learning," highlight="in your pocket.">
        <p>Install Learning Impact on Android, iPhone, iPad, Windows or Mac in about 10 seconds. It is free.</p>
      </PageHero>
      <section className="container section section--tight">
        <AppBand heading={false} />
      </section>
      <section className="container section section--tight" aria-labelledby="how-title">
        <h2 id="how-title" className="h2">
          How to install
        </h2>
        <div className="appguide">
          {(["android", "ios", "desktop"] as const).map((p) => (
            <div key={p} className="appguide__card glass">
              <h3>
                <span aria-hidden="true">{STEPS[p].icon}</span> {STEPS[p].title}
              </h3>
              <InstallSteps platform={p} />
            </div>
          ))}
        </div>
      </section>
      <section className="container section section--tight">
        <div className="appperks">
          {PERKS.map((x) => (
            <div key={x.title} className="appperks__item glass">
              <span className="appperks__icon" aria-hidden="true">
                {x.icon}
              </span>
              <h3>{x.title}</h3>
              <p className="muted">{x.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
