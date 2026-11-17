/** Key takeaways as highlighted chips whose colours glide through the brand palette, one after another. */
export function Takeaways({ items, className = "" }: { items: string[] | undefined; className?: string }) {
  if (!items?.length) return null;
  return (
    <ul className={`takeaways ${className}`} aria-label="Key takeaways">
      {items.map((t, i) => (
        <li key={t} className="takeaway" style={{ ["--i" as string]: i }}>
          <span className="takeaway__tick" aria-hidden="true">
            ✓
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}
