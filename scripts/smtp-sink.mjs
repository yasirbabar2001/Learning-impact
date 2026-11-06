// Test-only mail catcher: a minimal SMTP server that saves each message to MAIL_DIR/<recipient>.eml
// (latest message wins). Used by the end-to-end tests to read verification codes.
import { mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const port = Number(process.env.SINK_PORT || 2525);
const dir = process.env.MAIL_DIR || ".data-e2e-mail";
mkdirSync(dir, { recursive: true });

net
  .createServer((sock) => {
    let buf = "";
    let data = false;
    let rcpt = [];
    const say = (l) => sock.write(`${l}\r\n`);
    say("220 sink ready");
    sock.on("data", (chunk) => {
      buf += chunk.toString("utf8");
      let i;
      while (true) {
        if (data) {
          i = buf.indexOf("\r\n.\r\n");
          if (i < 0) return;
          const msg = buf.slice(0, i);
          buf = buf.slice(i + 5);
          data = false;
          mkdirSync(dir, { recursive: true });
          for (const r of rcpt) writeFileSync(path.join(dir, `${r.toLowerCase()}.eml`), msg);
          rcpt = [];
          say("250 queued");
          continue;
        }
        i = buf.indexOf("\r\n");
        if (i < 0) return;
        const line = buf.slice(0, i);
        buf = buf.slice(i + 2);
        const cmd = line.slice(0, 4).toUpperCase();
        if (cmd === "EHLO" || cmd === "HELO") say("250-sink\r\n250-AUTH PLAIN LOGIN\r\n250 OK");
        else if (cmd === "AUTH") say("235 ok");
        else if (cmd === "MAIL") say("250 ok");
        else if (cmd === "RCPT") {
          rcpt.push(line.replace(/^RCPT TO:\s*<?([^>]+)>?.*$/i, "$1"));
          say("250 ok");
        } else if (cmd === "DATA") {
          data = true;
          say("354 go");
        } else if (cmd === "QUIT") {
          say("221 bye");
          sock.end();
        } else say("250 ok");
      }
    });
    sock.on("error", () => {});
  })
  .listen(port, "127.0.0.1", () => console.log(`smtp sink on ${port}`));
