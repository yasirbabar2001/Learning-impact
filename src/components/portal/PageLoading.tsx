/** Shown the instant a link is clicked, while the next page loads from the server. */
export function PageLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="page-loading container" role="status" aria-live="polite">
      <div className="page-loading__bar" aria-hidden="true" />
      <div className="page-loading__hero skeleton" />
      <div className="page-loading__grid">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <span className="sr-only">{label}…</span>
    </div>
  );
}
