"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Card, CastMember } from "@/lib/courses/schema";
import { play, setSoundOn, soundOn } from "@/lib/portal/sfx";
import { autoReadOn, plain, setAutoRead, speak, speechSupported, stopSpeaking } from "@/lib/portal/speech";
import { DiagramCard } from "./cards/DiagramCard";
import { FlipCard, MatchCard, OrderCard, ScenarioCard, SortCard } from "./cards/GameCards";
import { ExplainerCard, StoryCard, storyScript, VideoCard } from "./cards/StoryCards";
import { Celebration } from "./Celebration";
import { encourage, Ilmi, praise, type IlmiMood } from "./Ilmi";
import { ScormPlayer, type ScormResult } from "./ScormPlayer";

/** Cards as sent to the browser. Knowledge checks carry their answer so feedback is instant; XP is still decided on the server. */
export type PublicCard = Card;

/** Sends a lesson event to the server without blocking the UI (see /api/learn/[slug]/[sid]). */
export function lessonEvent(slug: string, sid: string, body: Record<string, unknown>): Promise<{ xp?: number }> {
  return fetch(`/api/learn/${slug}/${sid}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true })
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}));
}

/** Tells the header to add XP right away (it refreshes from the server on the next page load). */
export const announceXp = (xp: number) => {
  if (xp > 0) window.dispatchEvent(new CustomEvent("li:xp", { detail: xp }));
};

type Props = {
  slug: string;
  sid: string;
  courseTitle: string;
  stageLabel: string;
  stage: string;
  title: string;
  objectives: string[];
  cards: PublicCard[];
  cast: CastMember[];
  startAt: number;
  lessonDone: boolean;
  quiz: { passed: boolean; best: number; attempts: number; pass: number };
  nextHref: string | null;
  mapHref: string;
  examHref: string | null;
  xp: number;
  shareUrl: string;
};

type CheckResult = { choice: number; correct: boolean; answer: number; explanation: string; xp: number };

const KIND: Record<PublicCard["type"], { icon: string; label: string }> = {
  concept: { icon: "📘", label: "Concept" },
  example: { icon: "📍", label: "Real-world case" },
  tip: { icon: "💡", label: "Pro tip" },
  keypoints: { icon: "🗝️", label: "Key points" },
  reflect: { icon: "🪞", label: "Reflect" },
  check: { icon: "⚡", label: "Quick check" },
  story: { icon: "🎬", label: "Scene" },
  diagram: { icon: "🧭", label: "Visual" },
  scenario: { icon: "🧭", label: "Decision" },
  flip: { icon: "🃏", label: "Flashcards" },
  sort: { icon: "🗂️", label: "Challenge" },
  match: { icon: "🔗", label: "Challenge" },
  order: { icon: "🪜", label: "Challenge" },
  explainer: { icon: "🎞️", label: "Mini-movie" },
  video: { icon: "▶️", label: "Video" },
};

const GAME_TYPES = new Set(["scenario", "flip", "sort", "match", "order"]);

/** What Ilmi says when a card opens. */
const INTRO: Partial<Record<PublicCard["type"], string>> = {
  story: "Let's see what's happening…",
  explainer: "Press play: a quick mini-movie!",
  diagram: "Here's the big picture.",
  scenario: "Your call. What would you do?",
  sort: "Your turn: sort these!",
  match: "Can you match them all?",
  order: "Drag them into the right order.",
  flip: "Flip each card to test yourself.",
  check: "Quick check. You've got this!",
  keypoints: "Remember these and you're set.",
  reflect: "Take a moment to make it yours.",
};

/** Text the narrator reads for a card. */
function script(card: PublicCard, cast: CastMember[]): string {
  switch (card.type) {
    case "concept":
    case "example":
    case "tip":
      return `${card.title}. ${plain(card.body)}`;
    case "keypoints":
      return `${card.title}. ${card.items.join(". ")}`;
    case "reflect":
      return card.prompt;
    case "check":
      return `${card.question} ${card.options.map((o, i) => `Option ${"ABCD"[i]}: ${o}`).join(". ")}`;
    case "story":
      return storyScript(card, cast);
    case "diagram":
      return `${card.title}. ${card.caption ?? ""} ${card.items.map((i) => [i.value, i.label, i.left && `${card.headers?.[0]}: ${i.left}`, i.right && `${card.headers?.[1]}: ${i.right}`, i.detail].filter(Boolean).join(", ")).join(". ")}`;
    case "scenario":
      return `${card.title}. ${plain(card.situation)} ${card.choices.map((c, i) => `Option ${"ABCD"[i]}: ${c.text}`).join(". ")}`;
    case "flip":
      return `${card.title}. ${card.cards.map((c) => c.front).join(". ")}`;
    case "sort":
    case "match":
    case "order":
      return `${card.title}. ${card.prompt}`;
    default:
      return "";
  }
}

// Mirrors XP in src/lib/portal/game.ts, so rewards can be shown before the server answers.
const LESSON_XP = 50;
const PASS_XP = 100;
const PERFECT_XP = 50;

export function LessonPlayer(p: Props) {
  const [phase, setPhase] = useState<"intro" | "cards" | "done" | "quiz">(p.lessonDone ? "done" : p.startAt > 0 ? "cards" : "intro");
  const [i, setI] = useState(Math.min(p.startAt, p.cards.length - 1));
  const [dir, setDir] = useState(1);
  const [checks, setChecks] = useState<Record<number, CheckResult>>({});
  const [games, setGames] = useState<Record<number, boolean>>({});
  const [pops, setPops] = useState<{ id: number; xp: number }[]>([]);
  const [combo, setCombo] = useState(0);
  const [earned, setEarned] = useState(0);
  const [mood, setMood] = useState<IlmiMood>("idle");
  const [say, setSay] = useState<string | null>(null);
  const [sound, setSound] = useState(true);
  const [autoRead, setAutoReadState] = useState(false);
  const [reading, setReading] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [celebrate, setCelebrate] = useState<null | { kind: "lesson" | "stage"; xp: number; xpBefore: number; result?: ScormResult; confirmed?: boolean }>(null);
  /** What the server has recorded for this stage test so far (props are not refreshed while on the page). */
  const quizSoFar = useRef({ passed: p.quiz.passed, best: p.quiz.best });
  const popId = useRef(0);
  const moodTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Resolves once the server has recorded the lesson as complete (the stage test needs that). */
  const completion = useRef<Promise<unknown> | null>(null);
  /** False only while a lesson completion is being saved. */
  const [ready, setReady] = useState(true);

  useEffect(() => {
    // Preferences live in this browser; read them after mounting.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSound(soundOn());
    setAutoReadState(autoReadOn());
    setCanSpeak(speechSupported());
  }, []);

  const router = useRouter();
  // Warm up the next screen while the learner takes the stage test, so "Next stage" responds instantly.
  useEffect(() => {
    if (phase === "quiz" || phase === "done") {
      router.prefetch(p.mapHref);
      if (p.nextHref || p.examHref) router.prefetch((p.nextHref || p.examHref)!);
    }
  }, [phase, router, p.mapHref, p.nextHref, p.examHref]);

  const react = useCallback((m: IlmiMood, msg: string | null, ms = 2600) => {
    setMood(m);
    setSay(msg);
    if (moodTimer.current) clearTimeout(moodTimer.current);
    moodTimer.current = setTimeout(() => {
      setMood("idle");
      setSay(null);
    }, ms);
  }, []);

  const gain = useCallback((xp: number) => {
    if (xp <= 0) return;
    const id = ++popId.current;
    setEarned((e) => e + xp);
    setPops((ps) => [...ps, { id, xp }]);
    announceXp(xp);
    play("xp");
    setTimeout(() => setPops((ps) => ps.filter((x) => x.id !== id)), 1600);
  }, []);

  /** Correct answers build a combo; a miss resets it. */
  const streak = useCallback(
    (ok: boolean) => {
      if (ok) {
        setCombo((c) => {
          const n = c + 1;
          if (n >= 2) play("combo", n);
          react(n >= 3 ? "cheer" : "happy", praise(n));
          return n;
        });
      } else {
        setCombo(0);
        react("sad", encourage());
      }
    },
    [react],
  );

  const card = p.cards[i];
  const blocked = card?.type === "check" && !checks[i];

  const go = useCallback(
    (to: number) => {
      if (to < 0 || to >= p.cards.length) return;
      stopSpeaking();
      setReading(false);
      setDir(to > i ? 1 : -1);
      setI(to);
      play("whoosh");
      if (to > i) void lessonEvent(p.slug, p.sid, { event: "seen", index: to });
      if (window.scrollY > 120) window.scrollTo({ top: 0 });
    },
    [i, p.cards.length, p.slug, p.sid],
  );

  // Ilmi greets each card; auto-narration reads it if switched on.
  useEffect(() => {
    if (phase !== "cards" || !card) return;
    // Wait for the card transition, then greet and (optionally) read aloud.
    const t = setTimeout(() => {
      const intro = INTRO[card.type];
      if (intro) react(card.type === "scenario" || card.type === "check" ? "think" : "idle", intro, 2200);
      if (autoRead && card.type !== "explainer" && card.type !== "story" && card.type !== "video") {
        setReading(true);
        speak(script(card, p.cast), () => setReading(false));
      }
    }, 260);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, phase]);

  useEffect(() => {
    if (phase !== "cards") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight" && !blocked) go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, i, blocked, go]);

  const answer = (choice: number) => {
    if (checks[i] || card.type !== "check") return;
    // Feedback is instant; the server records the attempt and decides the XP in the background.
    const correct = choice === card.answer;
    setChecks((c) => ({ ...c, [i]: { choice, correct, answer: card.answer, explanation: card.explanation, xp: 0 } }));
    play(correct ? "correct" : "wrong");
    streak(correct);
    void lessonEvent(p.slug, p.sid, { event: "check", index: i, choice }).then((r) => gain(r.xp ?? 0));
  };

  const gameResult = (index: number) => (score: number, max: number) => {
    if (games[index]) return;
    setGames((g) => ({ ...g, [index]: true }));
    streak(score / max >= 0.75);
    void lessonEvent(p.slug, p.sid, { event: "activity", index, score, max }).then((r) => gain(r.xp ?? 0));
  };

  const complete = () => {
    stopSpeaking();
    // Celebrate at once. Lesson XP is paid only the first time, so the amount is known in advance.
    const lessonXp = p.lessonDone ? 0 : LESSON_XP;
    setCelebrate({ kind: "lesson", xp: earned + lessonXp, xpBefore: p.xp });
    if (!completion.current) {
      setReady(false);
      completion.current = lessonEvent(p.slug, p.sid, { event: "complete" }).then((r) => {
        setEarned((e) => e + (r.xp ?? 0));
        announceXp(r.xp ?? 0);
        setReady(true);
      });
    }
  };

  const listen = () => {
    if (reading) {
      stopSpeaking();
      setReading(false);
      return;
    }
    setReading(true);
    speak(script(card, p.cast), () => setReading(false));
  };

  const progress = Math.round(((i + (phase === "cards" ? 0 : 1)) / p.cards.length) * 100);

  return (
    <div className="lesson">
      <div className="xp-pops" aria-live="polite">
        <AnimatePresence>
          {pops.map((x) => (
            <motion.span key={x.id} className="xp-pop" initial={{ opacity: 0, y: 20, scale: 0.6 }} animate={{ opacity: 1, y: -30, scale: 1 }} exit={{ opacity: 0, y: -70 }} transition={{ duration: 0.7 }}>
              +{x.xp} XP
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <div className="lesson__top">
        <Link href={p.mapHref} className="link-arrow" onClick={() => stopSpeaking()}>
          <span>←</span> Quest map
        </Link>
        <span className="lesson__stage">
          {p.stageLabel} · {p.stage}
        </span>
        <span className="lesson__tools">
          {combo >= 2 && (
            <motion.span key={combo} className="combo-chip" initial={{ scale: 0.4 }} animate={{ scale: [0.4, 1.3, 1] }}>
              🔥 x{combo}
            </motion.span>
          )}
          <span className="earned-chip" title="XP earned in this stage">
            ⭐ {earned}
          </span>
          <button
            className={`tool-btn ${sound ? "is-on" : ""}`}
            onClick={() => {
              setSoundOn(!sound);
              setSound(!sound);
              if (!sound) setTimeout(() => play("correct"), 30);
            }}
            aria-pressed={sound}
            title={sound ? "Sound on" : "Sound off"}
          >
            {sound ? "🔊" : "🔇"}
          </button>
          {canSpeak && (
            <button
              className={`tool-btn ${autoRead ? "is-on" : ""}`}
              onClick={() => {
                setAutoRead(!autoRead);
                setAutoReadState(!autoRead);
                if (autoRead) stopSpeaking();
              }}
              aria-pressed={autoRead}
              title={autoRead ? "Auto-narration on" : "Auto-narration off"}
            >
              🗣️ <small>{autoRead ? "Auto" : "Off"}</small>
            </button>
          )}
        </span>
      </div>

      {phase === "intro" && (
        <motion.div className="lesson__intro glass" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <span className="lesson__intro-icon">🗺️</span>
          <p className="eyebrow">
            <span className="eyebrow__dot" /> {p.courseTitle}
          </p>
          <h1 className="h2">{p.title}</h1>
          {p.cast.length > 0 && <p className="muted">Your companions on this stage: {p.cast.map((c) => c.name).join(", ")}.</p>}
          <p className="muted">By the end of this stage you will be able to:</p>
          <ul className="ticks">
            {p.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          <ul className="lesson__features">
            <li>🎬 Story scenes</li>
            <li>🎞️ Mini-movies</li>
            <li>🧩 Games & decisions</li>
            <li>🎯 Stage test ({p.quiz.pass}/10 to pass)</li>
          </ul>
          <button
            className="btn btn--primary"
            onClick={() => {
              play("whoosh");
              setPhase("cards");
            }}
          >
            <span className="btn__label">Begin the stage</span>
            <span className="btn__arrow">→</span>
          </button>
        </motion.div>
      )}

      {phase === "cards" && card && (
        <>
          <div className="lesson__progress" aria-label={`Card ${i + 1} of ${p.cards.length}`}>
            <motion.span className="lesson__progress-fill" animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
          </div>
          <AnimatePresence mode="popLayout" custom={dir} initial={false}>
            <motion.article
              key={i}
              custom={dir}
              className={`lcard lcard--${card.type} glass`}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * 48 }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => ({ opacity: 0, x: d * -48, transition: { duration: 0.14 } }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="lcard__head">
                <span className="lcard__kind">
                  {KIND[card.type].icon} {KIND[card.type].label}
                </span>
                {canSpeak && card.type !== "explainer" && card.type !== "video" && (
                  <button className={`listen-btn ${reading ? "is-on" : ""}`} onClick={listen} aria-pressed={reading}>
                    {reading ? "■ Stop" : "🔊 Listen"}
                  </button>
                )}
              </div>
              <CardBody card={card} index={i} cast={p.cast} slug={p.slug} sid={p.sid} check={checks[i]} onAnswer={answer} onGame={gameResult(i)} />
            </motion.article>
          </AnimatePresence>
          <div className="lesson__nav">
            <button className="btn btn--ghost btn--back" onClick={() => go(i - 1)} disabled={i === 0}>
              <span className="btn__arrow">←</span>
              <span className="btn__label">Back</span>
            </button>
            <span className="muted lesson__count">
              {i + 1} / {p.cards.length}
            </span>
            {i < p.cards.length - 1 ? (
              <button className="btn btn--primary" onClick={() => go(i + 1)} disabled={blocked}>
                <span className="btn__label">{blocked ? "Answer to continue" : GAME_TYPES.has(card.type) && !games[i] ? "Skip" : "Next"}</span>
                <span className="btn__arrow">→</span>
              </button>
            ) : (
              <button className="btn btn--primary" onClick={complete} disabled={blocked || Boolean(celebrate)}>
                <span className="btn__label">Complete lesson</span>
                <span className="btn__arrow">✓</span>
              </button>
            )}
          </div>
        </>
      )}

      {phase === "done" && (
        <motion.div className="lesson__intro glass" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}>
          <span className="lesson__intro-icon">{p.quiz.passed ? "🏅" : "🎯"}</span>
          <h1 className="h2">{p.quiz.passed ? "Stage cleared!" : "Lesson complete. Ready for the stage test?"}</h1>
          <p className="muted">
            {p.quiz.passed
              ? `Best score ${p.quiz.best}/10. Retake the test any time to improve it, or move on.`
              : `10 questions on this stage. Score ${p.quiz.pass} or more to clear it and unlock what comes next.${p.quiz.attempts ? ` Attempts so far: ${p.quiz.attempts}, best ${p.quiz.best}/10.` : ""}`}
          </p>
          <div className="lesson__actions">
            <button
              className="btn btn--primary"
              onClick={() => {
                play("whoosh");
                setPhase("quiz");
              }}
            >
              <span className="btn__label">{p.quiz.passed ? "Retake the stage test" : "Start the stage test"}</span>
              <span className="btn__arrow">→</span>
            </button>
            {p.quiz.passed && (p.nextHref || p.examHref) && (
              <Link href={(p.nextHref || p.examHref)!} className="btn btn--ghost">
                <span className="btn__label">{p.nextHref ? "Next stage" : "Face the final boss"}</span>
                <span className="btn__arrow">→</span>
              </Link>
            )}
            <button
              className="btn btn--ghost"
              onClick={() => {
                setI(0);
                setPhase("cards");
              }}
            >
              <span className="btn__label">Review the lesson</span>
            </button>
          </div>
        </motion.div>
      )}

      {phase === "quiz" && (
        <ScormPlayer
          slug={p.slug}
          sid={p.sid}
          ready={ready}
          pass={p.quiz.pass}
          nextHref={p.nextHref}
          examHref={p.examHref}
          mapHref={p.mapHref}
          onPreview={(r) => {
            // Celebrate the moment the test ends; XP is predictable (first pass / first perfect score only).
            if (!r.passed) return;
            const q = quizSoFar.current;
            const xp = (q.passed ? 0 : PASS_XP) + (r.score === r.total && q.best < r.total ? PERFECT_XP : 0);
            setCelebrate({ kind: "stage", xp, xpBefore: p.xp + earned, result: { ...r, xp }, confirmed: false });
          }}
          onResult={(r) => {
            if (r.failed || !r.passed) setCelebrate((c) => (c?.kind === "stage" ? null : c));
            if (r.failed) return;
            quizSoFar.current = { passed: quizSoFar.current.passed || r.passed, best: Math.max(quizSoFar.current.best, r.score) };
            gain(r.xp);
            if (r.passed) setCelebrate((c) => (c?.kind === "stage" ? { ...c, confirmed: true } : { kind: "stage", xp: r.xp, xpBefore: p.xp + earned, result: r, confirmed: true }));
            else react("sad", "So close! Review and try again.", 4000);
          }}
        />
      )}

      {phase !== "intro" && (
        <div className="lesson__ilmi">
          <Ilmi mood={mood} message={say} size={72} />
        </div>
      )}

      {celebrate?.kind === "lesson" && (
        <Celebration
          icon="📜"
          title="Lesson complete!"
          subtitle={`You finished “${p.title}”. Now prove it in the stage test.`}
          xpBefore={p.xp}
          xpGained={celebrate.xp}
          actions={[
            {
              label: "Start the stage test",
              primary: true,
              onClick: () => {
                setCelebrate(null);
                setPhase("quiz");
              },
            },
            { label: "Later", onClick: () => (setCelebrate(null), setPhase("done")) },
          ]}
        />
      )}
      {celebrate?.kind === "stage" && celebrate.result && (
        <Celebration
          icon={celebrate.result.score === celebrate.result.total ? "💎" : "🏆"}
          title={celebrate.result.score === celebrate.result.total ? "Perfect score! Stage cleared!" : "Stage cleared!"}
          subtitle={`${p.stage}: ${celebrate.result.score}/${celebrate.result.total} on the stage test.${p.nextHref ? " The next stage is unlocked." : " The final boss awaits!"}`}
          xpBefore={celebrate.xpBefore}
          xpGained={celebrate.xp}
          share={{ text: `I just cleared “${p.stage}” in the ${p.courseTitle} certification quest on Learning Impact! 🏆`, url: p.shareUrl }}
          actions={[
            ...(p.nextHref || p.examHref ? [{ label: p.nextHref ? "Next stage" : "Face the final boss", href: (p.nextHref || p.examHref)!, primary: true, pending: !celebrate.confirmed }] : []),
            { label: "Quest map", href: p.mapHref },
          ]}
        />
      )}
    </div>
  );
}

function CardBody({
  card,
  index,
  cast,
  slug,
  sid,
  check,
  onAnswer,
  onGame,
}: {
  card: PublicCard;
  index: number;
  cast: CastMember[];
  slug: string;
  sid: string;
  check?: CheckResult;
  onAnswer: (choice: number) => void;
  onGame: (score: number, max: number) => void;
}) {
  switch (card.type) {
    case "concept":
    case "example":
    case "tip":
      return (
        <>
          <h2>{card.title}</h2>
          <div className="md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.body}</ReactMarkdown>
          </div>
        </>
      );
    case "keypoints":
      return (
        <>
          <h2>{card.title}</h2>
          <ul className="keypoints">
            {card.items.map((it, k) => (
              <motion.li key={it} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + k * 0.1 }}>
                {it}
              </motion.li>
            ))}
          </ul>
        </>
      );
    case "reflect":
      return <Reflect prompt={card.prompt} storageKey={`li-reflect:${slug}:${sid}:${index}`} />;
    case "check":
      return (
        <>
          <h2>{card.question}</h2>
          <div className="check-opts">
            {card.options.map((o, k) => {
              const cls = check ? (k === check.answer ? "is-right" : k === check.choice ? "is-wrong" : "is-dim") : "";
              return (
                <button key={k} className={`check-opt ${cls}`} onClick={() => onAnswer(k)} disabled={Boolean(check)}>
                  <b>{"ABCD"[k]}</b>
                  <span>{o}</span>
                </button>
              );
            })}
          </div>
          {check && (
            <motion.div className={`check-fb ${check.correct ? "is-right" : "is-wrong"}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <strong>{check.correct ? "Correct!" : "Not quite."}</strong> {check.explanation}
            </motion.div>
          )}
        </>
      );
    case "story":
      return <StoryCard card={card} cast={cast} />;
    case "diagram":
      return <DiagramCard card={card} />;
    case "explainer":
      return <ExplainerCard card={card} />;
    case "video":
      return <VideoCard card={card} />;
    case "scenario":
      return <ScenarioCard card={card} onResult={onGame} />;
    case "flip":
      return <FlipCard card={card} onResult={onGame} />;
    case "sort":
      return <SortCard card={card} onResult={onGame} />;
    case "match":
      return <MatchCard card={card} onResult={onGame} />;
    case "order":
      return <OrderCard card={card} onResult={onGame} />;
  }
}

function Reflect({ prompt, storageKey }: { prompt: string; storageKey: string }) {
  // Reflections stay on this device only; loaded after mounting so the server and browser agree.
  const [text, setText] = useState("");
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setText(localStorage.getItem(storageKey) ?? "");
    } catch {
      /* private mode */
    }
  }, [storageKey]);
  return (
    <>
      <h2>{prompt}</h2>
      <label className="field field--area">
        <textarea
          rows={4}
          placeholder=" "
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            try {
              localStorage.setItem(storageKey, e.target.value);
            } catch {
              /* private mode */
            }
          }}
        />
        <span className="field__label">Your thoughts (private, saved on this device)</span>
        <span className="field__glow" aria-hidden="true" />
      </label>
    </>
  );
}
