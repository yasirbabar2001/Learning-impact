"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { finishExam, recordExamAnswer } from "@/lib/actions/learning";
import { play } from "@/lib/portal/sfx";

type Q = { id: string; question: string; options: string[] };

export function ExamRunner({ slug, title, questions, deadline, initialAnswers }: { slug: string; title: string; questions: Q[]; deadline: string; initialAnswers: Record<string, number> }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [left, setLeft] = useState(() => Math.max(0, Date.parse(deadline) - Date.now()));
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      const ms = Math.max(0, Date.parse(deadline) - Date.now());
      setLeft(ms);
      if (ms === 0 && !submitted.current) {
        submitted.current = true;
        form.current?.requestSubmit();
      }
    }, 500);
    return () => clearInterval(t);
  }, [deadline]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (!submitted.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const q = questions[i];
  const answered = Object.keys(answers).length;
  const mins = Math.floor(left / 60000);
  const secs = Math.floor((left % 60000) / 1000);
  const low = left < 5 * 60000;

  const [hit, setHit] = useState(0);
  const hp = 1 - answered / questions.length;

  const choose = async (k: number) => {
    if (answers[q.id] === undefined) {
      // Every first answer lands a blow on the boss (no hint whether it was right).
      play("hit");
      setHit((h) => h + 1);
    } else play("tap");
    setAnswers((a) => ({ ...a, [q.id]: k }));
    setSaving(q.id);
    const ok = await recordExamAnswer(slug, q.id, k);
    setSaving(null);
    setSaveError(!ok);
  };

  return (
    <div className="exam">
      <div className="exam__bar glass">
        <span className="exam__title">🐉 {title}</span>
        <span className="exam__answered">
          {answered}/{questions.length} answered
        </span>
        <span className={`exam__timer ${low ? "is-low" : ""}`} aria-live="polite">
          ⏱ {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </span>
      </div>
      <div className="boss-hp" aria-label={`Boss health ${Math.round(hp * 100)}%`}>
        <motion.span key={hit} className="boss-hp__face" animate={hit ? { x: [0, -10, 10, -6, 0], rotate: [0, -8, 8, 0], scale: [1, 0.9, 1] } : {}} transition={{ duration: 0.45 }}>
          {hp === 0 ? "😵" : hp < 0.3 ? "🥵" : "🐉"}
        </motion.span>
        <div className="boss-hp__bar">
          <motion.span animate={{ width: `${hp * 100}%` }} transition={{ type: "spring", stiffness: 140, damping: 18 }} />
        </div>
        <span className="boss-hp__label">{hp === 0 ? "Every question answered. Finish it!" : `Boss HP ${Math.round(hp * 100)}%`}</span>
      </div>
      {saveError && <p className="form-alert">An answer could not be saved. Check your connection; your answers are kept while the page is open.</p>}

      <div className="exam__body">
        <AnimatePresence mode="wait">
          <motion.div key={q.id} className="exam__q glass" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
            <div className="exam__qhead">
              <span className="muted">
                Question {i + 1} of {questions.length}
              </span>
              <button className={`exam__flag ${flags[q.id] ? "is-on" : ""}`} onClick={() => setFlags((f) => ({ ...f, [q.id]: !f[q.id] }))} aria-pressed={Boolean(flags[q.id])}>
                {flags[q.id] ? "★ Flagged" : "☆ Flag for review"}
              </button>
            </div>
            <h2>{q.question}</h2>
            <div className="check-opts">
              {q.options.map((o, k) => (
                <button key={k} className={`check-opt ${answers[q.id] === k ? "is-picked" : ""}`} onClick={() => choose(k)} aria-pressed={answers[q.id] === k}>
                  <b>{"ABCD"[k]}</b>
                  <span>{o}</span>
                </button>
              ))}
            </div>
            <p className="muted exam__saved">{saving === q.id ? "Saving…" : answers[q.id] !== undefined ? "Answer saved ✓" : " "}</p>
            <div className="lesson__nav">
              <button className="btn btn--ghost btn--back" onClick={() => setI(i - 1)} disabled={i === 0}>
                <span className="btn__arrow">←</span>
                <span className="btn__label">Previous</span>
              </button>
              {i < questions.length - 1 ? (
                <button className="btn btn--primary" onClick={() => setI(i + 1)}>
                  <span className="btn__label">Next</span>
                  <span className="btn__arrow">→</span>
                </button>
              ) : (
                <button className="btn btn--primary" onClick={() => setConfirm(true)}>
                  <span className="btn__label">Finish exam</span>
                  <span className="btn__arrow">✓</span>
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <aside className="exam__grid glass" aria-label="Question navigator">
          <p className="muted">Jump to a question</p>
          <div className="exam__dots">
            {questions.map((qq, k) => (
              <button
                key={qq.id}
                className={`exam__dot ${answers[qq.id] !== undefined ? "is-done" : ""} ${flags[qq.id] ? "is-flag" : ""} ${k === i ? "is-now" : ""}`}
                onClick={() => setI(k)}
                aria-label={`Question ${k + 1}${answers[qq.id] !== undefined ? ", answered" : ""}${flags[qq.id] ? ", flagged" : ""}`}
              >
                {k + 1}
              </button>
            ))}
          </div>
          <button className="btn btn--ghost btn--sm exam__finish" onClick={() => setConfirm(true)}>
            <span className="btn__label">Finish exam</span>
          </button>
        </aside>
      </div>

      <form ref={form} action={finishExam}>
        <input type="hidden" name="slug" value={slug} />
      </form>

      <AnimatePresence>
        {confirm && (
          <motion.div className="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirm(false)}>
            <motion.div className="modal__card exam__confirm" initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <h2 className="h3">Submit your exam?</h2>
              <p className="muted">
                You answered {answered} of {questions.length} questions.
                {answered < questions.length ? ` ${questions.length - answered} unanswered question(s) will be marked wrong.` : ""}
                {Object.values(flags).some(Boolean) ? " You still have flagged questions." : ""}
              </p>
              <div className="lesson__actions">
                <button
                  className="btn btn--primary"
                  onClick={() => {
                    submitted.current = true;
                    form.current?.requestSubmit();
                  }}
                >
                  <span className="btn__label">Submit now</span>
                  <span className="btn__arrow">→</span>
                </button>
                <button className="btn btn--ghost" onClick={() => setConfirm(false)}>
                  <span className="btn__label">Keep checking</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
