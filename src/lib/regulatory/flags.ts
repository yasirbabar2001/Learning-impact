import "server-only";
import * as FLAGS from "country-flag-icons/string/3x2";

/** The national flag of a jurisdiction as an SVG string (from the country-flag-icons package), or null. */
export function flagSvg(code: string): string | null {
  const svg = (FLAGS as unknown as Record<string, string>)[code.toUpperCase()];
  return typeof svg === "string" ? svg : null;
}
