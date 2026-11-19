"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & { delay?: number; y?: number };

/**
 * Fades and lifts its children into place the first time they scroll into view. Content is always sent visible:
 * only sections that start below the screen are hidden (before the first paint after loading) and then revealed,
 * so nothing on screen waits for JavaScript.
 */
export function Reveal({ delay = 0, y = 28, className = "", style, children, ...rest }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"shown" | "pending" | "in">("shown");

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight - 40) return; // already on screen: leave it be
    setState("pending");
    let timer = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        setState("in");
        // Drop the animation class afterwards so the element's own hover transitions work again.
        timer = window.setTimeout(() => setState("shown"), (delay + 1) * 1000);
      },
      { rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`${className} ${state === "pending" ? "reveal--pending" : state === "in" ? "reveal--in" : ""}`.trim() || undefined}
      style={{ ...style, ["--reveal-delay" as string]: `${delay}s`, ["--reveal-y" as string]: `${y}px` } as CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
}
