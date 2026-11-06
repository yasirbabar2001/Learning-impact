"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { checkAnswer, finishLesson, saveCardProgress } from "@/lib/actions/learning";
import { ScormPlayer } from "./ScormPlayer";

/** Cards as sent to the browser: knowledge-check answers stay on the server. */
export type PublicCard =
  | { type: "concept" | "example" | "tip"; title: string; body: string }
  | { type: "keypoints"; title: string; items: string[] }
  | { type: "reflect"; prompt: string }
  | { type: "check"; question: string; options: string[] };

type Props = {
  slug: string;
  sid: string;
  stageLabel: string;
  stage: string;
  title: string;
  objectives: string[];
  cards: PublicCard[];
  startAt: number;
  lessonDone: boolean;
  quiz: { passed: boolean; best: number; attempts: number; pass: number };
  nextHref: string | null;
  mapHref: string;
  examHref: string | null;
};

type CheckResult = { choice: number; correct: boolean; answer: number; explanation: string; xp: number };

const KIND: Record<string, { icon: string; label: string }> = {
  concept: { icon: "📘", label: "Concept" },
  example: { icon: "📍", label: "Real-world case" },
  tip: { icon: "💡", label: "Pro tip" },
  keypoints: { icon: "🗝️", label: "Key points" },
  reflect: { icon: "🪞", label: "Reflect" },
  check: { icon: "⚡", label: "Quick check" },
};

export function LessonPlayer(p: Props) {
  const [phase, setPhase] = useState<"intro" | "cards" | "done" | "quiz">(p.lessonDone ? "done" : p.startAt > 0 ? "cards" : "intro");
  const [i, setI] = useState(Math.min(p.startAt, p.cards.length - 1));
  const [dir, setDir] = useState(1);
  const [checks, setChecks] = useState<Record<number, CheckResult>>({});
  const [pops, setPops] = useState<{ id: number; xp: number }[]>([]);
  const [pending, start] = useTransition();
  const popId = useRef(0);
  const router = useRouter();

  const pop = useCallback((xp: number) => {
    if (xp <= 0) return;
    const id = ++popId.current;
    setPops((ps) => [...ps, { id, xp }]);
    setTimeout(() => setPops((ps) => ps.filter((x) => x.id !== id)), 1600);
  }, []);

  const card = p.cards[i];
  const blocked = card?.type === "check" && !checks[i];

  const go = useCallback(
    (to: number) => {
      if (to < 0 || to >= p.cards.length) return;
      setDir(to > i ? 1 : -1);
      setI(to);
      if (to > i) void saveCardProgress(p.slug, p.sid, to);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [i, p.cards.length, p.slug, p.sid],
  );

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
    if (checks[i]) return;
    start(async () => {
      const r = await checkAnswer(p.slug, p.sid, i, choice);
      if (!r) return;
      setChecks((c) => ({ ...c, [i]: { choice, ...r } }));
      pop(r.xp);
    });
  };

  const complete = () =>
    start(async () => {
      const r = await finishLesson(p.slug, p.sid);
      pop(r?.xp ?? 0);
      setPhase("done");
      router.refresh(); // update XP and streak in the header
    });

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
        <Link href={p.mapHref} className="link-arrow">
          <span>←</span> Quest map
        </Link>
        <span className="lesson__stage">
          {p.stageLabel} · {p.stage}
        </span>
      </div>

      {phase === "intro" && (
        <motion.div className="lesson__intro glass" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <span className="lesson__intro-icon">🗺️</span>
          <h1 className="h2">{p.title}</h1>
          <p className="muted">By the end of this stage you will be able to:</p>
          <ul className="ticks">
            {p.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          <p className="muted lesson__rules">
            {p.cards.length} cards · quick checks earn XP · finish with a 10-question stage test ({p.quiz.pass}/10 to pass)
          </p>
          <button className="btn btn--primary" onClick={() => setPhase("cards")}>
            <span className="btn__label">Begin the stage</span>
            <span className="btn__arrow">→</span>
          </button>
        </motion.div>
      )}

      {phase === "cards" && card && (
        <>
          <div className="lesson__progress" aria-label={`Card ${i + 1} of ${p.cards.length}`}>
            {p.cards.map((_, k) => (
              <span key={k} className={k < i ? "is-done" : k === i ? "is-now" : ""} />
            ))}
          </div>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.article
              key={i}
              custom={dir}
              className={`lcard lcard--${card.type} glass`}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * 80, rotateY: d * 12 }),
                center: { opacity: 1, x: 0, rotateY: 0 },
                exit: (d: number) => ({ opacity: 0, x: d * -80, rotateY: d * -12 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="lcard__kind">
                {KIND[card.type].icon} {KIND[card.type].label}
              </span>
              {(card.type === "concept" || card.type === "example" || card.type === "tip") && (
                <>
                  <h2>{card.title}</h2>
                  <div className="md">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.body}</ReactMarkdown>
                  </div>
                </>
              )}
              {card.type === "keypoints" && (
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
              )}
              {card.type === "reflect" && <Reflect prompt={card.prompt} storageKey={`li-reflect:${p.slug}:${p.sid}:${i}`} />}
              {card.type === "check" && (
                <>
                  <h2>{card.question}</h2>
                  <div className="check-opts">
                    {card.options.map((o, k) => {
                      const r = checks[i];
                      const cls = r ? (k === r.answer ? "is-right" : k === r.choice ? "is-wrong" : "is-dim") : "";
                      return (
                        <button key={k} className={`check-opt ${cls}`} onClick={() => answer(k)} disabled={Boolean(r) || pending}>
                          <b>{"ABCD"[k]}</b>
                          <span>{o}</span>
                        </button>
                      );
                    })}
                  </div>
                  {checks[i] && (
                    <motion.div className={`check-fb ${checks[i].correct ? "is-right" : "is-wrong"}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <strong>{checks[i].correct ? "Correct!" : "Not quite."}</strong> {checks[i].explanation}
                    </motion.div>
                  )}
                </>
              )}
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
                <span className="btn__label">{blocked ? "Answer to continue" : "Next"}</span>
                <span className="btn__arrow">→</span>
              </button>
            ) : (
              <button className="btn btn--primary" onClick={complete} disabled={blocked || pending}>
                <span className="btn__label">{pending ? "Saving…" : "Complete lesson"}</span>
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
            <button className="btn btn--primary" onClick={() => setPhase("quiz")}>
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

      {phase === "quiz" && <ScormPlayer slug={p.slug} sid={p.sid} pass={p.quiz.pass} nextHref={p.nextHref} examHref={p.examHref} mapHref={p.mapHref} onXp={(xp) => {
        pop(xp);
        router.refresh();
      }} />}
    </div>
  );
}

function Reflect({ prompt, storageKey }: { prompt: string; storageKey: string }) {
  // Reflections stay on this device only.
  const [text, setText] = useState(() => {
    try {
      return typeof window === "undefined" ? "" : (localStorage.getItem(storageKey) ?? "");
    } catch {
      return "";
    }
  });
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
