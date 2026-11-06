import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { requireUser } from "@/lib/portal/auth";
import { leaderboard, levelFor, publicName, type LeaderRow } from "@/lib/portal/game";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const user = await requireUser("/learn/leaderboard");
  const { range } = await searchParams;
  const allTime = range === "all";
  const rows = leaderboard({ days: allTime ? undefined : 30, limit: 50 });
  const team = user.company_id ? leaderboard({ days: allTime ? undefined : 30, companyId: user.company_id, limit: 20 }) : [];

  return (
    <div className="container dash">
      <Reveal className="dash__hello">
        <p className="eyebrow">
          <span className="eyebrow__dot" /> Hall of fame
        </p>
        <h1 className="h2">Leaderboard</h1>
        <div className="tabs lboard__tabs">
          <Link href="/learn/leaderboard" className={`tab ${!allTime ? "is-active" : ""}`}>
            {!allTime && <span className="tab__pill" />}
            <span>Last 30 days</span>
          </Link>
          <Link href="/learn/leaderboard?range=all" className={`tab ${allTime ? "is-active" : ""}`}>
            {allTime && <span className="tab__pill" />}
            <span>All time</span>
          </Link>
        </div>
      </Reveal>
      <div className={team.length ? "dash__cols" : ""}>
        <Board list={rows} title="All learners" meId={user.id} />
        {team.length > 0 && <Board list={team} title="My company" meId={user.id} />}
      </div>
      <p className="muted dash__hint">
        Names show as first name and initial. You can hide yourself from the public board in{" "}
        <Link href="/learn/account" className="inline-link">
          your profile
        </Link>
        .
      </p>
    </div>
  );
}

const medal = ["🥇", "🥈", "🥉"];

function Board({ list, title, meId }: { list: LeaderRow[]; title: string; meId: string }) {
  return (
    <div className="glass board-panel">
      <h2 className="h3">{title}</h2>
      {list.length === 0 ? (
        <p className="muted">No XP earned in this period yet. Be the first!</p>
      ) : (
        <ol className="lboard">
          {list.map((r, i) => (
            <li key={r.id} className={r.id === meId ? "is-me" : ""}>
              <span className="lboard__rank">{medal[i] ?? i + 1}</span>
              <span className="lboard__name">
                {r.id === meId ? `${publicName(r.name)} (you)` : publicName(r.name)}
                {r.organisation && <span className="muted"> · {r.organisation}</span>}
              </span>
              <span className="lboard__lvl muted">{levelFor(r.xp).name}</span>
              <span className="lboard__xp">{r.xp.toLocaleString()} XP</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
