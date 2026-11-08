import Link from "next/link";
import { regulatoryCatalog } from "@/lib/courses/catalog";
import { jurisdictions } from "@/lib/regulatory/library";
import { isProvisional, REGIONS } from "@/lib/regulatory/schema";
import { TARGETS } from "@/lib/regulatory/targets";

export const metadata = { title: "Regulatory library" };

export default async function AdminLibrary() {
  const maps = new Map(jurisdictions().map((j) => [j.code, j]));
  const quests = regulatoryCatalog();
  const questsBy = (code: string) => quests.filter((q) => q.jurisdiction === code);
  const mapped = TARGETS.filter((t) => maps.has(t.code)).length;
  const totalPrograms = [...maps.values()].reduce((n, j) => n + j.programs.length, 0);
  const mandatory = [...maps.values()].reduce((n, j) => n + j.programs.filter((m) => m.classification.startsWith("mandatory")).length, 0);

  return (
    <div className="board dash-admin">
      <div className="board__head">
        <div>
          <h1 className="h3">Global Banking Regulatory Training</h1>
          <p className="muted">
            Choose a country to see its banking regulators, the training each regulator requires, role-specific and recommended training, the official
            references and how learners are doing. New quests arrive as drafts: preview them, then set a price and publish.
          </p>
        </div>
      </div>

      <div className="tiles">
        <div className="tile tile--info">
          <span className="tile__value">
            {mapped} / {TARGETS.length}
          </span>
          <span className="tile__label">Jurisdictions researched</span>
          <span className="tile__note">Checked against official sources</span>
        </div>
        <div className="tile">
          <span className="tile__value">{totalPrograms}</span>
          <span className="tile__label">Programs assessed</span>
          <span className="tile__note">{mandatory} mandatory (explicit or role-based)</span>
        </div>
        <div className="tile tile--good">
          <span className="tile__value">{quests.filter((q) => q.available).length}</span>
          <span className="tile__label">Quests live</span>
          <span className="tile__note">{quests.filter((q) => !q.available).length} draft(s) waiting for review</span>
        </div>
      </div>

      {REGIONS.map((region) => {
        const items = TARGETS.filter((t) => t.region === region);
        if (!items.length) return null;
        return (
          <section key={region} className="dash-admin__group">
            <h2 className="dash-admin__title">{region}</h2>
            <div className="tiles lib-tiles">
              {items.map((t) => {
                const j = maps.get(t.code);
                const qs = questsBy(t.code);
                const count = (c: string) => j?.programs.filter((m) => m.classification === c).length ?? 0;
                const body = (
                  <>
                    <span className="tile__label">{t.name}</span>
                    <span className="tile__note">{t.regulators}</span>
                    {j ? (
                      <span className="lib-tiles__counts">
                        <span className="cls cls--mandatory-explicit">{count("mandatory-explicit")} explicit</span>
                        <span className="cls cls--mandatory-role">{count("mandatory-role")} role</span>
                        <span className="cls cls--competence">{count("competence")} competence</span>
                        <span className="cls cls--recommended">{count("recommended")} recommended</span>
                      </span>
                    ) : (
                      <span className="tile__note">Phase {t.phase} · not researched yet</span>
                    )}
                    {j && j.programs.some(isProvisional) && <span className="tile__note">⏳ {j.programs.filter(isProvisional).length} awaiting source check</span>}
                    {qs.length > 0 && (
                      <span className="tile__note">
                        {qs.filter((q) => q.available).length} live · {qs.filter((q) => !q.available).length} draft quest(s)
                      </span>
                    )}
                  </>
                );
                return j ? (
                  <Link key={t.code} href={`/admin/library/${t.code}`} className={`tile ${qs.some((q) => !q.available) ? "tile--alert" : "tile--info"}`}>
                    {body}
                    <span className="tile__go" aria-hidden="true">
                      →
                    </span>
                  </Link>
                ) : (
                  <div key={t.code} className="tile lib-tiles__todo">
                    {body}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
