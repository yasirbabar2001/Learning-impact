import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { degrees, PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import type { Card, Course, Session } from "../courses/schema";

/**
 * Builds a downloadable 16:9 presentation (PDF) for one stage from its content: title, goals, the opening scene
 * as a comic strip, every mini-movie and diagram drawn as shapes, the reading cards as bullet slides, key terms,
 * key take-aways and a closing reflection.
 */

const W = 960;
const H = 540;
const M = 48; // page margin
const INK = rgb(0.1, 0.11, 0.16);
const GREY = rgb(0.4, 0.42, 0.48);
const LIGHT = rgb(0.95, 0.96, 0.98);
const WHITE = rgb(1, 1, 1);
const RAINBOW = ["#ff4d6d", "#ff9f1c", "#ffd23f", "#2ee59d", "#00c2ff", "#7b61ff", "#ff4dd8"];
const PALETTE = ["#ff4d6d", "#ff9f1c", "#e6b800", "#22c58b", "#00a8e0", "#7b61ff", "#e040c0", "#7fbf3f"];

const hex = (h: string): RGB => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const tint = (c: RGB, k: number): RGB => rgb(c.red + (1 - c.red) * k, c.green + (1 - c.green) * k, c.blue + (1 - c.blue) * k);
const fontFile = (name: string) => readFileSync(path.join(process.cwd(), "assets", "fonts", name));

type Fonts = { head: PDFFont; bold: PDFFont; body: PDFFont; light: PDFFont };

/** The embedded fonts cover Latin text; map common symbols and drop anything they cannot draw (e.g. emoji). */
function clean(text: string, f: PDFFont, keepSpaces = false): string {
  const map: Record<string, string> = { "→": "->", "←": "<-", "≈": "~", "≥": ">=", "≤": "<=", "✓": "", "✗": "x", "×": "x", "−": "-", "⇒": "=>", "₹": "INR " };
  const supported = new Set(f.getCharacterSet());
  let out = "";
  for (const ch of text) {
    const m = map[ch] ?? ch;
    for (const c of m) if (supported.has(c.codePointAt(0)!) || c === " ") out += c;
  }
  return keepSpaces ? out.replace(/\s+$/, "") : out.replace(/\s+/g, " ").trim();
}

/** Strips markdown emphasis, links and code ticks. */
const plain = (s: string) =>
  s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#+\s*/, "")
    .trim();

function wrap(text: string, f: PDFFont, size: number, max: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (f.widthOfTextAtSize(next, size) <= max || !line) line = next;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Draws wrapped text inside a box, shrinking the size until it fits. Returns the height used. */
function textBox(page: PDFPage, raw: string, o: { x: number; y: number; w: number; h: number; f: PDFFont; size: number; min?: number; color?: RGB; lineGap?: number; center?: boolean }): number {
  const text = clean(raw, o.f);
  let size = o.size;
  let lines = wrap(text, o.f, size, o.w);
  const lh = (s: number) => s * (o.lineGap ?? 1.3);
  while (lines.length * lh(size) > o.h && size > (o.min ?? 9)) {
    size -= 0.5;
    lines = wrap(text, o.f, size, o.w);
  }
  const maxLines = Math.max(1, Math.floor(o.h / lh(size)));
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "") + "...";
  }
  lines.forEach((l, i) => {
    const lw = o.f.widthOfTextAtSize(l, size);
    page.drawText(l, { x: o.center ? o.x + (o.w - lw) / 2 : o.x, y: o.y - size - i * lh(size) + size * 0.2, size, font: o.f, color: o.color ?? INK });
  });
  return lines.length * lh(size);
}

type Ctx = { doc: PDFDocument; fonts: Fonts; color: RGB; course: Course; session: Session; stageNo: number; n: number };

