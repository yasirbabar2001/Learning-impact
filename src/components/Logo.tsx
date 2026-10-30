import { WORDMARK_PATH } from "./logo-path";

type Props = { className?: string; animated?: boolean; title?: string };

/** The Learning Impact wordmark with its gold swoosh, drawn as inline SVG so the swoosh can animate. */
export function Logo({ className, animated = true, title = "Learning Impact" }: Props) {
  return (
    <svg className={`logo ${animated ? "logo--animated" : ""} ${className ?? ""}`} viewBox="-2 0 320 70" role="img" aria-label={title}>
      <path fill="currentColor" d={WORDMARK_PATH} />
      <path className="logo__swoosh" d="M2 62 Q170 64 300 50" pathLength={1} stroke="#FFD23F" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle className="logo__dot" cx="304" cy="49" r="6" fill="#FFD23F" />
    </svg>
  );
}
