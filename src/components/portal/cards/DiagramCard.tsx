"use client";

import { animate, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Card } from "@/lib/courses/schema";
import { play } from "@/lib/portal/sfx";

type Diagram = Extract<Card, { type: "diagram" }>;
type Item = Diagram["items"][number];

const ease = [0.22, 1, 0.36, 1] as const;
const PALETTE = ["#ff4d6d", "#ff9f1c", "#ffd23f", "#2ee59d", "#00c2ff", "#7b61ff", "#ff4dd8", "#9be15d"];

/** Tap an item to see its detail underneath the diagram. */
function useFocus(items: Item[]) {
  const [focus, setFocus] = useState<number | null>(null);
  const pick = (i: number) => {
    play("tap");
    setFocus((f) => (f === i ? null : i));
  };
  const detail = focus !== null ? items[focus] : null;
  return { focus, pick, detail };
}

function Detail({ item, color }: { item: Item | null; color?: string }) {
  if (!item?.detail) return null;
  return (
    <motion.p key={item.label} className="dg-detail" style={{ borderColor: color }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <strong>{item.label}:</strong> {item.detail}
    </motion.p>
  );
}

function Cycle({ items }: { items: Item[] }) {
  const { focus, pick, detail } = useFocus(items);
  const n = items.length;
  const R = 120;
  return (
    <>
      <div className="dg-cycle">
        <motion.svg viewBox="-170 -170 340 340" className="dg-cycle__ring" aria-hidden="true">
          <motion.circle r={R} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="3" strokeDasharray="8 10" animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} />
          {items.map((_, i) => {
            const a = ((i + 0.5) / n) * Math.PI * 2 - Math.PI / 2;
            return (
              <motion.path
                key={i}
                d="M -7 -6 L 4 0 L -7 6"
                fill="none"
                stroke="var(--c)"
                strokeWidth="3"
                strokeLinecap="round"
                transform={`translate(${Math.cos(a) * R} ${Math.sin(a) * R}) rotate(${(a * 180) / Math.PI + 90})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.15 }}
              />
            );
          })}
        </motion.svg>
        {items.map((it, i) => {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          return (
            <motion.button
              key={it.label}
              className={`dg-node ${focus === i ? "is-on" : ""}`}
              style={{ left: `calc(50% + ${Math.cos(a) * 36}%)`, top: `calc(50% + ${Math.sin(a) * 36}%)`, ["--n" as string]: PALETTE[i % PALETTE.length] }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.2 + i * 0.12 }}
              onClick={() => pick(i)}
            >
              <span className="dg-node__n">{i + 1}</span>
              {it.label}
            </motion.button>
          );
        })}
      </div>
      <Detail item={detail} />
      {!detail && <p className="dg-hint">Tap a step to explore it</p>}
    </>
  );
}

function Steps({ items }: { items: Item[] }) {
  return (
    <ol className="dg-steps">
      {items.map((it, i) => (
        <motion.li key={it.label} style={{ ["--n" as string]: PALETTE[i % PALETTE.length] }} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.14, duration: 0.5, ease }}>
          <span className="dg-steps__n">{i + 1}</span>
          <div>
            <strong>{it.label}</strong>
            {it.detail && <p>{it.detail}</p>}
          </div>
        </motion.li>
      ))}
    </ol>
  );
}

function Pyramid({ items }: { items: Item[] }) {
  const { focus, pick, detail } = useFocus(items);
  const n = items.length;
  return (
    <>
      <div className="dg-pyramid">
        {items.map((it, i) => {
          const w = 34 + (66 * (i + 1)) / n;
          return (
            <motion.button
              key={it.label}
              className={`dg-pyramid__layer ${focus === i ? "is-on" : ""}`}
              style={{ width: `${w}%`, background: PALETTE[i % PALETTE.length] }}
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.15 + i * 0.15 }}
              onClick={() => pick(i)}
            >
              {it.label}
            </motion.button>
          );
        })}
      </div>
      <Detail item={detail} color={focus !== null ? PALETTE[focus % PALETTE.length] : undefined} />
      {!detail && items.some((x) => x.detail) && <p className="dg-hint">Tap a layer to explore it</p>}
    </>
  );
}

function Matrix({ items, axes }: { items: Item[]; axes?: Diagram["axes"] }) {
  return (
    <div className="dg-matrix">
      <span className="dg-matrix__y">{axes?.y} ↑</span>
      <div className="dg-matrix__grid">
        {items.slice(0, 4).map((it, i) => (
          <motion.div
            key={it.label}
            className="dg-matrix__cell"
            style={{ ["--n" as string]: PALETTE[[0, 3, 1, 4][i]] }}
            initial={{ opacity: 0, scale: 0.6, rotate: i % 2 ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.15 + i * 0.13 }}
          >
            <strong>{it.label}</strong>
            {it.detail && <p>{it.detail}</p>}
          </motion.div>
        ))}
      </div>
      <span className="dg-matrix__x">{axes?.x} →</span>
    </div>
  );
}

function Funnel({ items }: { items: Item[] }) {
  return (
    <div className="dg-funnel">
      {items.map((it, i) => (
        <motion.div
          key={it.label}
          className="dg-funnel__band"
          style={{ width: `${100 - (i * 55) / Math.max(1, items.length - 1)}%`, background: PALETTE[i % PALETTE.length] }}
          initial={{ opacity: 0, scaleX: 0.3 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.15 + i * 0.15, duration: 0.6, ease }}
        >
          <strong>{it.label}</strong>
          {it.value && <span>{it.value}</span>}
          {it.detail && <small>{it.detail}</small>}
        </motion.div>
      ))}
    </div>
  );
}

function Compare({ items, headers }: { items: Item[]; headers?: Diagram["headers"] }) {
  return (
    <div className="dg-compare">
      <div className="dg-compare__head">
        <span />
        <motion.strong initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          {headers?.[0]}
        </motion.strong>
        <motion.strong initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          {headers?.[1]}
        </motion.strong>
      </div>
      {items.map((it, i) => (
        <div key={it.label} className="dg-compare__row">
          <span className="dg-compare__label">{it.label}</span>
          <motion.span className="dg-compare__l" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.12 }}>
            {it.left}
          </motion.span>
          <motion.span className="dg-compare__r" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.26 + i * 0.12 }}>
            {it.right}
          </motion.span>
        </div>
      ))}
    </div>
  );
}

function Timeline({ items }: { items: Item[] }) {
  return (
    <ol className="dg-timeline">
      {items.map((it, i) => (
        <motion.li key={it.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.14 }}>
          <span className="dg-timeline__dot" style={{ background: PALETTE[i % PALETTE.length] }} />
          {it.value && <span className="dg-timeline__when">{it.value}</span>}
          <strong>{it.label}</strong>
          {it.detail && <p>{it.detail}</p>}
        </motion.li>
      ))}
    </ol>
  );
}

/** Animates the numeric part of a value such as "68%", "PKR 2.4m" or "1 in 5". */
function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  // Numbers like "60,000", "2.4" or "68": keep the separators and decimals while counting.
  const m = value.match(/-?\d{1,3}(?:,\d{3})+(?:\.\d+)?|-?\d+(?:\.\d+)?/);
  const grouped = Boolean(m && m[0].includes(","));
  const target = m ? Number(m[0].replace(/,/g, "")) : null;
  const decimals = m && m[0].includes(".") ? m[0].split(".")[1].length : 0;
  const fmt = (v: number) => (grouped ? v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : v.toFixed(decimals));
  const [shown, setShown] = useState(target === null ? value : value.replace(m![0], fmt(0)));
  useEffect(() => {
    if (!inView || target === null || !m) return;
    const controls = animate(0, target, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (v) => setShown(value.replace(m[0], fmt(v))),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);
  return <span ref={ref}>{shown}</span>;
}

function Stats({ items }: { items: Item[] }) {
  return (
    <div className="dg-stats">
      {items.map((it, i) => (
        <motion.div key={it.label} className="dg-stat" style={{ ["--n" as string]: PALETTE[i % PALETTE.length] }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.12 }}>
          <span className="dg-stat__value">
            <CountUp value={it.value ?? ""} />
          </span>
          <strong>{it.label}</strong>
          {it.detail && <p>{it.detail}</p>}
        </motion.div>
      ))}
    </div>
  );
}

export function DiagramCard({ card }: { card: Diagram }) {
  const body = {
    cycle: <Cycle items={card.items} />,
    steps: <Steps items={card.items} />,
    pyramid: <Pyramid items={card.items} />,
    matrix: <Matrix items={card.items} axes={card.axes} />,
    funnel: <Funnel items={card.items} />,
    compare: <Compare items={card.items} headers={card.headers} />,
    timeline: <Timeline items={card.items} />,
    stats: <Stats items={card.items} />,
  }[card.kind];
  return (
    <>
      <h2>{card.title}</h2>
      {card.caption && <p className="lcard__lead">{card.caption}</p>}
      <div className={`dg dg--${card.kind}`}>{body}</div>
    </>
  );
}