/** A new slide with the brand frame: rainbow band, footer and slide number. */
function slide(c: Ctx, kicker: string, title?: string): PDFPage {
  const page = c.doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: WHITE });
  const bw = W / RAINBOW.length;
  RAINBOW.forEach((col, i) => page.drawRectangle({ x: i * bw, y: H - 8, width: bw + 0.5, height: 8, color: hex(col) }));
  page.drawRectangle({ x: 0, y: 0, width: W, height: 30, color: LIGHT });
  c.n += 1;
  const foot = clean(`Learning Impact  |  ${c.course.title}  |  Stage ${c.stageNo}: ${c.session.stage}`, c.fonts.body);
  page.drawText(foot, { x: M, y: 11, size: 9, font: c.fonts.body, color: GREY });
  page.drawText(String(c.n), { x: W - M - c.fonts.bold.widthOfTextAtSize(String(c.n), 10), y: 11, size: 10, font: c.fonts.bold, color: c.color });
  page.drawText(clean(kicker.toUpperCase(), c.fonts.bold), { x: M, y: H - 52, size: 11, font: c.fonts.bold, color: c.color });
  if (title) textBox(page, title, { x: M, y: H - 60, w: W - 2 * M, h: 70, f: c.fonts.head, size: 30, min: 18 });
  return page;
}

const BODY_TOP = H - 140;

/** Markdown body -> bullet items (lists, table rows and paragraphs); code blocks kept together. */
function bullets(md: string): { text: string; code?: boolean }[] {
  const out: { text: string; code?: boolean }[] = [];
  let code: string[] | null = null;
  for (const raw of md.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("```")) {
      if (code) {
        out.push({ text: code.join("\n"), code: true });
        code = null;
      } else code = [];
      continue;
    }
    if (code) {
      code.push(raw);
      continue;
    }
    if (!line || /^\|?\s*:?-{2,}/.test(line)) continue;
    if (line.startsWith("|")) {
      const cells = line
        .split("|")
        .map((s) => plain(s))
        .filter(Boolean);
      if (cells.length) out.push({ text: cells.join("  |  ") });
      continue;
    }
    const item = line.replace(/^([-*+]|\d+[.)])\s+/, "");
    out.push({ text: plain(item) });
  }
  if (code) out.push({ text: code.join("\n"), code: true });
  return out;
}

function bulletSlide(c: Ctx, kicker: string, title: string, md: string, accent: "concept" | "case" | "tip") {
  const page = slide(c, kicker, title);
  const items = bullets(md).slice(0, 9);
  const icon = { concept: "i", case: "C", tip: "!" }[accent];
  // a coloured badge on the right as a visual anchor
  page.drawCircle({ x: W - M - 34, y: H - 92, size: 26, color: tint(c.color, 0.75) });
  page.drawText(icon, { x: W - M - 34 - c.fonts.head.widthOfTextAtSize(icon, 24) / 2, y: H - 100, size: 24, font: c.fonts.head, color: c.color });
  let y = BODY_TOP;
  const per = Math.max(34, (BODY_TOP - 50) / Math.max(1, items.length));
  for (const it of items) {
    if (y < 60) break;
    if (it.code) {
      const lines = it.text.split("\n").slice(0, 14);
      const h = Math.min(y - 50, lines.length * 13 + 16);
      page.drawRectangle({ x: M, y: y - h, width: W - 2 * M, height: h, color: LIGHT, borderColor: tint(c.color, 0.5), borderWidth: 1 });
      lines.forEach((l, i) => page.drawText(clean(l.replace(/\t/g, "  "), c.fonts.body, true).slice(0, 130), { x: M + 12, y: y - 18 - i * 13, size: 10, font: c.fonts.body, color: INK }));
      y -= h + 12;
      continue;
    }
    page.drawCircle({ x: M + 7, y: y - 10, size: 5, color: c.color });
    const used = textBox(page, it.text, { x: M + 24, y, w: W - 2 * M - 30, h: Math.min(per, y - 50), f: c.fonts.body, size: 17, min: 11 });
    y -= Math.max(used, 18) + 10;
  }
}

/* ---------- Diagrams ---------- */

type Diagram = Extract<Card, { type: "diagram" }>;

