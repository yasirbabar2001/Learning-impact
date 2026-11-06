"use client";

import { useEffect, useState } from "react";
import { play } from "@/lib/portal/sfx";

/** "Invite & earn": the learner's personal link with one-tap sharing. */
export function InvitePanel({ url, joined, enrolled, xp, rewards }: { url: string; joined: number; enrolled: number; xp: number; rewards: { joined: number; enrolled: number; welcome: number } }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    // Only some browsers (mostly phones) offer the system share sheet.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanShare("share" in navigator);
  }, []);
  const text = `I'm earning professional certifications on Learning Impact: story-based quests, games and a verified certificate. Join with my link and get a ${rewards.welcome} XP welcome bonus:`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* older browsers: the link is visible to copy by hand */
    }
    play("correct");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const native = async () => {
    try {
      await navigator.share({ title: "Learning Impact", text, url });
    } catch {
      /* cancelled */
    }
  };
  return (
    <div className="glass dash__panel invite-panel">
      <h2 className="h3">🎁 Invite friends, earn XP</h2>
      <p className="muted">
        +{rewards.joined} XP when a friend joins with your link, +{rewards.enrolled} XP and the 📣 Ambassador badge when they enrol. They get a {rewards.welcome} XP welcome bonus.
      </p>
      <div className="invite-panel__link">
        <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Your invite link" />
        <button className="btn btn--primary btn--sm" onClick={copy}>
          <span className="btn__label">{copied ? "Copied ✓" : "Copy"}</span>
        </button>
      </div>
      <div className="share-row invite-panel__share">
        <a className="share-btn share-btn--wa" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        <a className="share-btn share-btn--li" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>
        <a className="share-btn share-btn--mail" href={`mailto:?subject=${encodeURIComponent("Join me on Learning Impact")}&body=${encodeURIComponent(`${text}\n${url}`)}`}>
          E-mail
        </a>
        {canShare && (
          <button className="share-btn share-btn--more" onClick={native}>
            More…
          </button>
        )}
      </div>
      <dl className="invite-panel__stats">
        <div>
          <dt>Joined</dt>
          <dd>{joined}</dd>
        </div>
        <div>
          <dt>Enrolled</dt>
          <dd>{enrolled}</dd>
        </div>
        <div>
          <dt>XP earned</dt>
          <dd>{xp}</dd>
        </div>
      </dl>
    </div>
  );
}
