"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, useTransition } from "react";
import { removeRequest, saveRequestNotes, setRequestStatus } from "@/app/admin/actions";
import { FORMAT_LABELS, REQUEST_STATUSES, REQUEST_TYPE_LABELS, REQUEST_TYPES, STATUS_LABELS, type RequestStatus, type TrainingRequest } from "@/lib/types";
import { Drawer } from "./Drawer";

const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function RequestsBoard({ requests, recentCount }: { requests: TrainingRequest[]; recentCount: number }) {
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("open");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Partial<TrainingRequest>>>({});
  const [pending, startTransition] = useTransition();

  const all = useMemo(() => requests.map((r) => ({ ...r, ...overrides[r.id] })), [requests, overrides]);

  const stats = [
    { label: "New", value: all.filter((r) => r.status === "new").length, tone: "hot" },
    { label: "Last 7 days", value: recentCount },
    { label: "In progress", value: all.filter((r) => r.status === "contacted" || r.status === "proposal").length },
    { label: "Confirmed", value: all.filter((r) => r.status === "confirmed").length },
  ];

  const shown = all.filter((r) => {
    if (type !== "all" && r.type !== type) return false;
    if (status === "open" && r.status === "closed") return false;
    if (status !== "open" && status !== "all" && r.status !== status) return false;
    const q = query.trim().toLowerCase();
    return !q || `${r.reference} ${r.company} ${r.contactName} ${r.email} ${r.programTitle ?? ""} ${Object.values(r.details).join(" ")}`.toLowerCase().includes(q);
  });

  const selected = all.find((r) => r.id === selectedId) ?? null;

  const patch = (id: string, p: Partial<TrainingRequest>) => setOverrides((o) => ({ ...o, [id]: { ...o[id], ...p } }));

  return (
    <div className="board">
      <div className="board__head">
        <div>
          <h1 className="h3">Requests</h1>
          <p className="muted">Bookings, trainer requests and enquiries from the website.</p>
        </div>
        <a className="btn btn--ghost btn--sm" href="/admin/export">
          <span className="btn__label">Export CSV</span>
          <span className="btn__arrow">↓</span>
        </a>
      </div>

      <div className="stats">
        {stats.map((s, i) => (
          <motion.div key={s.label} className={`stat spot ${s.tone === "hot" && s.value ? "stat--hot" : ""}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <span className="stat__value">{s.value}</span>
            <span className="muted">{s.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="board__filters">
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type">
          <option value="all">All types</option>
          {REQUEST_TYPES.map((t) => (
            <option key={t} value={t}>
              {REQUEST_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="open">Open (not closed)</option>
          <option value="all">All statuses</option>
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <label className="search">
          <span className="sr-only">Search requests</span>
          <input type="search" placeholder="Search company, name, reference…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      {shown.length === 0 ? (
        <div className="empty glass">
          <h3>{requests.length ? "Nothing matches these filters." : "No requests yet."}</h3>
          <p className="muted">{requests.length ? "Try clearing the search or status filter." : "New bookings and trainer requests will appear here as soon as they are submitted."}</p>
        </div>
      ) : (
        <ul className="req-list">
          <AnimatePresence initial={false}>
            {shown.map((r, i) => (
              <motion.li key={r.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ delay: Math.min(i * 0.02, 0.2) }}>
                <button className="req spot" onClick={() => setSelectedId(r.id)}>
                  <span className={`badge badge--${r.status}`}>{STATUS_LABELS[r.status]}</span>
                  <span className="req__main">
                    <strong>{r.company}</strong>
                    <span className="muted">
                      {r.contactName} · {REQUEST_TYPE_LABELS[r.type]}
                      {r.programTitle ? ` · ${r.programTitle}` : r.details.Topic ? ` · ${r.details.Topic}` : ""}
                    </span>
                  </span>
                  <span className="req__meta">
                    <span className="mono">{r.reference}</span>
                    <span className="muted">{day(r.createdAt)}</span>
                  </span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Drawer open={Boolean(selected)} onClose={() => setSelectedId(null)} title={selected ? selected.company : ""}>
        {selected && (
          <RequestDetail
            key={selected.id}
            r={selected}
            pending={pending}
            onStatus={(s) => {
              patch(selected.id, { status: s });
              startTransition(() => setRequestStatus(selected.id, s));
            }}
            onNotes={(notes) => {
              patch(selected.id, { notes });
              startTransition(() => saveRequestNotes(selected.id, notes));
            }}
            onDelete={() => {
              if (!confirm(`Delete request ${selected.reference}? This cannot be undone.`)) return;
              const id = selected.id;
              setSelectedId(null);
              startTransition(() => removeRequest(id));
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

function RequestDetail({
  r,
  pending,
  onStatus,
  onNotes,
  onDelete,
}: {
  r: TrainingRequest;
  pending: boolean;
  onStatus: (s: RequestStatus) => void;
  onNotes: (n: string) => void;
  onDelete: () => void;
}) {
  const [notes, setNotes] = useState(r.notes);
  const wa = r.phone.replace(/[^\d]/g, "").replace(/^0/, "92");
  const rows: [string, string | null | undefined][] = [
    ["Reference", r.reference],
    ["Received", fmt(r.createdAt)],
    ["Type", REQUEST_TYPE_LABELS[r.type]],
    ["Program", r.programTitle],
    ["Format", r.format ? FORMAT_LABELS[r.format] : null],
    ["Participants", r.participants?.toString()],
    ["Preferred date", r.preferredDate ? day(r.preferredDate) : null],
    ...Object.entries(r.details),
    ["Contact", r.contactName],
    ["E-mail", r.email],
    ["Phone", r.phone],
    ["City", r.city],
  ];

  return (
    <div className="detail">
      <div className="detail__actions">
        <a className="btn btn--primary btn--sm" href={`mailto:${r.email}?subject=${encodeURIComponent(`Your Learning Impact request ${r.reference}`)}`}>
          <span className="btn__label">E-mail</span>
        </a>
        {r.phone && (
          <a className="btn btn--ghost btn--sm" href={`tel:${r.phone.replace(/\s/g, "")}`}>
            <span className="btn__label">Call</span>
          </a>
        )}
        {wa && (
          <a className="btn btn--ghost btn--sm" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
            <span className="btn__label">WhatsApp</span>
          </a>
        )}
      </div>

      <div className="detail__status">
        <span className="muted">Status</span>
        <div className="status-row">
          {REQUEST_STATUSES.map((s) => (
            <button key={s} className={`badge badge--${s} ${r.status === s ? "is-active" : "is-dim"}`} onClick={() => onStatus(s)} disabled={pending && r.status === s} aria-pressed={r.status === s}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <dl className="detail__list">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
      </dl>

      {r.message && (
        <div className="detail__message">
          <span className="muted">Message</span>
          <p>{r.message}</p>
        </div>
      )}

      <label className="field field--area">
        <textarea rows={4} placeholder=" " value={notes} onChange={(e) => setNotes(e.target.value)} />
        <span className="field__label">Internal notes</span>
        <span className="field__glow" aria-hidden="true" />
      </label>
      <div className="detail__foot">
        <button className="btn btn--ghost btn--sm btn--danger" onClick={onDelete}>
          <span className="btn__label">Delete request</span>
        </button>
        <button className="btn btn--primary btn--sm" onClick={() => onNotes(notes)} disabled={notes === r.notes}>
          <span className="btn__label">{notes === r.notes ? "Notes saved" : "Save notes"}</span>
        </button>
      </div>
    </div>
  );
}