function diagramSlide(c: Ctx, d: Diagram) {
  const page = slide(c, "Visual", d.title);
  let top = BODY_TOP;
  if (d.caption) top -= textBox(page, d.caption, { x: M, y: top + 4, w: W - 2 * M, h: 40, f: c.fonts.light, size: 14, min: 10, color: GREY }) + 6;
  const area = { x: M, y: 46, w: W - 2 * M, h: top - 46 };
  const items = d.items;
  const col = (i: number) => hex(PALETTE[i % PALETTE.length]);
  const { bold, body } = c.fonts;

  switch (d.kind) {
    case "steps":
    case "timeline": {
      const n = items.length;
      const gap = 12;
      const bw = (area.w - gap * (n - 1)) / n;
      const lineY = area.y + area.h * 0.62;
      if (d.kind === "timeline") page.drawRectangle({ x: area.x, y: lineY - 2, width: area.w, height: 4, color: tint(c.color, 0.5) });
      items.forEach((it, i) => {
        const x = area.x + i * (bw + gap);
        if (d.kind === "steps") {
          page.drawRectangle({ x, y: area.y + 10, width: bw, height: area.h - 20, color: tint(col(i), 0.85), borderColor: col(i), borderWidth: 1.5 });
          page.drawCircle({ x: x + 22, y: area.y + area.h - 32, size: 14, color: col(i) });
          page.drawText(String(i + 1), { x: x + 22 - bold.widthOfTextAtSize(String(i + 1), 13) / 2, y: area.y + area.h - 37, size: 13, font: bold, color: WHITE });
          textBox(page, it.label, { x: x + 10, y: area.y + area.h - 56, w: bw - 20, h: 54, f: bold, size: 14, min: 9 });
          if (it.detail) textBox(page, it.detail, { x: x + 10, y: area.y + area.h - 116, w: bw - 20, h: area.h - 140, f: body, size: 11.5, min: 8, color: GREY });
          if (i < n - 1) page.drawText(">", { x: x + bw + 1, y: area.y + area.h / 2, size: 12, font: bold, color: c.color });
        } else {
          page.drawCircle({ x: x + bw / 2, y: lineY, size: 9, color: col(i) });
          if (it.value) textBox(page, it.value, { x, y: lineY + 44, w: bw, h: 20, f: bold, size: 14, min: 9, color: col(i), center: true });
          textBox(page, it.label, { x, y: lineY - 16, w: bw, h: 36, f: bold, size: 12.5, min: 8, center: true });
          if (it.detail) textBox(page, it.detail, { x, y: lineY - 56, w: bw, h: lineY - 56 - area.y, f: body, size: 10.5, min: 7.5, color: GREY, center: true });
        }
      });
      break;
    }
    case "cycle": {
      const cx = area.x + area.w * 0.32;
      const cy = area.y + area.h / 2;
      const R = Math.min(area.h / 2 - 34, 150);
      page.drawCircle({ x: cx, y: cy, size: R, borderColor: tint(c.color, 0.4), borderWidth: 3 });
      const n = items.length;
      items.forEach((it, i) => {
        const a = (i / n) * Math.PI * 2 + Math.PI / 2;
        const x = cx + Math.cos(a) * R;
        const y = cy + Math.sin(a) * R;
        page.drawCircle({ x, y, size: 30, color: col(i) });
        textBox(page, it.label, { x: x - 30, y: y + 14, w: 60, h: 30, f: bold, size: 9.5, min: 7, color: WHITE, center: true });
      });
      // the legend with details on the right
      let y = area.y + area.h - 4;
      const lx = area.x + area.w * 0.62;
      items.forEach((it, i) => {
        page.drawCircle({ x: lx + 8, y: y - 8, size: 7, color: col(i) });
        const used = textBox(page, `${it.label}${it.detail ? `: ${it.detail}` : ""}`, { x: lx + 22, y, w: area.x + area.w - lx - 22, h: area.h / n, f: body, size: 12, min: 8 });
        y -= Math.max(used, 16) + 6;
      });
      break;
    }
    case "pyramid":
    case "funnel": {
      const n = items.length;
      const rowH = Math.min(52, (area.h - 8 * (n - 1)) / n);
      const shapeW = area.w * 0.55;
      items.forEach((it, i) => {
        const frac = d.kind === "pyramid" ? 0.35 + (0.65 * (i + 1)) / n : 1 - (0.55 * i) / Math.max(1, n - 1);
        const w = shapeW * frac;
        const y = area.y + area.h - (i + 1) * rowH - i * 8;
        const x = area.x + (shapeW - w) / 2;
        page.drawRectangle({ x, y, width: w, height: rowH, color: col(i) });
        textBox(page, `${it.label}${it.value ? `  ${it.value}` : ""}`, { x: x + 6, y: y + rowH - (rowH - 16) / 2 + 2, w: w - 12, h: 18, f: bold, size: 13, min: 7, color: WHITE, center: true });
        if (it.detail) textBox(page, it.detail, { x: area.x + shapeW + 24, y: y + rowH - 4, w: area.w - shapeW - 24, h: rowH, f: body, size: 11.5, min: 7.5, color: GREY });
      });
      break;
    }
    case "matrix": {
      const gx = area.x + 30;
      const gy = area.y + 22;
      const cw = (area.w - 40) / 2;
      const ch = (area.h - 30) / 2;
      const order = [0, 1, 2, 3];
      order.forEach((k) => {
        const it = items[k];
        if (!it) return;
        const x = gx + (k % 2) * cw;
        const y = gy + (k < 2 ? ch : 0);
        page.drawRectangle({ x: x + 4, y: y + 4, width: cw - 8, height: ch - 8, color: tint(col([0, 3, 1, 4][k]), 0.82), borderColor: col([0, 3, 1, 4][k]), borderWidth: 1.5 });
        textBox(page, it.label, { x: x + 16, y: y + ch - 14, w: cw - 32, h: 22, f: bold, size: 15, min: 9 });
        if (it.detail) textBox(page, it.detail, { x: x + 16, y: y + ch - 42, w: cw - 32, h: ch - 54, f: body, size: 11.5, min: 8, color: GREY });
      });
      if (d.axes?.x) page.drawText(clean(`${d.axes.x} ->`, body), { x: gx + cw - 40, y: area.y + 4, size: 11, font: bold, color: c.color });
      if (d.axes?.y) page.drawText(clean(`${d.axes.y} ->`, body), { x: area.x + 14, y: gy + 10, size: 11, font: bold, color: c.color, rotate: degrees(90) });
      break;
    }
    case "compare": {
      const labelW = area.w * 0.22;
      const colW = (area.w - labelW - 16) / 2;
      const head = d.headers ?? ["", ""];
      const rowH = Math.min(58, (area.h - 40) / Math.max(1, items.length));
      [0, 1].forEach((k) => {
        const x = area.x + labelW + 8 + k * (colW + 8);
        page.drawRectangle({ x, y: area.y + area.h - 30, width: colW, height: 30, color: k === 0 ? hex("#ff4d6d") : hex("#22c58b") });
        textBox(page, head[k], { x: x + 8, y: area.y + area.h - 7, w: colW - 16, h: 18, f: bold, size: 13, min: 8, color: WHITE, center: true });
      });
      items.forEach((it, i) => {
        const y = area.y + area.h - 38 - (i + 1) * rowH;
        if (i % 2 === 0) page.drawRectangle({ x: area.x, y, width: area.w, height: rowH, color: LIGHT });
        textBox(page, it.label, { x: area.x + 6, y: y + rowH - 6, w: labelW - 8, h: rowH - 8, f: bold, size: 12, min: 8 });
        textBox(page, it.left ?? "", { x: area.x + labelW + 14, y: y + rowH - 6, w: colW - 12, h: rowH - 8, f: body, size: 11.5, min: 7.5 });
        textBox(page, it.right ?? "", { x: area.x + labelW + colW + 22, y: y + rowH - 6, w: colW - 12, h: rowH - 8, f: body, size: 11.5, min: 7.5 });
      });
      break;
    }
    case "stats": {
      const n = items.length;
      const perRow = n <= 3 ? n : n === 4 ? 2 : 3;
      const rows = Math.ceil(n / perRow);
      const gap = 14;
      const tw = (area.w - gap * (perRow - 1)) / perRow;
      const th = (area.h - gap * (rows - 1)) / rows;
      items.forEach((it, i) => {
        const r = Math.floor(i / perRow);
        const x = area.x + (i % perRow) * (tw + gap);
        const y = area.y + area.h - (r + 1) * th - r * gap;
        page.drawRectangle({ x, y, width: tw, height: th, color: tint(col(i), 0.86), borderColor: col(i), borderWidth: 1.5 });
        textBox(page, it.value ?? "", { x: x + 14, y: y + th - 10, w: tw - 28, h: 44, f: c.fonts.head, size: 34, min: 14, color: col(i) });
        textBox(page, it.label, { x: x + 14, y: y + th - 58, w: tw - 28, h: 34, f: bold, size: 13, min: 8 });
        if (it.detail) textBox(page, it.detail, { x: x + 14, y: y + th - 92, w: tw - 28, h: th - 100, f: body, size: 10.5, min: 7.5, color: GREY });
      });
      break;
    }
  }
}

