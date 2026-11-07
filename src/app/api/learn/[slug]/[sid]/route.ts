import { revalidatePath } from "next/cache";
import { getCourse } from "@/lib/courses/catalog";
import { currentUser } from "@/lib/portal/auth";
import { awardXp } from "@/lib/portal/game";
import { accessFor, answerCheck, completeLesson, recordCardsSeen, stageOf } from "@/lib/portal/learning";

export const dynamic = "force-dynamic";

const GAMES = new Set(["scenario", "flip", "sort", "match", "order"]);

type Body =
  | { event: "seen"; index: number }
  | { event: "check"; index: number; choice: number }
  | { event: "activity"; index: number; score: number; max: number }
  | { event: "complete" };

/**
 * Lesson events from the player. A plain endpoint rather than server actions: Next.js runs server
 * actions one at a time, so frequent "card seen" saves were delaying the clicks that mattered.
 * XP is always decided here, never by the browser (games report their own score but are capped).
 */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string; sid: string }> }) {
  const { slug, sid } = await params;
  const user = await currentUser();
  const course = getCourse(slug);
  const session = course?.sessions.find((s) => s.id === sid);
  const access = user && course && session ? accessFor(user, slug) : null;
  if (!user || !course || !session || !access) return Response.json({ error: "not-allowed" }, { status: 403 });
  const stage = stageOf(course, user.id, sid, access.mode);
  if (!stage || stage.status === "locked") return Response.json({ error: "locked" }, { status: 403 });
  const b = (await req.json().catch(() => null)) as Body | null;
  if (!b) return Response.json({ error: "bad-request" }, { status: 400 });
  // Admin previews record nothing: no progress, no XP.
  if (access.mode === "preview") return Response.json({ ok: true, xp: 0, preview: true });

  switch (b.event) {
    case "seen":
      if (Number.isInteger(b.index) && b.index >= 0) recordCardsSeen(user.id, slug, sid, Math.min(b.index, session.cards.length));
      return Response.json({ ok: true });
    case "check": {
      if (!Number.isInteger(b.index) || !Number.isInteger(b.choice)) break;
      const r = answerCheck(user.id, course, session, b.index, b.choice);
      return Response.json({ xp: r?.xp ?? 0 });
    }
    case "activity": {
      const card = session.cards[b.index];
      if (!card || !GAMES.has(card.type) || !(b.max > 0) || !(b.score >= 0)) return Response.json({ xp: 0 });
      const ratio = Math.min(1, b.score / b.max);
      const xp = awardXp(user.id, `activity:${slug}:${sid}:${b.index}`, `${card.type === "scenario" ? "Decision" : "Challenge"}: ${session.stage}`, Math.round(5 + 10 * ratio));
      return Response.json({ xp });
    }
    case "complete": {
      const xp = completeLesson(user.id, course, session);
      revalidatePath(`/learn/${slug}`);
      return Response.json({ xp });
    }
  }
  return Response.json({ error: "bad-request" }, { status: 400 });
}
