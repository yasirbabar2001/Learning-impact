import { SplitWords } from "./Text";
import { Swoosh } from "./Swoosh";

export function PageHero({ eyebrow, title, highlight, children }: { eyebrow: string; title: string; highlight?: string; children?: React.ReactNode }) {
  return (
    <section className="page-hero container">
      <p className="eyebrow">
        <span className="eyebrow__dot" />
        {eyebrow}
      </p>
      <h1 className="display">
        <SplitWords text={title} delay={0.35} />
        {highlight && (
          <span className="display__highlight">
            <SplitWords text={highlight} className="rainbow-text" delay={0.55} />
            <Swoosh />
          </span>
        )}
      </h1>
      {children && <div className="page-hero__lead">{children}</div>}
    </section>
  );
}