/* ---------- Other slide types ---------- */

function titleSlide(c: Ctx) {
  const page = c.doc.addPage([W, H]);
  c.n += 1;
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.03, 0.03, 0.05) });
  // floating colour orbs
  RAINBOW.forEach((col, i) => page.drawCircle({ x: 120 + i * 130, y: 70 + ((i * 97) % 380), size: 70 + (i % 3) * 30, color: hex(col), opacity: 0.18 }));
  const bw = W / RAINBOW.length;
  RAINBOW.forEach((col, i) => page.drawRectangle({ x: i * bw, y: H - 10, width: bw + 0.5, height: 10, color: hex(col) }));
  page.drawText(clean(`${c.course.title.toUpperCase()}`, c.fonts.bold), { x: M, y: H - 110, size: 14, font: c.fonts.bold, color: c.color });
  textBox(page, `Stage ${c.stageNo}: ${c.session.stage}`, { x: M, y: H - 130, w: W - 2 * M, h: 110, f: c.fonts.head, size: 46, min: 26, color: WHITE });
  textBox(page, c.session.title, { x: M, y: H - 250, w: W - 2 * M, h: 70, f: c.fonts.light, size: 24, min: 14, color: rgb(0.85, 0.86, 0.9) });
  textBox(page, `Quest: ${c.course.quest.name}`, { x: M, y: 120, w: W - 2 * M, h: 24, f: c.fonts.bold, size: 14, min: 10, color: hex("#ffd23f") });
  page.drawText("Learning Impact  |  learningimpact.pk", { x: M, y: 60, size: 12, font: c.fonts.body, color: rgb(0.7, 0.72, 0.78) });
}

