// Turns `next build` output into learning-impact-hosting.zip, ready to upload to cPanel
// ("Setup Node.js App", startup file: server.js). Run after `pnpm build`.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");
if (!existsSync(path.join(standalone, "server.js"))) {
  console.error("No .next/standalone/server.js found. Run `pnpm build` first.");
  process.exit(1);
}

// The standalone server does not include static assets; copy them next to it.
cpSync(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), { recursive: true });
cpSync(path.join(root, "public"), path.join(standalone, "public"), { recursive: true });
// Never ship local development data or secrets.
rmSync(path.join(standalone, ".data"), { recursive: true, force: true });
rmSync(path.join(standalone, ".env.local"), { force: true });
rmSync(path.join(standalone, ".env"), { force: true });

const zip = path.join(root, "learning-impact-hosting.zip");
rmSync(zip, { force: true });
// zip follows symlinks by default, so pnpm's linked node_modules become plain files.
execFileSync("zip", ["-qr", zip, "."], { cwd: standalone, stdio: "inherit" });
console.log(`Created ${path.relative(root, zip)}`);
