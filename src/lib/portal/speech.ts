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

export function speak(text: string, onEnd?: () => void) {
  if (!speechSupported()) {
    onEnd?.();
    return;
  }
  stopSpeaking();
  const u = new SpeechSynthesisUtterance(plain(text));
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

export function stopSpeaking() {
  current = null;
  if (speechSupported()) window.speechSynthesis.cancel();
}

export const isSpeaking = () => current !== null;
