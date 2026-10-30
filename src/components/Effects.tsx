"use client";

import { useEffect } from "react";

const COLORS = ["#ff4d6d", "#ff9f1c", "#ffd23f", "#2ee59d", "#00c2ff", "#7b61ff", "#ff4dd8"];

/**
 * Global interaction effects:
 *  - every click sends out a rainbow ring and a burst of sparks;
 *  - elements marked .spot get a light that follows the pointer (via --mx / --my).
 */
export function Effects() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const layer = document.createElement("div");
    layer.className = "fx-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);

    const burst = (x: number, y: number) => {
      const ring = document.createElement("span");
      ring.className = "fx-ring";
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
      layer.appendChild(ring);
      ring
        .animate(
          [
            { transform: "translate(-50%,-50%) scale(0.2) rotate(0deg)", opacity: 1 },
            { transform: "translate(-50%,-50%) scale(1) rotate(160deg)", opacity: 0 },
          ],
          { duration: 700, easing: "cubic-bezier(.22,1,.36,1)" },
        )
        .finished.then(() => ring.remove(), () => ring.remove());

      const count = 12;
      for (let i = 0; i < count; i++) {
        const spark = document.createElement("span");
        spark.className = "fx-spark";
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 38 + Math.random() * 46;
        const size = 3 + Math.random() * 4;
        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        spark.style.width = spark.style.height = `${size}px`;
        spark.style.background = COLORS[i % COLORS.length];
        spark.style.boxShadow = `0 0 12px ${COLORS[i % COLORS.length]}`;
        layer.appendChild(spark);
        spark
          .animate(
            [
              { transform: "translate(-50%,-50%) translate(0,0) scale(1)", opacity: 1 },
              {
                transform: `translate(-50%,-50%) translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0)`,
                opacity: 0,
              },
            ],
            { duration: 550 + Math.random() * 350, easing: "cubic-bezier(.16,1,.3,1)" },
          )
          .finished.then(() => spark.remove(), () => spark.remove());
      }
    };

    const onDown = (e: PointerEvent) => {
      if (reduce || e.button !== 0) return;
      burst(e.clientX, e.clientY);
    };

    const onMove = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest?.<HTMLElement>(".spot");
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      target.style.setProperty("--my", `${e.clientY - rect.top}px`);
    };

    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      layer.remove();
    };
  }, []);

  return null;
}
