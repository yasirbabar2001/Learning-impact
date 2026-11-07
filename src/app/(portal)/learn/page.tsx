import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { Ring } from "@/components/portal/Ring";
import { catalog, formatPkr, getCourse } from "@/lib/courses/catalog";
import { all } from "@/lib/db";
import { requireUser } from "@/lib/portal/auth";
import { ORDER_STATUS, ordersOf } from "@/lib/portal/commerce";
import { certificateFor } from "@/lib/portal/exam";
import { InvitePanel } from "@/components/portal/InvitePanel";
import { BADGES, levelFor, LEVELS, recentXp, userBadges, weeklyRank } from "@/lib/portal/game";
import { REFERRAL_XP, refCodeFor, referralStats } from "@/lib/portal/referrals";
import { SITE_URL } from "@/lib/site";
import { courseProgress, enrollmentsOf, progressMap, trialsOf } from "@/lib/portal/learning";

export const metadata: Metadata = { title: "My quests" };

const ago = (iso: string) => {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
};

export default async function Dashboard() {
  const user = await requireUser("/learn");
  const level = levelFor(user.xp);
  const enrollments = enrollmentsOf(user.id);
  const quests = enrollments
    .map((e) => {
      const course = getCourse(e.course_slug);
      if (!course) return null;
      const p = courseProgress(course, progressMap(user.id, course.slug));
      const next = p.stages.find((s) => s.status !== "passed");
      return { course, p, next, certified: Boolean(certificateFor(user.id, course.slug)), trial: false };
    })
    .filter((q) => q !== null);
  // Courses started for free (stage 1) and not bought yet.
  for (const slug of trialsOf(user.id)) {
    const course = getCourse(slug);
    if (!course || quests.some((q) => q.course.slug === slug)) continue;
    const p = courseProgress(course, progressMap(user.id, slug));
    quests.push({ course, p, next: p.stages[0].status === "passed" ? undefined : p.stages[0], certified: false, trial: true });
  }
  const badges = userBadges(user.id);
  const xpFeed = recentXp(user.id);
  const openOrders = ordersOf(user.id).filter((o) => o.status === "awaiting_payment" || o.status === "submitted" || o.status === "rejected");
  const invites = all<{ id: string; course_slug: string; company: string }>(
    `SELECT i.id, i.course_slug, c.name AS company FROM invitations i JOIN companies c ON c.id = i.company_id
     WHERE i.email = ? AND i.status = 'pending'`,
    user.email,
  );
  const enrolled = new Set(enrollments.map((e) => e.course_slug));
  const suggestions = catalog().filter((c) => c.available && !enrolled.has(c.slug)).slice(0, 3);
  const first = user.name.split(/\s+/)[0];
  const league = weeklyRank(user.id);
  const refs = referralStats(user.id);
  const inviteUrl = `${SITE_URL}/r/${refCodeFor(user.id)}`;
  const pkToday = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
  const streakAtRisk = user.streak >= 2 && user.last_active_day !== pkToday && quests.some((q) => !q.certified);

  return (
    <div className="container dash">
      <section className="dash__hero">
        <Reveal className="dash__hello">
          <p className="eyebrow">
            <span className="eyebrow__dot" /> Learner dashboard
          </p>
          <h1 className="h2">
            {user.streak > 1 ? `🔥 ${user.streak}-day streak, ${first}!` : `Welcome, ${first}.`}
          </h1>
          <p className="muted">
            {quests.length ? "Pick up where you left off. Every stage you clear earns XP." : "Start your first certification quest and earn your first badge today."}
          </p>
        </Reveal>
        <Reveal delay={0.1} className="level-card glass">
          <div className="level-card__top">
            <span className="level-card__badge">L{level.index}</span>
            <div>
              <strong>{level.name}</strong>
              <span className="muted">{user.xp.toLocaleString()} XP</span>
            </div>
          </div>
          <div className="level-card__bar">
            <span style={{ width: `${Math.round(level.progress * 100)}%` }} />
          </div>
          <p className="muted level-card__next">{level.next ? `${level.toNext.toLocaleString()} XP to ${level.next.name}` : "Top level reached. Legendary!"}</p>
          <ol className="level-steps" aria-label="Levels">
            {LEVELS.map((l, i) => (
              <li key={l.name} className={i < level.index ? "is-done" : ""} title={`${l.name} · ${l.xp} XP`} />
            ))}
          </ol>
        </Reveal>
      </section>

      {streakAtRisk && (
        <Reveal className="notice glass streak-alert">
          <span>🔥</span>
          <div>
            <strong>Keep your {user.streak}-day streak alive!</strong>
            <p className="muted">You haven&apos;t learned today yet. One card or one quick check before midnight keeps the flame burning.</p>
          </div>
        </Reveal>
      )}

      {invites.length > 0 && (
        <Reveal className="notice glass">
          <span>🎟️</span>
          <div>
            <strong>Your company has reserved a seat for you</strong>
            <p className="muted">
              {invites.map((i) => `${i.company}: ${getCourse(i.course_slug)?.title ?? i.course_slug}`).join(" · ")}. Open the invitation link in your e-mail to accept it.
            </p>
          </div>
        </Reveal>
      )}

      {openOrders.length > 0 && (
        <Reveal className="notice glass">
          <span>🧾</span>
          <div>
            <strong>Order{openOrders.length > 1 ? "s" : ""} in progress</strong>
            <p className="muted">
              {openOrders.map((o) => (
                <Link key={o.id} href={`/orders/${o.reference}`} className="inline-link notice__link">
                  {o.reference} · {getCourse(o.course_slug)?.title} · {ORDER_STATUS[o.status]}
                </Link>
              ))}
            </p>
          </div>
        </Reveal>
      )}

      <section className="dash__section">
        <h2 className="h3">Your quests</h2>
        {quests.length === 0 ? (
          <div className="empty glass">
            <h3>No quests yet</h3>
            <p className="muted">Every certification starts with a free stage. Pick one and start learning now, no payment needed.</p>
            <Link href="/certifications" className="btn btn--primary">
              <span className="btn__label">Browse certifications</span>
              <span className="btn__arrow">→</span>
            </Link>
          </div>
        ) : (
          <div className="quest-cards">
            {quests.map(({ course, p, next, certified, trial }, i) => (
              <Reveal key={course.slug} delay={i * 0.06}>
                <Link href={`/learn/${course.slug}`} className="quest-card spot" style={{ ["--c" as string]: course.quest.color }}>
                  <Ring percent={certified ? 100 : p.percent} label={certified ? "🏆" : undefined} />
                  <div className="quest-card__body">
                    <span className="quest-card__name">
                      ⚔️ {course.quest.name} {trial && <span className="tag free-tag">Free stage</span>}
                    </span>
                    <h3>{course.title}</h3>
                    <p className="muted">
                      {trial
                        ? next
                          ? "🎁 Free stage in progress · Stage 1 is on us"
                          : "🔓 Free stage cleared! Unlock the full certification to continue"
                        : certified
                        ? "Certified. Download your certificate any time."
                        : p.examUnlocked
                          ? "All stages cleared. The final boss awaits!"
                          : next
                            ? `Next: Stage ${course.sessions.indexOf(next.session) + 1} · ${next.session.stage}`
                            : ""}
                    </p>
                    <span className="quest-card__stages">
                      {p.stages.map((s) => (
                        <i key={s.session.id} className={`pip pip--${s.status}`} />
                      ))}
                      <i className={`pip pip--boss ${certified ? "pip--passed" : ""}`} />
                    </span>
                  </div>
                  <span className="quest-card__go" aria-hidden="true">
                    →
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="dash__cols">
        <div className="glass dash__panel">
          <h2 className="h3">Badges</h2>
          {badges.length === 0 ? (
            <p className="muted">Finish your first lesson to earn the First Steps badge.</p>
          ) : (
            <ul className="badge-shelf">
              {badges.map((b) => {
                const def = BADGES[b.badge];
                const course = b.badge.startsWith("course:") ? getCourse(b.badge.slice(7)) : null;
                const name = def?.name ?? course?.quest.badge.name ?? b.badge;
                return (
                  <li key={b.badge} className="bdg" title={def?.description ?? course?.quest.badge.description}>
                    <span className="bdg__icon" style={course ? { background: course.quest.color } : undefined}>
                      {def?.icon ?? "🏅"}
                    </span>
                    <span>{name}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="muted dash__hint">
            <Link href="/learn/leaderboard" className="inline-link">
              See the leaderboard
            </Link>
          </p>
        </div>
        <div className="glass dash__panel">
          <h2 className="h3">Recent XP</h2>
          {xpFeed.length === 0 ? (
            <p className="muted">Your XP history will appear here.</p>
          ) : (
            <ul className="xp-feed">
              {xpFeed.map((x, i) => (
                <li key={i}>
                  <span className="xp-feed__xp">+{x.xp}</span>
                  <span>{x.label}</span>
                  <span className="muted">{ago(x.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="dash__cols">
        <InvitePanel url={inviteUrl} joined={refs.joined} enrolled={refs.enrolled} xp={refs.xp} rewards={REFERRAL_XP} />
        <div className="glass dash__panel">
          <h2 className="h3">🏟️ Weekly league</h2>
          <div className="league-card">
            <span className="league-card__rank">{league ? `#${league.rank}` : "🏁"}</span>
            <p className="muted">
              {league
                ? `You're #${league.rank} of ${league.players} learners this week with ${league.xp} XP.${league.rank > 1 ? " Clear a stage to climb!" : " You're leading. Defend the crown!"}`
                : "Earn XP this week to enter the league. It resets every Monday."}
            </p>
          </div>
          <Link href="/learn/leaderboard" className="btn btn--ghost btn--sm">
            <span className="btn__label">Open the league table</span>
            <span className="btn__arrow">→</span>
          </Link>
        </div>
      </section>

      {suggestions.length > 0 && (
        <section className="dash__section">
          <h2 className="h3">Your next quest</h2>
          <div className="suggest">
            {suggestions.map((s) => (
              <Link key={s.slug} href={`/certifications/${s.slug}`} className="suggest__card spot" style={{ ["--c" as string]: s.color }}>
                <span className="tag">{s.category}</span>
                <strong>{s.title}</strong>
                <span className="muted">🎁 Start for free · then {formatPkr(s.pricePkr)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
