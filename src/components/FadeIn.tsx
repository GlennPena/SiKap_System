"use client";

import React, { useEffect, useState } from "react";
import { motion, useInView, useAnimation } from "motion/react";

// --- GLOBAL SCROLL VELOCITY TRACKER ---
let globalScrollVelocity = 0;
let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
let lastScrollTime = typeof performance !== "undefined" ? performance.now() : 0;

if (typeof window !== "undefined") {
  window.addEventListener(
    "scroll",
    () => {
      const currentScrollY = window.scrollY;
      const currentTime = performance.now();
      const dt = currentTime - lastScrollTime;
      const dy = currentScrollY - lastScrollY;

      if (dt > 0) {
        globalScrollVelocity = Math.abs(dy / dt); // px per ms
      }

      lastScrollY = currentScrollY;
      lastScrollTime = currentTime;
    },
    { passive: true }
  );

  setInterval(() => {
    globalScrollVelocity *= 0.8;
    if (globalScrollVelocity < 0.1) globalScrollVelocity = 0;
  }, 100);
}

export const getSpeedFactor = () => {
  const maxVelocity = 4; // high speed scroll
  const normalized = Math.min(globalScrollVelocity / maxVelocity, 1);
  const factor = 1.0 - normalized * 0.7; // drops down to 0.3 at max speed
  return Math.max(0.3, Math.min(1.0, factor));
};

export interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  direction?: "up" | "left" | "right" | "hero-adaptive";
  amount?: number | "some" | "all";
  margin?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 0.5,
  className = "",
  direction = "up",
  amount = "some",
  margin = "-40px"
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: margin as any, amount });
  const controls = useAnimation();

  // Track viewport responsiveness: widescreen desktop (>=1280px) retains left entrance, centered mobile/tablet/iPad (<1280px) fades appear from bottom
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1280;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 1280px)");
    const update = () => setIsDesktop(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const resolvedDirection = direction === "hero-adaptive" ? (isDesktop ? "left" : "up") : direction;

  const initial =
    resolvedDirection === "up"
      ? { opacity: 0, y: 24, x: 0 }
      : resolvedDirection === "left"
      ? { opacity: 0, x: -12, y: 0 }
      : { opacity: 0, x: 12, y: 0 };

  const target = { opacity: 1, x: 0, y: 0 };

  useEffect(() => {
    if (isInView) {
      const speedFactor = getSpeedFactor();
      controls.start({
        ...target,
        transition: {
          duration: duration * speedFactor,
          delay: delay * speedFactor,
          ease: "easeOut"
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView, resolvedDirection]);

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={controls}
      className={className}
    >
      {children}
    </motion.div>
  );
};
