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

/** A chat-style scene: lines appear one by one, with typing dots in between. */
export function StoryCard({ card, cast, onDone }: { card: Story; cast: CastMember[]; onDone?: () => void }) {
  const [shown, setShown] = useState(1);
  const [typing, setTyping] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const done = shown >= card.lines.length;
  const people = new Map(cast.map((c) => [c.id, c]));

  useEffect(() => {
    if (done) {
      onDone?.();
      return;
    }
    const next = card.lines[shown];
    const wait = 500 + Math.min(1600, card.lines[shown - 1].text.length * 18);
    const t1 = setTimeout(() => setTyping(true), 250);
    const t2 = setTimeout(() => {
      setTyping(false);
      setShown((n) => n + 1);
      play(next.who === "narrator" ? "flip" : "tap");
    }, wait);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, done]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [shown, typing]);

  const sides = new Map<string, "left" | "right">();
  card.lines.forEach((l) => {
    if (l.who !== "narrator" && !sides.has(l.who)) sides.set(l.who, sides.size % 2 === 0 ? "left" : "right");
  });

  return (
    <>
      <h2>{card.title}</h2>
      <p className="story__setting">📍 {card.setting}</p>
      <div className="story">
        {card.lines.slice(0, shown).map((l, i) => {
          const who = people.get(l.who);
          if (l.who === "narrator" || !who)
            return (
              <motion.p key={i} className="story__narration" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <NarratorBadge size={26} /> {l.text}
              </motion.p>
            );
          const side = sides.get(l.who) ?? "left";
          return (
            <motion.div key={i} className={`story__line story__line--${side}`} initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}>
              <Avatar look={who.look} mood={l.mood} size={46} title={who.name} />
              <div className="story__bubble" style={{ ["--who" as string]: who.look.color }}>
                <span className="story__who">
                  {who.name} <small>{who.role}</small>
                </span>
                {l.text}
              </div>
            </motion.div>
          );
        })}
        <AnimatePresence>
          {typing && !done && (
            <motion.div className="story__typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span />
              <span />
              <span />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={end} />
      </div>
      {!done && (
        <button className="inline-link story__skip" onClick={() => setShown(card.lines.length)}>
          Show the whole scene
        </button>
      )}
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
