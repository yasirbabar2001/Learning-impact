"use client";

import { useEffect, useRef } from "react";

type Orb = { hue: number; x: number; y: number; r: number; sx: number; sy: number; phase: number };

const HUES = [345, 25, 48, 150, 195, 255, 300];

/**
 * Floating rainbow light on black. Rendered to a small canvas and scaled up by CSS,
 * which keeps it soft and cheap. Orbs drift on their own and lean towards the pointer.
 */
export function Aurora({ intensity = 1 }: { intensity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SCALE = 0.22;
    let w = 0;
    let h = 0;
    const pointer = { x: 0.5, y: 0.35, tx: 0.5, ty: 0.35 };
    let scrollY = 0;

    const orbs: Orb[] = HUES.map((hue, i) => ({
      hue,
      x: 0.12 + (i / (HUES.length - 1)) * 0.76,
      y: 0.25 + ((i * 37) % 50) / 100,
      r: 0.17 + ((i * 13) % 10) / 90,
      sx: 0.00009 + (i % 3) * 0.00004,
      sy: 0.00011 + ((i + 1) % 3) * 0.00003,
      phase: i * 1.7,
    }));

    const resize = () => {
      w = Math.max(1, Math.round(window.innerWidth * SCALE));
      h = Math.max(1, Math.round(window.innerHeight * SCALE));
      canvas.width = w;
      canvas.height = h;
    };

    const onMove = (e: PointerEvent) => {
      pointer.tx = e.clientX / window.innerWidth;
      pointer.ty = e.clientY / window.innerHeight;
    };
    const onScroll = () => {
      scrollY = window.scrollY;
    };

    let raf = 0;
    let lastFrame = 0;
    const draw = (t: number) => {
      // ~30 fps is plenty for slow-drifting light and halves the work on modest laptops.
      if (t - lastFrame < 32) {
        if (!reduce) raf = requestAnimationFrame(draw);
        return;
      }
      lastFrame = t;
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#050507";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      const drift = (scrollY / Math.max(1, window.innerHeight)) * 0.08;
      const shift = (t * 0.004) % 360;

      orbs.forEach((o, i) => {
        const pull = i % 2 === 0 ? 0.18 : 0.08;
        const cx = (o.x + Math.sin(t * o.sx + o.phase) * 0.22 + (pointer.x - 0.5) * pull) * w;
        const cy = (o.y + Math.cos(t * o.sy + o.phase) * 0.2 + (pointer.y - 0.5) * pull - drift * (i % 3)) * h;
        const r = (o.r + Math.sin(t * 0.0003 + o.phase) * 0.04) * Math.max(w, h);
        const hue = (o.hue + shift) % 360;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `hsla(${hue}, 95%, 60%, ${0.5 * intensity})`);
        g.addColorStop(0.4, `hsla(${hue}, 95%, 52%, ${0.13 * intensity})`);
        g.addColorStop(1, "hsla(0, 0%, 0%, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduce) raf = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intensity]);

  return (
    <div className="aurora" aria-hidden="true">
      <canvas ref={ref} />
      <div className="aurora__grid" />
      <div className="aurora__grain" />
      <div className="aurora__vignette" />
    </div>
  );
}
