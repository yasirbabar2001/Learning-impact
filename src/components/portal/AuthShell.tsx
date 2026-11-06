import type { ReactNode } from "react";
import { Reveal } from "../Reveal";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="auth container">
      <Reveal className="auth__card glass">
        <h1 className="h3">{title}</h1>
        <p className="muted auth__sub">{subtitle}</p>
        {children}
      </Reveal>
      <Reveal delay={0.15} className="auth__aside" aria-hidden="true">
        <div className="auth__perk">
          <span>⚔️</span>
          <div>
            <strong>Learn as a quest</strong>
            <p>Short stages, instant feedback and a final boss exam.</p>
          </div>
        </div>
        <div className="auth__perk">
          <span>⭐</span>
          <div>
            <strong>Earn XP, levels and badges</strong>
            <p>Keep your streak alive and climb the leaderboard.</p>
          </div>
        </div>
        <div className="auth__perk">
          <span>🎓</span>
          <div>
            <strong>Verified certificates</strong>
            <p>Every certificate carries a QR code employers can check.</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
