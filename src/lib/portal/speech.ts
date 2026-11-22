"use client";

/**
 * Narration with the browser's built-in voices (Web Speech API). Quality depends on the device;
 * every narrated card also shows its text, so nothing depends on audio.
 */

const KEY = "li-autoread";

export const speechSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function autoReadOn(): boolean {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

export function setAutoRead(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* private mode */
  }
}

/** Prefers a natural English voice, ideally Pakistani/Indian or British English. */
function voice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const pick = (re: RegExp) => voices.find((v) => re.test(v.lang) && /natural|neural|online|google|premium|enhanced/i.test(v.name)) ?? voices.find((v) => re.test(v.lang));
  return pick(/en-PK/i) ?? pick(/en-IN/i) ?? pick(/en-GB/i) ?? pick(/^en/i);
}

/** Strips Markdown so the voice reads words, not symbols. */
export function plain(text: string) {
  return text
    .replace(/\|/g, ", ")
    .replace(/[*_`#>]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

let current: SpeechSynthesisUtterance | null = null;

/** Where the voice has got to in the text being read, so a pause can resume at the same word. */
let spoken = { text: "", from: 0, pos: 0, startedAt: 0, boundary: false };

/** Average speaking speed used when the voice does not report word positions (characters per second, kept low so a
 * resume repeats a word or two rather than skipping any). */
const CHARS_PER_SECOND = 13;

/** Reads `text` aloud, starting `from` characters into its plain-text form (0 = the beginning). */
export function speak(text: string, onEnd?: () => void, from = 0) {
  if (!speechSupported()) {
    onEnd?.();
    return;
  }
  stopSpeaking();
  const full = plain(text);
  const start = Math.max(0, Math.min(from, full.length));
  if (start >= full.length) {
    onEnd?.();
    return;
  }
  const u = new SpeechSynthesisUtterance(full.slice(start));
  spoken = { text: full, from: start, pos: start, startedAt: Date.now(), boundary: false };
  u.onboundary = (e) => {
    if (current !== u) return;
    spoken.pos = start + e.charIndex;
    spoken.boundary = true;
  };
  const v = voice();
  if (v) u.voice = v;
  u.lang = v?.lang ?? "en-GB";
  u.rate = 1.02;
  u.pitch = 1;
  u.onend = () => {
    if (current === u) {
      current = null;
      onEnd?.();
    }
  };
  u.onerror = () => {
    if (current === u) {
      current = null;
      onEnd?.();
    }
  };
  current = u;
  window.speechSynthesis.speak(u);
}

/**
 * Pauses the narration and returns the position to resume from (start of the word being read). The browser's own
 * pause is not used: Chrome drops paused speech after a few seconds and Android ignores it.
 */
export function pauseSpeaking(): number {
  if (!current) return 0;
  const { text, from, startedAt, boundary } = spoken;
  let pos = boundary ? spoken.pos : from + Math.round(((Date.now() - startedAt) / 1000) * CHARS_PER_SECOND);
  pos = Math.min(Math.max(pos, from), text.length);
  const space = text.lastIndexOf(" ", pos - 1);
  pos = Math.max(from, space < 0 ? 0 : space + 1);
  stopSpeaking();
  return pos;
}

export function stopSpeaking() {
  current = null;
  if (speechSupported()) window.speechSynthesis.cancel();
}

export const isSpeaking = () => current !== null;