function goalsSlide(c: Ctx) {
  const page = slide(c, "Your mission", "By the end of this stage you will be able to");
  const items = c.session.objectives.slice(0, 6);
  const rowH = Math.min(62, (BODY_TOP - 60) / items.length);
  items.forEach((o, i) => {
    const y = BODY_TOP - i * rowH;
    page.drawCircle({ x: M + 18, y: y - 14, size: 17, color: hex(PALETTE[i % PALETTE.length]) });
    page.drawText(String(i + 1), { x: M + 18 - c.fonts.bold.widthOfTextAtSize(String(i + 1), 15) / 2, y: y - 19, size: 15, font: c.fonts.bold, color: WHITE });
    textBox(page, o, { x: M + 50, y: y - 2, w: W - 2 * M - 60, h: rowH - 8, f: c.fonts.body, size: 17, min: 11 });
  });
}

function sceneSlide(c: Ctx, card: Extract<Card, { type: "story" }>) {
  const page = slide(c, "The scene", card.title);
  textBox(page, card.setting, { x: M, y: BODY_TOP + 6, w: W - 2 * M, h: 22, f: c.fonts.light, size: 13, min: 9, color: GREY });
  const lines = card.lines.slice(0, 4);
  const people = new Map(c.course.quest.cast.map((p) => [p.id, p]));
  const gap = 14;
  const pw = (W - 2 * M - gap * (lines.length - 1)) / lines.length;
  const top = BODY_TOP - 30;
  const ph = top - 50;
  lines.forEach((l, i) => {
    const x = M + i * (pw + gap);
    const who = people.get(l.who);
    const col = who ? hex(who.look.color) : hex("#ffd23f");
    page.drawRectangle({ x, y: 50, width: pw, height: ph, color: tint(col, 0.88), borderColor: col, borderWidth: 2 });
    if (who) {
      const initials = who.name
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0])
        .join("");
      page.drawCircle({ x: x + 34, y: top - 36, size: 22, color: col });
      page.drawText(clean(initials, c.fonts.bold), { x: x + 34 - c.fonts.bold.widthOfTextAtSize(clean(initials, c.fonts.bold), 14) / 2, y: top - 41, size: 14, font: c.fonts.bold, color: WHITE });
      textBox(page, who.name, { x: x + 64, y: top - 22, w: pw - 72, h: 18, f: c.fonts.bold, size: 12, min: 8 });
      textBox(page, who.role, { x: x + 64, y: top - 38, w: pw - 72, h: 26, f: c.fonts.body, size: 9, min: 7, color: GREY });
    } else page.drawText("Narrator", { x: x + 14, y: top - 32, size: 12, font: c.fonts.bold, color: col });
    page.drawRectangle({ x: x + 10, y: 62, width: pw - 20, height: ph - 86, color: WHITE });
    textBox(page, `"${l.text}"`, { x: x + 20, y: 62 + ph - 98, w: pw - 40, h: ph - 104, f: c.fonts.body, size: 13, min: 8 });
  });
}

