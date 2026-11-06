"use client";

import { AnimatePresence, motion, Reorder } from "motion/react";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Card } from "@/lib/courses/schema";
import { play } from "@/lib/portal/sfx";

type OnResult = (score: number, max: number) => void;
type Scenario = Extract<Card, { type: "scenario" }>;
type Flip = Extract<Card, { type: "flip" }>;
type Sort = Extract<Card, { type: "sort" }>;
type Match = Extract<Card, { type: "match" }>;
type Order = Extract<Card, { type: "order" }>;

/** Shuffle that is the same on the server and in the browser (seeded by the content). */
function seeded<T>(items: T[], seedText: string): T[] {
  let h = 2166136261;
  for (const ch of seedText) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rnd = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Never leave an "order" puzzle already solved.
  if (a.length > 1 && a.every((x, i) => x === items[i])) a.push(a.shift()!);
  return a;
}

const GRADE = ["Risky choice", "Partly right", "Best choice"];

export function ScenarioCard({ card, onResult }: { card: Scenario; onResult: OnResult }) {
  const [picked, setPicked] = useState<number | null>(null);
  const best = card.choices.findIndex((c) => c.score === 2);
  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    play(card.choices[i].score === 2 ? "correct" : card.choices[i].score === 1 ? "tap" : "wrong");
    onResult(card.choices[i].score, 2);
  };
  return (
    <>
      <span className="game-tag">🧭 What would you do?</span>
      <h2>{card.title}</h2>
      <div className="md scenario__situation">
        <ReactMarkdown>{card.situation}</ReactMarkdown>
      </div>
      <div className="check-opts">
        {card.choices.map((c, i) => {
          const state = picked === null ? "" : i === picked ? `is-picked-${c.score}` : i === best ? "is-best" : "is-dim";
          return (
            <motion.button key={i} className={`check-opt scenario__choice ${state}`} onClick={() => choose(i)} disabled={picked !== null} whileTap={{ scale: 0.98 }}>
              <b>{"ABCD"[i]}</b>
              <span>{c.text}</span>
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {picked !== null && (
          <motion.div className={`scenario__outcome scenario__outcome--${card.choices[picked].score}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <strong>{GRADE[card.choices[picked].score]}</strong>
            <p>{card.choices[picked].outcome}</p>
            {picked !== best && (
              <p className="scenario__best">
                <strong>The best move:</strong> {card.choices[best].text} — {card.choices[best].outcome}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function FlipCard({ card, onResult }: { card: Flip; onResult: OnResult }) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const flip = (i: number) => {
    play("flip");
    setFlipped((f) => {
      const n = new Set(f);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      if (n.size === card.cards.length && f.size < card.cards.length) onResult(1, 1);
      return n;
    });
  };
  return (
    <>
      <span className="game-tag">🃏 Flip the cards</span>
      <h2>{card.title}</h2>
      <div className="flips">
        {card.cards.map((c, i) => (
          <button key={i} className={`flip ${flipped.has(i) ? "is-flipped" : ""}`} onClick={() => flip(i)} aria-pressed={flipped.has(i)}>
            <span className="flip__inner">
              <span className="flip__front">
                <span className="flip__n">{i + 1}</span>
                {c.front}
                <small>Tap to flip</small>
              </span>
              <span className="flip__back">{c.back}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="dg-hint">
        {flipped.size}/{card.cards.length} explored
      </p>
    </>
  );
}

export function SortCard({ card, onResult }: { card: Sort; onResult: OnResult }) {
  const items = useMemo(() => seeded(card.items.map((it, i) => ({ ...it, i })), card.title), [card]);
  const [placed, setPlaced] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const pool = items.filter((it) => placed[it.i] === undefined);

  const put = (bucket: number) => {
    if (selected === null || checked) return;
    play("tap");
    setPlaced((p) => ({ ...p, [selected]: bucket }));
    setSelected(null);
  };
  const check = () => {
    const score = card.items.filter((it, i) => placed[i] === it.bucket).length;
    setChecked(true);
    play(score === card.items.length ? "correct" : score >= card.items.length / 2 ? "tap" : "wrong");
    onResult(score, card.items.length);
  };
  const retry = () => {
    setPlaced((p) => Object.fromEntries(Object.entries(p).filter(([i, b]) => card.items[Number(i)].bucket === b)));
    setChecked(false);
  };

  return (
    <>
      <span className="game-tag">🗂️ Sort it out</span>
      <h2>{card.title}</h2>
      <p className="lcard__lead">{card.prompt}</p>
      <div className="sort__pool" aria-label="Items to sort">
        <AnimatePresence>
          {pool.map((it) => (
            <motion.button key={it.i} layout className={`chip-btn ${selected === it.i ? "is-on" : ""}`} onClick={() => setSelected(selected === it.i ? null : it.i)} exit={{ opacity: 0, scale: 0.6 }} aria-pressed={selected === it.i}>
              {it.text}
            </motion.button>
          ))}
        </AnimatePresence>
        {pool.length === 0 && !checked && <span className="dg-hint">All sorted. Check your answers!</span>}
      </div>
      <div className="sort__buckets" style={{ gridTemplateColumns: `repeat(${card.buckets.length}, 1fr)` }}>
        {card.buckets.map((b, bi) => (
          <button key={b} className={`sort__bucket ${selected !== null ? "is-ready" : ""}`} onClick={() => put(bi)}>
            <strong>{b}</strong>
            {items
              .filter((it) => placed[it.i] === bi)
              .map((it) => (
                <motion.span
                  key={it.i}
                  layout
                  className={`sort__item ${checked ? (it.bucket === bi ? "is-right" : "is-wrong") : ""}`}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={(e) => {
                    // Holding an item? Then a tap anywhere in the bucket drops it here.
                    if (selected !== null) return;
                    e.stopPropagation();
                    if (!checked) setPlaced((p) => Object.fromEntries(Object.entries(p).filter(([k]) => Number(k) !== it.i)));
                  }}
                >
                  {it.text}
                  {checked && it.bucket !== bi && <small> → {card.buckets[it.bucket]}</small>}
                </motion.span>
              ))}
          </button>
        ))}
      </div>
      <div className="game-actions">
        {!checked ? (
          <button className="btn btn--primary btn--sm" onClick={check} disabled={pool.length > 0}>
            <span className="btn__label">Check my sorting</span>
          </button>
        ) : (
          <>
            <span className="game-score">
              {card.items.filter((it, i) => placed[i] === it.bucket).length}/{card.items.length} correct
            </span>
            {card.items.some((it, i) => placed[i] !== it.bucket) && (
              <button className="btn btn--ghost btn--sm" onClick={retry}>
                <span className="btn__label">Fix the wrong ones</span>
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}

export function MatchCard({ card, onResult }: { card: Match; onResult: OnResult }) {
  const rights = useMemo(() => seeded(card.pairs.map((p, i) => ({ text: p.right, i })), card.title + "r"), [card]);
  const [left, setLeft] = useState<number | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const pickRight = (ri: number) => {
    if (left === null || done.has(ri)) return;
    if (ri === left) {
      play("correct");
      const n = new Set(done).add(ri);
      setDone(n);
      setLeft(null);
      if (n.size === card.pairs.length) onResult(Math.max(0, card.pairs.length - mistakes), card.pairs.length);
    } else {
      play("wrong");
      setMistakes((m) => m + 1);
      setWrong(ri);
      setTimeout(() => setWrong(null), 500);
    }
  };

  return (
    <>
      <span className="game-tag">🔗 Match the pairs</span>
      <h2>{card.title}</h2>
      <p className="lcard__lead">{card.prompt}</p>
      <div className="match">
        <div className="match__col">
          {card.pairs.map((p, i) => (
            <button key={i} className={`match__item ${left === i ? "is-on" : ""} ${done.has(i) ? "is-done" : ""}`} onClick={() => !done.has(i) && (play("tap"), setLeft(i))} disabled={done.has(i)}>
              {p.left}
            </button>
          ))}
        </div>
        <div className="match__col">
          {rights.map((r) => (
            <motion.button
              key={r.i}
              className={`match__item match__item--right ${done.has(r.i) ? "is-done" : ""} ${wrong === r.i ? "is-wrong" : ""}`}
              onClick={() => pickRight(r.i)}
              disabled={done.has(r.i)}
              animate={wrong === r.i ? { x: [0, -8, 8, -4, 0] } : {}}
            >
              {r.text}
            </motion.button>
          ))}
        </div>
      </div>
      <p className="dg-hint">{done.size === card.pairs.length ? `All matched${mistakes ? ` with ${mistakes} slip(s)` : " perfectly"}!` : left === null ? "Pick an item on the left, then its match on the right" : "Now pick its match on the right"}</p>
    </>
  );
}

export function OrderCard({ card, onResult }: { card: Order; onResult: OnResult }) {
  const [list, setList] = useState(() => seeded(card.steps, card.title));
  const [checked, setChecked] = useState(false);
  const correct = list.filter((s, i) => s === card.steps[i]).length;
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= list.length || checked) return;
    const n = [...list];
    [n[i], n[j]] = [n[j], n[i]];
    setList(n);
    play("tap");
  };
  const check = () => {
    setChecked(true);
    play(correct === card.steps.length ? "correct" : "wrong");
    onResult(correct, card.steps.length);
  };
  return (
    <>
      <span className="game-tag">🪜 Put it in order</span>
      <h2>{card.title}</h2>
      <p className="lcard__lead">{card.prompt}</p>
      <Reorder.Group axis="y" values={list} onReorder={(v) => !checked && setList(v)} className="order">
        {list.map((s, i) => (
          <Reorder.Item key={s} value={s} className={`order__item ${checked ? (s === card.steps[i] ? "is-right" : "is-wrong") : ""}`} dragListener={!checked}>
            <span className="order__n">{i + 1}</span>
            <span className="order__text">{s}</span>
            {!checked && (
              <span className="order__arrows">
                <button onClick={() => move(i, -1)} aria-label="Move up" disabled={i === 0}>
                  ↑
                </button>
                <button onClick={() => move(i, 1)} aria-label="Move down" disabled={i === list.length - 1}>
                  ↓
                </button>
              </span>
            )}
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <div className="game-actions">
        {!checked ? (
          <button className="btn btn--primary btn--sm" onClick={check}>
            <span className="btn__label">Check the order</span>
          </button>
        ) : (
          <>
            <span className="game-score">
              {correct}/{card.steps.length} in the right place
            </span>
            {correct < card.steps.length && (
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setList(card.steps);
                  play("whoosh");
                }}
              >
                <span className="btn__label">Show the right order</span>
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}
