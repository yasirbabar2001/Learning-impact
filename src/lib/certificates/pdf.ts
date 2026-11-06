import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import QRCode from "qrcode";
import { WORDMARK_PATH } from "@/components/logo-path";
import { SITE_URL } from "../site";

const NAVY = rgb(13 / 255, 44 / 255, 102 / 255);
const GOLD = rgb(224 / 255, 168 / 255, 0);
const INK = rgb(0.17, 0.2, 0.26);
const GREY = rgb(0.42, 0.45, 0.5);
const RAINBOW = ["#ff4d6d", "#ff9f1c", "#ffd23f", "#2ee59d", "#00c2ff", "#7b61ff", "#ff4dd8"];

const hex = (h: string): RGB => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const font = (name: string) => readFileSync(path.join(process.cwd(), "assets", "fonts", name));

export type CertificateData = {
  code: string;
  holder: string;
  course: string;
  badge: string;
  color: string;
  percent: number;
  issuedAt: string;
};

function centered(page: PDFPage, text: string, f: PDFFont, size: number, y: number, color: RGB, spacing = 0) {
  const width = f.widthOfTextAtSize(text, size) + spacing * (text.length - 1);
  let x = (page.getWidth() - width) / 2;
  if (!spacing) return page.drawText(text, { x, y, size, font: f, color });
  for (const ch of text) {
    page.drawText(ch, { x, y, size, font: f, color });
    x += f.widthOfTextAtSize(ch, size) + spacing;
  }
}

/** Shrinks text until it fits the width. */
function fit(f: PDFFont, text: string, size: number, max: number) {
  let s = size;
  while (s > 12 && f.widthOfTextAtSize(text, s) > max) s -= 1;
  return s;
}

function band(page: PDFPage, y: number, h: number) {
  const w = page.getWidth() / RAINBOW.length;
  RAINBOW.forEach((c, i) => page.drawRectangle({ x: i * w, y, width: w + 0.5, height: h, color: hex(c) }));
}

export async function certificatePdf(d: CertificateData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`${d.course} certificate: ${d.holder}`);
  doc.setAuthor("Learning Impact (SMC-Private) Limited");
  doc.setSubject(`Certificate ${d.code}`);
  // Full fonts (not subsets): subsetting drops advance widths for some glyphs such as "-".
  const light = await doc.embedFont(font("outfit-latin-300-normal.ttf"), { subset: false, features: { calt: false, case: false } });
  const bold = await doc.embedFont(font("outfit-latin-700-normal.ttf"), { subset: false, features: { calt: false, case: false } });
  const body = await doc.embedFont(font("inter-latin-400-normal.ttf"), { subset: false, features: { calt: false, case: false } });
  const semi = await doc.embedFont(font("inter-latin-600-normal.ttf"), { subset: false, features: { calt: false, case: false } });

  const page = doc.addPage([842, 595]); // A4 landscape
  const W = page.getWidth();
  const accent = hex(d.color);

  // Frame, colour bands and a soft course-coloured corner.
  band(page, 589, 6);
  band(page, 0, 6);
  page.drawRectangle({ x: 22, y: 22, width: W - 44, height: 551, borderColor: NAVY, borderWidth: 0.8, borderOpacity: 0.25 });
  page.drawCircle({ x: W - 40, y: 555, size: 120, color: accent, opacity: 0.08 });
  page.drawCircle({ x: 40, y: 40, size: 90, color: GOLD, opacity: 0.07 });

  // Logo: wordmark and gold swoosh, drawn as vectors.
  const scale = 0.62;
  const lx = (W - 318 * scale) / 2;
  page.drawSvgPath(WORDMARK_PATH, { x: lx, y: 548, scale, color: NAVY });
  page.drawSvgPath("M2 62 Q170 64 300 50", { x: lx, y: 548, scale, borderColor: GOLD, borderWidth: 4 * scale });
  page.drawCircle({ x: lx + 304 * scale, y: 548 - 49 * scale, size: 6 * scale, color: GOLD });
  centered(page, "(SMC-PRIVATE) LIMITED", semi, 6.5, 498, NAVY, 1.4);

  centered(page, "CERTIFICATE OF ACHIEVEMENT", semi, 11, 455, GOLD, 3.2);
  centered(page, "This certifies that", body, 12, 420, GREY);
  const nameSize = fit(bold, d.holder, 40, W - 160);
  centered(page, d.holder, bold, nameSize, 368, NAVY);
  page.drawLine({ start: { x: W / 2 - 170, y: 356 }, end: { x: W / 2 + 170, y: 356 }, thickness: 1, color: accent, opacity: 0.7 });
  centered(page, "has successfully completed the professional certification", body, 12, 328, GREY);
  const courseSize = fit(light, d.course, 30, W - 160);
  centered(page, d.course, light, courseSize, 288, INK);
  centered(page, `Final exam score ${d.percent}%  ·  Quest badge: ${d.badge}`, semi, 11, 256, NAVY);

  // Footer: date, signature, QR and code.
  const issued = new Date(d.issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  page.drawText("Date of issue", { x: 80, y: 128, size: 9, font: body, color: GREY });
  page.drawText(issued, { x: 80, y: 110, size: 13, font: semi, color: INK });
  page.drawText("Certificate code", { x: 80, y: 84, size: 9, font: body, color: GREY });
  page.drawText(d.code, { x: 80, y: 66, size: 13, font: semi, color: NAVY });

  page.drawLine({ start: { x: W / 2 - 100, y: 112 }, end: { x: W / 2 + 100, y: 112 }, thickness: 0.8, color: INK, opacity: 0.6 });
  centered(page, "Authorised signatory", body, 9, 96, GREY);
  centered(page, "Learning Impact (SMC-Private) Limited", semi, 10, 80, NAVY);

  const url = `${SITE_URL}/verify/${d.code}`;
  const qr = await doc.embedPng(await QRCode.toBuffer(url, { margin: 1, width: 300, color: { dark: "#0d2c66", light: "#ffffff" } }));
  page.drawImage(qr, { x: W - 80 - 86, y: 62, width: 86, height: 86 });
  const verify = "Scan or visit to verify";
  page.drawText(verify, { x: W - 80 - 43 - body.widthOfTextAtSize(verify, 8) / 2, y: 50, size: 8, font: body, color: GREY });
  const host = `${SITE_URL.replace(/^https?:\/\//, "")}/verify`;
  page.drawText(host, { x: W - 80 - 43 - body.widthOfTextAtSize(host, 8) / 2, y: 39, size: 8, font: body, color: NAVY });

  return doc.save();
}
