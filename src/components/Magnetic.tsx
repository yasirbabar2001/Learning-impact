"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring } from "motion/react";
import type { ComponentProps, PointerEvent, ReactNode } from "react";

type Props = {
  href?: string;
  variant?: "primary" | "ghost";
  children: ReactNode;
  className?: string;
} & Omit<ComponentProps<"button">, "ref" | "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart">;

/** Pill button that leans towards the pointer and springs back. Renders a Link when given href. */
export function Magnetic({ href, variant = "primary", children, className = "", ...button }: Props) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 15, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 15, mass: 0.4 });

  const move = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.28);
    y.set((e.clientY - r.top - r.height / 2) * 0.38);
  };
  const leave = () => {
    x.set(0);
    y.set(0);
  };

  const cls = `btn btn--${variant} ${className}`;
  const inner = (
    <>
      <span className="btn__label">{children}</span>
      <span className="btn__arrow" aria-hidden="true">→</span>
    </>
  );

  return (
    <motion.span className="magnetic" style={{ x: sx, y: sy }} onPointerMove={move} onPointerLeave={leave} whileTap={{ scale: 0.94 }}>
      {href ? (
        <Link href={href} className={cls}>
          {inner}
        </Link>
      ) : (
        <button className={cls} {...button}>
          {inner}
        </button>
      )}
    </motion.span>
  );
}