function movieSlide(c: Ctx, card: Extract<Card, { type: "explainer" }>) {
  const page = slide(c, "Mini-movie", card.title);
  const scenes = card.scenes;
  const n = scenes.length;
  const perRow = n <= 3 ? n : Math.ceil(n / 2);
  const rows = Math.ceil(n / perRow);
  const gap = 14;
  const bw = (W - 2 * M - gap * (perRow - 1)) / perRow;
  const bh = (BODY_TOP - 50 - gap * (rows - 1)) / rows;
  scenes.forEach((s, i) => {
    const r = Math.floor(i / perRow);
    const x = M + (i % perRow) * (bw + gap);
    const y = BODY_TOP - (r + 1) * bh - r * gap;
    const col = hex(PALETTE[i % PALETTE.length]);
    page.drawRectangle({ x, y, width: bw, height: bh, color: tint(col, 0.88), borderColor: col, borderWidth: 1.5 });
    page.drawCircle({ x: x + 20, y: y + bh - 20, size: 12, color: col });
    page.drawText(String(i + 1), { x: x + 20 - c.fonts.bold.widthOfTextAtSize(String(i + 1), 12) / 2, y: y + bh - 24, size: 12, font: c.fonts.bold, color: WHITE });
    textBox(page, s.heading, { x: x + 40, y: y + bh - 10, w: bw - 50, h: 36, f: c.fonts.bold, size: 14, min: 9 });
    textBox(page, s.narration, { x: x + 14, y: y + bh - 50, w: bw - 28, h: bh - 60, f: c.fonts.body, size: 11.5, min: 8, color: rgb(0.2, 0.22, 0.28) });
  });
}

function termsSlide(c: Ctx, title: string, cards: { front: string; back: string }[]) {
  const page = slide(c, "Key terms", title);
  const n = Math.min(cards.length, 8);
  const perRow = n <= 4 ? 2 : 2;
  const rows = Math.ceil(n / perRow);
  const gap = 12;
  const bw = (W - 2 * M - gap) / perRow;
  const bh = (BODY_TOP - 50 - gap * (rows - 1)) / rows;
  cards.slice(0, n).forEach((t, i) => {
    const r = Math.floor(i / perRow);
    const x = M + (i % perRow) * (bw + gap);
    const y = BODY_TOP - (r + 1) * bh - r * gap;
    page.drawRectangle({ x, y, width: 8, height: bh, color: hex(PALETTE[i % PALETTE.length]) });
    page.drawRectangle({ x: x + 8, y, width: bw - 8, height: bh, color: LIGHT });
    textBox(page, t.front, { x: x + 20, y: y + bh - 8, w: bw - 32, h: Math.min(36, bh / 2), f: c.fonts.bold, size: 13.5, min: 8 });
    textBox(page, t.back, { x: x + 20, y: y + bh - 8 - Math.min(36, bh / 2), w: bw - 32, h: bh - Math.min(36, bh / 2) - 12, f: c.fonts.body, size: 11.5, min: 7.5, color: GREY });
  });
}

