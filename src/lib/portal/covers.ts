import "server-only";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Course title pictures. An administrator can upload one per course (Admin › Certifications / Regulatory library);
 * it is kept in DATA_DIR/covers so it survives redeploys. A picture shipped with the site in public/covers/<slug>.jpg
 * is used when nothing was uploaded. Without either, the drawn topic artwork is shown.
 */
const DIR = () => path.join(/*turbopackIgnore: true*/ process.env.DATA_DIR || path.join(process.cwd(), ".data"), "covers");
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const MAX_COVER_BYTES = 5 * 1024 * 1024;
const SLUG = /^[a-z0-9-]{2,80}$/;

function uploaded(slug: string): string | null {
  if (!SLUG.test(slug)) return null;
  try {
    const f = readdirSync(/*turbopackIgnore: true*/ DIR()).find((n) => n.startsWith(`${slug}.`) && /\.(jpg|png|webp)$/.test(n));
    return f ? path.join(DIR(), f) : null;
  } catch {
    return null;
  }
}

/** URL of the course's picture, or null when the drawn artwork should be used. */
export function coverUrl(slug: string): string | null {
  const file = uploaded(slug);
  if (file) return `/covers/${slug}?v=${Math.round(statSync(/*turbopackIgnore: true*/ file).mtimeMs)}`;
  if (SLUG.test(slug) && existsSync(/*turbopackIgnore: true*/ path.join(process.cwd(), "public", "covers", `${slug}.jpg`))) return `/covers/${slug}.jpg`;
  return null;
}

export function readCover(slug: string): { bytes: Buffer; type: string } | null {
  const file = uploaded(slug);
  if (!file) return null;
  const ext = file.split(".").pop()!;
  return { bytes: readFileSync(/*turbopackIgnore: true*/ file), type: Object.entries(TYPES).find(([, e]) => e === ext)![0] };
}

/** Checks the image really is a JPEG, PNG or WebP (magic bytes) and stores it as the course's picture. */
export function saveCover(slug: string, bytes: Buffer, mime: string): string | null {
  const ext = TYPES[mime];
  if (!SLUG.test(slug)) return "Unknown course.";
  if (!ext) return "Use a JPG, PNG or WebP picture.";
  if (bytes.length === 0 || bytes.length > MAX_COVER_BYTES) return "The picture must be smaller than 5 MB.";
  const sig = bytes.subarray(0, 12);
  const ok =
    (ext === "jpg" && sig[0] === 0xff && sig[1] === 0xd8) ||
    (ext === "png" && sig.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ||
    (ext === "webp" && sig.subarray(0, 4).toString() === "RIFF" && sig.subarray(8, 12).toString() === "WEBP");
  if (!ok) return "That file is not a valid picture.";
  removeCover(slug);
  mkdirSync(/*turbopackIgnore: true*/ DIR(), { recursive: true });
  writeFileSync(path.join(/*turbopackIgnore: true*/ DIR(), `${slug}.${ext}`), bytes);
  return null;
}

export function removeCover(slug: string) {
  let f: string | null;
  while ((f = uploaded(slug))) unlinkSync(/*turbopackIgnore: true*/ f);
}
