import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Short human-friendly reference such as LI-2610-7F3K (year, month, random). */
export function makeReference(date = new Date()): string {
  const yy = String(date.getUTCFullYear()).slice(2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const bytes = randomBytes(4);
  const code = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `LI-${yy}${mm}-${code}`;
}

export function byProgramOrder<T extends { sort: number; title: string }>(a: T, b: T) {
  return a.sort - b.sort || a.title.localeCompare(b.title);
}
