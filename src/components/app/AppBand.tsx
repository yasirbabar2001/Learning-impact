import Link from "next/link";
import { InstallApp } from "./InstallApp";

/** Home page and /app: the app promotion block with the install button and the three platforms. */
export function AppBand({ heading = true }: { heading?: boolean }) {
  return (
    <div className="appband glass">
      <div className="appband__text">
        {heading && <p className="eyebrow">📲 The Learning Impact app</p>}
        <h2 className="h2">
          Learn on the go. <span className="rainbow-text">Get the app.</span>
        </h2>
        <p className="muted">Your quests, streaks and certificates one tap away on your phone, tablet or computer. Free, no app store needed.</p>
        <div className="appband__ctas">
          <InstallApp />
          <Link href="/app" className="btn btn--ghost">
            <span className="btn__label">How it works</span>
            <span className="btn__arrow">→</span>
          </Link>
        </div>
      </div>
      <ul className="appband__platforms" aria-label="Works on">
        <li>
          <span aria-hidden="true">🤖</span>Android
        </li>
        <li>
          <span aria-hidden="true">🍎</span>iPhone &amp; iPad
        </li>
        <li>
          <span aria-hidden="true">💻</span>Windows &amp; Mac
        </li>
      </ul>
    </div>
  );
}
