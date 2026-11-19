// Draws every course's illustrated title picture to public/cover-art/<slug>.svg (run automatically before `next build`).
// The drawings live in src/components/cover/*.tsx; they are transpiled with TypeScript and rendered with React here,
// so pages only reference small cached image files instead of carrying the artwork inline.
import { mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = process.cwd();
const work = path.join(tmpdir(), `li-covers-${process.pid}`);
mkdirSync(work, { recursive: true });
for (const name of ["scene", "CoverSvg"]) {
  const src = readFileSync(path.join(root, "src/components/cover", `${name}.tsx`), "utf8");
  const out = ts.transpileModule(src, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText.replace(/from "\.\/scene"/g, 'from "./scene.mjs"');
  writeFileSync(path.join(work, `${name}.mjs`), out);
}
// The transpiled files import react/jsx-runtime; resolve it from the project.
writeFileSync(path.join(work, "package.json"), "{}");
mkdirSync(path.join(work, "node_modules"), { recursive: true });
symlinkSync(path.join(root, "node_modules", "react"), path.join(work, "node_modules", "react"), "dir");
const { CoverSvg } = await import(pathToFileURL(path.join(work, "CoverSvg.mjs")).href);

const outDir = path.join(root, "public", "cover-art");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const dir = path.join(root, "content", "courses");
let n = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const c = JSON.parse(readFileSync(path.join(dir, file), "utf8"));
  const svg = renderToStaticMarkup(createElement(CoverSvg, { slug: c.slug, color: c.quest.color, country: c.jurisdiction?.code ?? null }));
  writeFileSync(path.join(outDir, `${c.slug}.svg`), svg);
  n++;
}
rmSync(work, { recursive: true, force: true });
console.log(`✓ ${n} course pictures drawn to public/cover-art`);
