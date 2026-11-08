import type { Course } from "@/lib/courses/schema";
import { jurisdiction } from "@/lib/regulatory/library";
import { programByNo } from "@/lib/regulatory/programs";
import { CLASSIFICATION_HELP, CLASSIFICATION_LABELS, FREQUENCY_LABELS } from "@/lib/regulatory/schema";

/** The regulatory basis of a Global Banking Regulatory Training quest: jurisdiction, regulators and official sources. */
export function RegulatoryBasis({ course }: { course: Course }) {
  const meta = course.jurisdiction;
  if (!meta) return null;
  const j = jurisdiction(meta.code);
  return (
    <section className="container section section--tight">
      <div className="cert__description glass reg-basis">
        <p className="eyebrow">
          <span className="eyebrow__dot" /> Global Banking Regulatory Training{j ? ` · ${j.region} · ${j.name}` : ""}
        </p>
        <h2 className="h3">Regulatory basis</h2>
        <p>
          <span className={`cls cls--${meta.classification}`}>{CLASSIFICATION_LABELS[meta.classification]}</span>{" "}
          <span className="muted">
            {CLASSIFICATION_HELP[meta.classification]} Frequency: {meta.frequency.map((f) => FREQUENCY_LABELS[f]).join(", ")}.
          </span>
        </p>
        <p className="muted">
          <b>Regulators:</b> {meta.regulators.join(" · ")}
        </p>
        <p className="muted">
          <b>Covers:</b> {meta.programs.map((n) => programByNo(n).title).join(" · ")}
        </p>
        <h3 className="reg-basis__h">Official sources</h3>
        <ul className="lib__refs">
          {meta.references.map((r) => (
            <li key={r.url + r.title}>
              <a href={r.url} target="_blank" rel="noreferrer" className="inline-link">
                {r.title}
              </a>{" "}
              <span className="muted">
                ({r.issuer}
                {r.provision ? `, ${r.provision}` : ""})
              </span>
            </li>
          ))}
        </ul>
        <p className="muted reg-basis__fine">
          Content checked against these sources on {meta.reviewed}. This quest builds knowledge; it is not legal advice and does not replace your
          institution&apos;s own policies or the regulator&apos;s current texts.
        </p>
      </div>
    </section>
  );
}
