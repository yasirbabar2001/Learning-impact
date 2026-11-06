import "server-only";
import { signFor } from "../auth";
import { getCourse } from "../courses/catalog";
import { all, run } from "../db";
import { SITE_URL } from "../site";
import { courseProgress, progressMap } from "./learning";
import { button, esc, sendMail } from "./mail";

const day = (offsetDays = 0) => new Date(Date.now() - offsetDays * 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });

type Candidate = {
  id: string;
  name: string;
  email: string;
  streak: number;
  last_active_day: string | null;
  last_reminded_day: string | null;
  created_at: string;
};

export const unsubscribeUrl = (userId: string) => `${SITE_URL}/api/unsubscribe?u=${userId}&t=${signFor("unsubscribe", userId)}`;

/** The learner's unfinished quest that is furthest along, for the e-mail. */
function bestQuest(userId: string) {
  const rows = all<{ course_slug: string }>(
    `SELECT e.course_slug FROM enrollments e WHERE e.user_id = ?
     AND NOT EXISTS (SELECT 1 FROM certificates c WHERE c.user_id = e.user_id AND c.course_slug = e.course_slug AND c.revoked_at IS NULL)`,
    userId,
  );
  let best: { title: string; slug: string; percent: number; next: string } | null = null;
  for (const r of rows) {
    const course = getCourse(r.course_slug);
    if (!course) continue;
    const p = courseProgress(course, progressMap(userId, course.slug));
    const next = p.stages.find((s) => s.status !== "passed");
    if (!best || p.percent > best.percent)
      best = { title: course.title, slug: course.slug, percent: p.percent, next: next ? `Stage ${course.sessions.indexOf(next.session) + 1}: ${next.session.stage}` : "The final exam" };
  }
  return best;
}

/**
 * Daily nudges, meant to run once a day in the early evening (Pakistan time) from a cron job:
 * - a "streak at risk" e-mail to learners with a streak of 2+ days who learned yesterday but not yet today;
 * - a weekly "your quest is waiting" e-mail to learners idle for 4+ days.
 * Each learner gets at most one e-mail a day and can switch them off with one click.
 */
export async function sendReminders(limit = 150) {
  const today = day();
  const yesterday = day(1);
  const idleSince = day(4);
  const weekAgo = day(7);
  const candidates = all<Candidate>(
    `SELECT u.id, u.name, u.email, u.streak, u.last_active_day, u.last_reminded_day, u.created_at FROM users u
     WHERE u.status = 'active' AND u.email_verified_at IS NOT NULL AND u.reminders = 1
       AND (u.last_reminded_day IS NULL OR u.last_reminded_day < ?)
       AND EXISTS (SELECT 1 FROM enrollments e WHERE e.user_id = u.id)
     ORDER BY u.streak DESC LIMIT ?`,
    today,
    limit * 3,
  );
  let streak = 0;
  let comeback = 0;
  let failed = 0;
  for (const u of candidates) {
    if (streak + comeback >= limit) break;
    const atRisk = u.streak >= 2 && u.last_active_day === yesterday;
    const lastSeen = u.last_active_day ?? u.created_at.slice(0, 10);
    const idle = lastSeen <= idleSince && (!u.last_reminded_day || u.last_reminded_day <= weekAgo);
    if (!atRisk && !idle) continue;
    const quest = bestQuest(u.id);
    if (!quest) continue;
    const first = esc(u.name.split(/\s+/)[0]);
    const footer = `<p style="font-size:12px;color:#888">You get these because you are learning on Learning Impact. <a href="${unsubscribeUrl(u.id)}">Stop reminder e-mails</a>.</p>`;
    const go = button(`${SITE_URL}/learn/${quest.slug}`, "Continue my quest");
    const [subject, html] = atRisk
      ? [
          `🔥 Your ${u.streak}-day streak ends at midnight`,
          `<p>Assalam-o-Alaikum ${first},</p><p>You have learned <b>${u.streak} days in a row</b>. Don't let the flame go out: one card or one quick check today keeps it alive.</p><p><b>${esc(quest.title)}</b> is ${quest.percent}% done. Next up: ${esc(quest.next)}.</p>${go}${footer}`,
        ]
      : [
          `Your ${quest.title} quest is waiting`,
          `<p>Assalam-o-Alaikum ${first},</p><p>Ilmi has been keeping your place. <b>${esc(quest.title)}</b> is ${quest.percent}% done, and the next stage takes about 15 minutes.</p><p>Next up: ${esc(quest.next)}. This week's league is still open: a single stage can move you up the table.</p>${go}${footer}`,
        ];
    const ok = await sendMail(u.email, subject, html);
    if (!ok) {
      failed++;
      continue;
    }
    run("UPDATE users SET last_reminded_day = ? WHERE id = ?", today, u.id);
    if (atRisk) streak++;
    else comeback++;
  }
  return { streak, comeback, failed, checked: candidates.length };
}
