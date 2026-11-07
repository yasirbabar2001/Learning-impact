"use client";

import { useState } from "react";
import type { VisitPeriod } from "@/lib/portal/stats";

/**
 * Website visitors for today / this month / this year / all time. One series (unique visitors) as bars, with
 * page views in the tooltip and the table view, so colour never carries meaning on its own.
 */
export function VisitorsChart({ periods }: { periods: VisitPeriod[] }) {
  const [key, setKey] = useState<VisitPeriod["key"]>("month");
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const p = periods.find((x) => x.key === key)!;
  const max = Math.max(1, ...p.buckets.map((b) => b.visitors));
  const every = Math.ceil(p.buckets.length / 12); // label at most ~12 ticks
  const tip = hover !== null ? p.buckets[hover] : null;
  return (
    <div className="glass dash-admin__panel visitors">
      <div className="visitors__head">
        <h2 className="h3">Website visitors</h2>
        <div className="visitors__tabs" role="tablist" aria-label="Period">
          {periods.map((x) => (
            <button key={x.key} role="tab" aria-selected={x.key === key} className={x.key === key ? "is-on" : ""} onClick={() => (setKey(x.key), setHover(null))}>
              {x.key === "day" ? "Today" : x.key === "month" ? "This month" : x.key === "year" ? "This year" : "All time"}
            </button>
          ))}
        </div>
      </div>
      <div className="visitors__totals">
        <div>
          <strong>{p.visitors.toLocaleString()}</strong>
          <span>visitors · {p.title}</span>
        </div>
        <div>
          <strong>{p.views.toLocaleString()}</strong>
          <span>page views</span>
        </div>
        <div>
          <strong>{p.visitors ? (p.views / p.visitors).toFixed(1) : "0"}</strong>
          <span>pages per visitor</span>
        </div>
      </div>
      {table ? (
        <div className="table-wrap visitors__table">
          <table className="users-table">
            <thead>
              <tr>
                <th>{key === "day" ? "Hour" : key === "month" ? "Day" : "Month"}</th>
                <th className="num">Visitors</th>
                <th className="num">Page views</th>
              </tr>
            </thead>
            <tbody>
              {p.buckets.map((b) => (
                <tr key={b.label}>
                  <td>{b.label}</td>
                  <td className="num">{b.visitors}</td>
                  <td className="num">{b.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="visitors__plot" onMouseLeave={() => setHover(null)}>
          <span className="visitors__max" aria-hidden="true">
            {max}
          </span>
          <div className="visitors__bars" style={{ gridTemplateColumns: `repeat(${p.buckets.length}, 1fr)` }} role="img" aria-label={`Visitors per ${key === "day" ? "hour" : key === "month" ? "day" : "month"}: ${p.buckets.map((b) => `${b.label} ${b.visitors}`).join(", ")}`}>
            {p.buckets.map((b, i) => (
              <span key={b.label} className={`visitors__col ${hover === i ? "is-hover" : ""}`} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
                <span className="visitors__bar" style={{ height: `${b.visitors ? Math.max(3, (b.visitors / max) * 100) : 0}%` }} />
                {i % every === 0 && <span className="visitors__tick">{b.label}</span>}
              </span>
            ))}
          </div>
          {tip && (
            <div className="visitors__tip" role="status">
              <strong>{tip.label}</strong> · {tip.visitors} visitor{tip.visitors === 1 ? "" : "s"} · {tip.views} page view{tip.views === 1 ? "" : "s"}
            </div>
          )}
        </div>
      )}
      <button className="inline-link visitors__toggle" onClick={() => setTable((v) => !v)}>
        {table ? "Show as chart" : "Show as table"}
      </button>
    </div>
  );
}
