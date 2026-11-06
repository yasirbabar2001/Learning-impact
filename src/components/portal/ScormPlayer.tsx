"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export type ScormResult = { score: number; total: number; passed: boolean; xp: number };
type Result = ScormResult;

/**
 * Minimal SCORM 1.2 runtime (window.API) for the stage-test package shown in the iframe. On commit it
 * sends the learner's responses to the server, which grades them and records progress.
 */
export function ScormPlayer({
  slug,
  sid,
  pass,
  nextHref,
  examHref,
  mapHref,
  onResult,
}: {
  slug: string;
  sid: string;
  pass: number;
  nextHref: string | null;
  examHref: string | null;
  mapHref: string;
  onResult: (r: ScormResult) => void;
}) {
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const cmi = useRef<Record<string, string>>({});
  const sent = useRef(false);
  // Kept in a ref: the SCORM session must only restart on a retake, never because the parent re-rendered.
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    cmi.current = { "cmi.core.lesson_status": "not attempted", "cmi.core.student_name": "", "cmi.core.lesson_mode": "normal" };
    sent.current = false;
    let lastError = "0";

    const commit = async () => {
      const status = cmi.current["cmi.core.lesson_status"];
      if (sent.current || (status !== "passed" && status !== "failed")) return;
      sent.current = true;
      const responses: (number | null)[] = [];
      for (let n = 0; ; n++) {
        const id = cmi.current[`cmi.interactions.${n}.id`];
        if (id === undefined) break;
        const r = Number(cmi.current[`cmi.interactions.${n}.student_response`]);
        responses.push(Number.isInteger(r) ? r : null);
      }
      try {
        const res = await fetch(`/api/scorm/${slug}/${sid}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ responses }) });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as Result;
        setResult(data);
        onResultRef.current(data);
      } catch {
        setError("Your result could not be saved. Check your connection and retake the test.");
      }
    };

    const api = {
      LMSInitialize: () => "true",
      LMSFinish: () => {
        void commit();
        return "true";
      },
      LMSGetValue: (k: string) => cmi.current[k] ?? "",
      LMSSetValue: (k: string, v: string) => {
        cmi.current[k] = String(v);
        return "true";
      },
      LMSCommit: () => {
        void commit();
        return "true";
      },
      LMSGetLastError: () => lastError,
      LMSGetErrorString: () => "",
      LMSGetDiagnostic: () => "",
    };
    lastError = "0";
    (window as unknown as { API: typeof api }).API = api;
    return () => {
      delete (window as unknown as { API?: typeof api }).API;
    };
  }, [run, slug, sid]);

  return (
    <div className="scorm">
      <div className="scorm__head">
        <span className="tag">SCORM 1.2 stage test</span>
        <span className="muted">10 questions · {pass}/10 to pass · retakes allowed</span>
      </div>
      {result && (
        <motion.div className={`scorm__result glass ${result.passed ? "is-pass" : "is-fail"}`} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <strong>
            {result.passed ? "🎉 Stage cleared" : "Not yet"}: {result.score}/{result.total}
            {result.xp > 0 ? ` · +${result.xp} XP` : ""}
          </strong>
          <div className="lesson__actions">
            {result.passed && (nextHref || examHref) && (
              <Link href={(nextHref || examHref)!} className="btn btn--primary btn--sm">
                <span className="btn__label">{nextHref ? "Next stage" : "Face the final boss"}</span>
                <span className="btn__arrow">→</span>
              </Link>
            )}
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setResult(null);
                setRun((r) => r + 1);
              }}
            >
              <span className="btn__label">Retake</span>
            </button>
            <Link href={mapHref} className="btn btn--ghost btn--sm">
              <span className="btn__label">Quest map</span>
            </Link>
          </div>
        </motion.div>
      )}
      {error && <p className="form-alert">{error}</p>}
      <iframe key={run} className="scorm__frame" src={`/scorm/${slug}/${sid}/index.html`} title="Stage test" />
    </div>
  );
}
