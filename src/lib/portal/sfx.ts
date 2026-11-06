"use client";

/**
 * Game sounds, synthesised with the Web Audio API (no audio files). Respects the learner's mute
 * setting, which is remembered on this device.
 */

type Sound = "tap" | "correct" | "wrong" | "combo" | "xp" | "levelup" | "badge" | "whoosh" | "flip" | "hit" | "win" | "lose";

const KEY = "li-sound";
let ctx: AudioContext | null = null;

export function soundOn(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* private mode */
  }
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** One enveloped oscillator note. */
function tone(a: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.18, slideTo?: number) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime + start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + start + dur);
  g.gain.setValueAtTime(0.0001, a.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, a.currentTime + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start);
  o.stop(a.currentTime + start + dur + 0.05);
}

function noise(a: AudioContext, start: number, dur: number, gain = 0.08, from = 2000, to = 400) {
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.setValueAtTime(from, a.currentTime + start);
  f.frequency.exponentialRampToValueAtTime(to, a.currentTime + start + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(gain, a.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  src.connect(f).connect(g).connect(a.destination);
  src.start(a.currentTime + start);
}

// Notes of a major pentatonic run (C6 upwards) used for rising rewards.
const RUN = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093];

export function play(sound: Sound, level = 1) {
  if (!soundOn()) return;
  const a = audio();
  if (!a) return;
  switch (sound) {
    case "tap":
      tone(a, 660, 0, 0.06, "triangle", 0.08);
      break;
    case "flip":
      noise(a, 0, 0.18, 0.05, 3000, 900);
      break;
    case "whoosh":
      noise(a, 0, 0.32, 0.06, 600, 3200);
      break;
    case "correct":
      tone(a, 880, 0, 0.12, "triangle", 0.16);
      tone(a, 1318.5, 0.09, 0.22, "triangle", 0.16);
      break;
    case "wrong":
      tone(a, 220, 0, 0.18, "sawtooth", 0.07, 160);
      tone(a, 185, 0.12, 0.25, "sawtooth", 0.06, 120);
      break;
    case "combo":
      for (let i = 0; i < Math.min(5, level + 1); i++) tone(a, RUN[i], i * 0.06, 0.14, "square", 0.06);
      break;
    case "xp":
      tone(a, 1568, 0, 0.08, "square", 0.05);
      tone(a, 2093, 0.07, 0.16, "square", 0.05);
      break;
    case "badge":
      [523.3, 659.3, 784, 1046.5].forEach((f, i) => tone(a, f, i * 0.09, 0.3, "triangle", 0.14));
      tone(a, 2093, 0.4, 0.5, "sine", 0.08);
      break;
    case "levelup":
      [523.3, 659.3, 784, 1046.5, 1318.5, 1568].forEach((f, i) => tone(a, f, i * 0.08, 0.35, "square", 0.07));
      [1046.5, 1318.5, 1568].forEach((f) => tone(a, f, 0.55, 0.8, "triangle", 0.08));
      break;
    case "hit":
      noise(a, 0, 0.15, 0.12, 1200, 200);
      tone(a, 140, 0, 0.18, "square", 0.1, 70);
      break;
    case "win":
      [784, 987.8, 1174.7, 1568].forEach((f, i) => tone(a, f, i * 0.12, 0.4, "triangle", 0.14));
      [1568, 1975.5, 2349.3].forEach((f) => tone(a, f, 0.6, 1.1, "sine", 0.07));
      break;
    case "lose":
      [392, 349.2, 311.1, 261.6].forEach((f, i) => tone(a, f, i * 0.16, 0.35, "triangle", 0.1));
      break;
  }
}
