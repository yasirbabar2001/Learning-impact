/** Renders a flag SVG produced on the server by flagSvg(); the markup comes from a bundled package, not from users. */
export function Flag({ svg, label, className = "flag" }: { svg: string | null; label: string; className?: string }) {
  if (!svg) return null;
  return <span className={className} role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />;
}
