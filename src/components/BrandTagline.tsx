import { TAGLINE } from "@/lib/site";

/** "Learn Today. Lead Tomorrow. Transform Forever." under the logo: one line in the footer, two in the header, three on phones. */
export function BrandTagline({ className = "" }: { className?: string }) {
  return (
    <span className={`brand__tagline ${className}`}>
      <span>{TAGLINE[0]}</span> <span>{TAGLINE[1]}</span> <span>{TAGLINE[2]}</span>
    </span>
  );
}
