/**
 * A course's title picture: an uploaded photo when there is one, otherwise the illustrated scene served as a cached
 * image from /cover-art/<slug>.svg (drawn at build time by scripts/build-covers.mjs) (kept out of the page itself so pages stay light). Regulatory quests get their flag.
 */
export function CourseCover({
  slug,
  flag = null,
  label,
  className = "",
  image = null,
  priority = false,
}: {
  slug: string;
  /** Kept for callers that pass the course colour; the artwork reads it on the server. */
  color?: string;
  /** Flag SVG markup for regulatory quests (from flagSvg). */
  flag?: string | null;
  label: string;
  className?: string;
  /** No longer needed (the artwork is an image); accepted for compatibility. */
  idSuffix?: string;
  /** Uploaded or bundled title picture; when set it replaces the drawn artwork. */
  image?: string | null;
  /** Load straight away (the main picture at the top of a page) instead of when scrolled into view. */
  priority?: boolean;
}) {
  return (
    <span className={`cover ${image ? "cover--photo" : ""} ${className}`} {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image ?? `/cover-art/${slug}.svg`}
        alt=""
        width={1200}
        height={630}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...(priority ? { fetchPriority: "high" as const } : {})}
      />
      {flag && <span className="cover__flag" dangerouslySetInnerHTML={{ __html: flag }} />}
    </span>
  );
}
