import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { requireUser } from "@/lib/portal/auth";
import { daysUntilReset, leaderboard, levelFor, publicName, weekStart, weeklyRank, type LeaderRow } from "@/lib/portal/game";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const user = await requireUser("/learn/leaderboard");
  const { range } = await searchParams;
  const mode = range === "all" ? "all" : range === "month" ? "month" : "week";
  const span = mode === "week" ? { since: weekStart() } : mode === "month" ? { days: 30 } : {};
  const rows = leaderboard({ ...span, limit: 50 });
  const team = user.company_id ? leaderboard({ ...span, companyId: user.company_id, limit: 20 }) : [];
  const me = weeklyRank(user.id);
  const resetIn = daysUntilReset();

  return (
    <div className="container dash">
      <Reveal className="dash__hello">
        <p className="eyebrow">
          <span className="eyebrow__dot" /> Hall of fame
        </p>
        <h1 className="h2">Leaderboard</h1>
        <div className="tabs lboard__tabs">
          {(
            [
              ["week", "This week", "/learn/leaderboard"],
              ["month", "Last 30 days", "/learn/leaderboard?range=month"],
              ["all", "All time", "/learn/leaderboard?range=all"],
            ] as const
          ).map(([key, label, href]) => (
            <Link key={key} href={href} className={`tab ${mode === key ? "is-active" : ""}`}>
              {mode === key && <span className="tab__pill" />}
              <span>{label}</span>
            </Link>
          ))}
        </div>
        {mode === "week" && (
          <div className="league-card notice glass">
            <span className="league-card__rank">{me ? `#${me.rank}` : "🏁"}</span>
            <div>
              <strong>{me ? `You are #${me.rank} of ${me.players} in this week's league with ${me.xp} XP.` : "You haven't earned XP this week yet. One lesson puts you on the board!"}</strong>
              <p className="muted">The weekly league resets every Monday at 00:00 Pakistan time (UTC+5), {resetIn} day{resetIn > 1 ? "s" : ""} to go. Top 3 earn bragging rights on the Hall of Fame.</p>
            </div>
          </div>
        )}
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
