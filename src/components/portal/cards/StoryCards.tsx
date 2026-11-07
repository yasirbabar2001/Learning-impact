"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Card, CastMember } from "@/lib/courses/schema";
import { play } from "@/lib/portal/sfx";
import { autoReadOn, speak, speechSupported, stopSpeaking } from "@/lib/portal/speech";
import { Avatar, NarratorBadge } from "./Avatar";

type Story = Extract<Card, { type: "story" }>;
type Explainer = Extract<Card, { type: "explainer" }>;
type Video = Extract<Card, { type: "video" }>;

/**
 * A comic-style scene: one panel at a time. The speaker is drawn large with their expression and a big speech
 * panel; narration appears as a caption. Learners tap through it (or open the whole script).
 */
export function StoryCard({ card, cast, onDone }: { card: Story; cast: CastMember[]; onDone?: () => void }) {
  const [at, setAt] = useState(0);
  const [script, setScript] = useState(false);
  const people = new Map(cast.map((c) => [c.id, c]));
  const line = card.lines[at];
  const last = at >= card.lines.length - 1;
  const speaker = line.who === "narrator" ? null : (people.get(line.who) ?? null);
  // Everyone who speaks in this scene, in order of appearance.
  const inScene = [...new Set(card.lines.map((l) => l.who).filter((w) => w !== "narrator" && people.has(w)))].map((w) => people.get(w)!);
  // Speakers alternate sides so a conversation reads left-right like a comic.
  const side = speaker ? (inScene.indexOf(speaker) % 2 === 0 ? "left" : "right") : "center";

  const go = (to: number) => {
    if (to < 0 || to >= card.lines.length) return;
    play(card.lines[to].who === "narrator" ? "flip" : "tap");
    setAt(to);
    if (to === card.lines.length - 1) onDone?.();
  };

  return (
    <>
      <h2>{card.title}</h2>
      <p className="scene__setting">📍 {card.setting}</p>
      {script ? (
        <div className="scene-script">
          {card.lines.map((l, k) => {
            const who = people.get(l.who);
            return (
              <p key={k} className={l.who === "narrator" || !who ? "scene-script__narration" : ""}>
                {who ? (
                  <>
                    <strong style={{ color: who.look.color }}>{who.name}:</strong> {l.text}
                  </>
                ) : (
                  <em>{l.text}</em>
                )}
              </p>
            );
          })}
        </div>
      ) : (
        <div className="scene" style={{ ["--who" as string]: speaker?.look.color ?? "#ffd23f" }}>
          {inScene.length > 0 && (
            <div className="scene__cast" aria-label="In this scene">
              {inScene.map((c) => (
                <span key={c.id} className={`scene__castmate ${speaker?.id === c.id ? "is-speaking" : ""}`} title={`${c.name}, ${c.role}`}>
                  <Avatar look={c.look} size={34} title={c.name} />
                  <small>{c.name.split(" ")[0]}</small>
                </span>
              ))}
            </div>
          )}
          <button className={`scene__panel scene__panel--${side}`} onClick={() => go(at + 1)} disabled={last} aria-label={last ? "End of scene" : "Next line"}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={at}
                className="scene__frame"
                initial={{ opacity: 0, x: side === "right" ? 30 : side === "left" ? -30 : 0, y: side === "center" ? 12 : 0 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                {speaker ? (
                  <>
                    <span className="scene__portrait">
                      <Avatar look={speaker.look} mood={line.mood} size={112} title={speaker.name} />
                      <span className="scene__nameplate">
                        <strong>{speaker.name}</strong>
                        <small>{speaker.role}</small>
                      </span>
                    </span>
                    <span className="scene__speech">{line.text}</span>
                  </>
                ) : (
                  <span className="scene__caption">
                    <NarratorBadge size={30} />
                    <span>{line.text}</span>
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          </button>
          <div className="scene__controls">
            <button className="scene__arrow" onClick={() => go(at - 1)} disabled={at === 0} aria-label="Previous line">
              ◀
            </button>
            <span className="scene__dots" aria-label={`Line ${at + 1} of ${card.lines.length}`}>
              {card.lines.map((_, k) => (
                <i key={k} className={k === at ? "is-on" : k < at ? "is-done" : ""} />
              ))}
            </span>
            {last ? (
              <span className="scene__end">Scene complete ✓</span>
            ) : (
              <button className="scene__next" onClick={() => go(at + 1)}>
                Continue ▶
              </button>
            )}
          </div>
        </div>
      )}
      <button className="inline-link scene__toggle" onClick={() => setScript((v) => !v)}>
        {script ? "Back to the scene" : "Read the whole scene"}
      </button>
    </>
  );
}

/** Text a narrator reads for a story card. */
export function storyScript(card: Story, cast: CastMember[]) {
  const names = new Map(cast.map((c) => [c.id, c.name]));
  return [card.title, card.setting, ...card.lines.map((l) => (l.who === "narrator" ? l.text : `${names.get(l.who) ?? ""}: ${l.text}`))].join(". ");
}

/** A narrated mini-movie: animated scenes with captions, read aloud scene by scene. */
export function ExplainerCard({ card }: { card: Explainer }) {
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    stopSpeaking();
    if (timer.current) clearTimeout(timer.current);
    setPlaying(false);
  };

  const playFrom = (i: number) => {
    if (timer.current) clearTimeout(timer.current);
    setScene(i);
    setPlaying(true);
    setFinished(false);
    play("whoosh");
    const next = () => {
      if (i + 1 < card.scenes.length) playFrom(i + 1);
      else {
        setPlaying(false);
        setFinished(true);
      }
    };
    if (speechSupported()) speak(`${card.scenes[i].heading}. ${card.scenes[i].narration}`, () => (timer.current = setTimeout(next, 500)));
    else timer.current = setTimeout(next, 3500 + card.scenes[i].narration.length * 45);
  };

  useEffect(() => {
    if (autoReadOn()) playFrom(0);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = card.scenes[scene];
  return (
    <>
      <h2>{card.title}</h2>
      <div className={`movie ${playing ? "is-playing" : ""}`}>
        <div className="movie__stage">
          <AnimatePresence mode="wait">
            <motion.div key={scene} className="movie__scene" initial={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 1.06, filter: "blur(8px)" }} transition={{ duration: 0.55 }}>
              <div className="movie__icon-wrap" aria-hidden="true">
                <motion.span className="movie__orbit" animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }}>
                  {["✦", "●", "✦", "●"].map((d, k) => (
                    <i key={k} style={{ transform: `rotate(${k * 90}deg) translateY(-78px)` }}>
                      {d}
                    </i>
                  ))}
                </motion.span>
                <motion.span className="movie__icon" initial={{ scale: 0, rotate: -30 }} animate={{ scale: [0, 1.2, 1], rotate: 0 }} transition={{ duration: 0.7 }}>
                  {s.icon}
                </motion.span>
              </div>
              <motion.h3 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                {s.heading}
              </motion.h3>
              <motion.p className="movie__caption" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                {s.narration}
              </motion.p>
            </motion.div>
          </AnimatePresence>
          {!playing && !finished && scene === 0 && (
            <button className="movie__play" onClick={() => playFrom(0)} aria-label="Play the mini-movie">
              <span className="movie__play-btn">▶</span>
              <span className="movie__play-label">
                Play the mini-movie · {card.scenes.length} scenes
              </span>
            </button>
          )}
        </div>
        <div className="movie__bar">
          <button className="movie__btn" onClick={() => (playing ? stop() : playFrom(finished ? 0 : scene))} aria-label={playing ? "Pause" : "Play"}>
            {playing ? "❚❚" : finished ? "↺" : "▶"}
          </button>
          <div className="movie__dots">
            {card.scenes.map((_, k) => (
              <button
                key={k}
                className={k === scene ? "is-on" : k < scene ? "is-done" : ""}
                onClick={() => {
                  stop();
                  setScene(k);
                }}
                aria-label={`Scene ${k + 1}`}
              />
            ))}
          </div>
          <span className="movie__count">
            {scene + 1}/{card.scenes.length}
          </span>
        </div>
      </div>
    </>
  );
}

const embed = (url: string) => {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
};

export function VideoCard({ card }: { card: Video }) {
  const src = embed(card.url);
  return (
    <>
      <h2>{card.title}</h2>
      <div className="video-card">
        {src ? <iframe src={src} title={card.title} allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowFullScreen /> : <video src={card.url} controls preload="metadata" />}
      </div>
      {card.caption && <p className="lcard__lead">{card.caption}</p>}
    </>
  );
}