function takeawaysSlide(c: Ctx, title: string, items: string[]) {
  const page = slide(c, "Key take-aways", title);
  const rowH = Math.min(64, (BODY_TOP - 56) / items.length);
  items.forEach((t, i) => {
    const y = BODY_TOP - i * rowH;
    page.drawCircle({ x: M + 16, y: y - 13, size: 14, color: hex("#22c58b") });
    // a drawn tick
    page.drawLine({ start: { x: M + 9, y: y - 13 }, end: { x: M + 14, y: y - 18 }, thickness: 2.4, color: WHITE });
    page.drawLine({ start: { x: M + 14, y: y - 18 }, end: { x: M + 23, y: y - 8 }, thickness: 2.4, color: WHITE });
    textBox(page, t, { x: M + 44, y: y - 2, w: W - 2 * M - 54, h: rowH - 8, f: c.fonts.body, size: 16, min: 10 });
  });
}

function closingSlide(c: Ctx, prompt: string | null) {
  const page = slide(c, "Make it yours", prompt ? "Reflect" : "Well done");
  if (prompt) {
    page.drawRectangle({ x: M, y: 170, width: W - 2 * M, height: BODY_TOP - 170, color: tint(c.color, 0.88), borderColor: c.color, borderWidth: 2 });
    textBox(page, prompt, { x: M + 30, y: BODY_TOP - 26, w: W - 2 * M - 60, h: BODY_TOP - 230, f: c.fonts.light, size: 22, min: 12 });
  }
  textBox(page, "Next: take the 10-question stage test (7/10 to pass) and keep your quest going on learningimpact.pk", { x: M, y: 130, w: W - 2 * M, h: 50, f: c.fonts.bold, size: 15, min: 10, color: c.color });
}

/* ---------- Build ---------- */

const cache = new Map<string, Uint8Array>();

export async function stageSlidesPdf(course: Course, session: Session): Promise<Uint8Array> {
  const key = `${course.slug}:${session.id}:${session.cards.length}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const stageNo = course.sessions.indexOf(session) + 1;
  doc.setTitle(`${course.title} - Stage ${stageNo}: ${session.stage}`);
  doc.setAuthor("Learning Impact (SMC-Private) Limited");
  const embed = (name: string) => doc.embedFont(fontFile(name), { subset: false, features: { liga: false, calt: false, case: false } });
  const fonts: Fonts = {
    head: await embed("outfit-latin-700-normal.ttf"),
    light: await embed("outfit-latin-300-normal.ttf"),
    bold: await embed("inter-latin-600-normal.ttf"),
    body: await embed("inter-latin-400-normal.ttf"),
  };
  const c: Ctx = { doc, fonts, color: hex(course.quest.color.length === 7 ? course.quest.color : "#7b61ff"), course, session, stageNo, n: 0 };

  titleSlide(c);
  goalsSlide(c);
  const story = session.cards.find((k) => k.type === "story");
  if (story?.type === "story") sceneSlide(c, story);
  const terms: { front: string; back: string }[] = [];
  let reflect: string | null = null;
  for (const card of session.cards) {
    switch (card.type) {
      case "explainer":
        movieSlide(c, card);
        break;
      case "diagram":
        diagramSlide(c, card);
        break;
      case "concept":
        bulletSlide(c, "Concept", card.title, card.body, "concept");
        break;
      case "example":
        bulletSlide(c, card.title.toLowerCase().startsWith("real case") ? "Real-world case" : "Case study", card.title, card.body, "case");
        break;
      case "tip":
        bulletSlide(c, "Pro tip", card.title, card.body, "tip");
        break;
      case "flip":
        terms.push(...card.cards);
        break;
      case "keypoints":
        if (terms.length) termsSlide(c, "Words to know", terms.splice(0));
        takeawaysSlide(c, card.title, card.items);
        break;
      case "reflect":
        reflect = card.prompt;
        break;
    }
  }
  if (terms.length) termsSlide(c, "Words to know", terms);
  closingSlide(c, reflect);
  const bytes = await doc.save();
  cache.set(key, bytes);
  return bytes;
}
