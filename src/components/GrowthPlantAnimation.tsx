"use client";

import React from "react";
import { motion } from "motion/react";

interface GrowthPlantAnimationProps {
  className?: string;
}

export const GrowthPlantAnimation: React.FC<GrowthPlantAnimationProps> = ({
  className = ""
}) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* Botanical Plant / Growth Sprout SVG - Positioned on the Right, Facing Left (-scale-x-100) */}
      <svg
        viewBox="0 0 520 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute -right-6 sm:right-0 md:right-4 -bottom-6 w-[280px] sm:w-[380px] md:w-[440px] lg:w-[480px] h-auto object-contain opacity-40 sm:opacity-48 mix-blend-screen -scale-x-100"
        preserveAspectRatio="xMaxYMax meet"
      >
        <defs>
          {/* Main Leaf Gradient (Luminous Emerald) */}
          <linearGradient id="leafGradPrimary" x1="120" y1="310" x2="260" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#047857" stopOpacity="0.12" />
            <stop offset="45%" stopColor="#10B981" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#6EE7B7" stopOpacity="0.75" />
          </linearGradient>

          {/* Secondary Leaf Gradient (Deep Teal Emerald) */}
          <linearGradient id="leafGradSecondary" x1="60" y1="280" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#065F46" stopOpacity="0.18" />
            <stop offset="60%" stopColor="#059669" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0.72" />
          </linearGradient>

          {/* Lateral Leaf Gradient (Soft Mint) */}
          <linearGradient id="leafGradTertiary" x1="140" y1="290" x2="340" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#064E3B" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#A7F3D0" stopOpacity="0.6" />
          </linearGradient>

          {/* Young Bud Gradient (Bright Mint Accent) */}
          <linearGradient id="leafGradBud" x1="130" y1="240" x2="195" y2="115" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#D1FAE5" stopOpacity="0.85" />
          </linearGradient>

          {/* Delicate Stem & Vein Gradient */}
          <linearGradient id="stemGrad" x1="110" y1="340" x2="235" y2="45" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#34D399" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#A7F3D0" stopOpacity="0.75" />
          </linearGradient>

          {/* Soft Glow Filter */}
          <filter id="growthGlow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Stem Line with organic curve */}
        <motion.path
          d="M 110 340 Q 130 230 180 145 T 235 45"
          stroke="url(#stemGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0.85, opacity: 0.4 }}
          animate={{
            pathLength: [0.85, 1, 0.85],
            opacity: [0.35, 0.65, 0.35],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Leaf 1: Secondary Leaf (Arching Top-Left) */}
        <motion.g
          style={{ transformOrigin: "100px 270px" }}
          animate={{
            rotate: [-2, 3, -2],
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path
            d="M 100 270 C 65 240 40 185 55 120 C 68 85 92 68 115 82 C 122 130 115 200 100 270 Z"
            fill="url(#leafGradSecondary)"
          />
          {/* Subtle leaf spine */}
          <path
            d="M 100 270 Q 95 180 112 85"
            stroke="#A7F3D0"
            strokeWidth="1.2"
            strokeOpacity="0.3"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Leaf 2: Primary Central Leaf (Hero Leaf arching diagonally Top-Right) */}
        <motion.g
          style={{ transformOrigin: "115px 310px" }}
          animate={{
            rotate: [1, -2.5, 1],
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 5.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path
            d="M 115 310 C 125 220 160 130 235 45 C 265 105 245 200 185 270 C 155 305 130 310 115 310 Z"
            fill="url(#leafGradPrimary)"
            filter="url(#growthGlow)"
          />
          {/* Elegant central vein with side branches */}
          <path
            d="M 118 305 Q 165 185 233 48"
            stroke="#D1FAE5"
            strokeWidth="1.6"
            strokeOpacity="0.5"
            strokeLinecap="round"
          />
          <path
            d="M 155 225 Q 185 205 210 215"
            stroke="#A7F3D0"
            strokeWidth="0.9"
            strokeOpacity="0.3"
            strokeLinecap="round"
          />
          <path
            d="M 175 175 Q 205 155 228 160"
            stroke="#A7F3D0"
            strokeWidth="0.9"
            strokeOpacity="0.3"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Leaf 3: Lateral Lower-Right Leaf (Spreading wide) */}
        <motion.g
          style={{ transformOrigin: "135px 290px" }}
          animate={{
            rotate: [-3, 2, -3],
            scale: [0.97, 1.02, 0.97],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path
            d="M 135 290 C 180 260 250 220 335 155 C 315 210 240 280 160 300 C 145 304 138 298 135 290 Z"
            fill="url(#leafGradTertiary)"
          />
          {/* Vein */}
          <path
            d="M 137 290 Q 230 235 330 158"
            stroke="#6EE7B7"
            strokeWidth="1.2"
            strokeOpacity="0.35"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Leaf 4: Fresh Sprouting Bud Leaf (Center-Foreground) */}
        <motion.g
          style={{ transformOrigin: "130px 240px" }}
          animate={{
            rotate: [2, -3, 2],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            duration: 4.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path
            d="M 130 240 C 135 190 155 150 195 115 C 205 150 185 195 150 230 C 140 240 133 242 130 240 Z"
            fill="url(#leafGradBud)"
          />
          <path
            d="M 132 238 Q 155 180 193 118"
            stroke="#ECFDF5"
            strokeWidth="1.2"
            strokeOpacity="0.6"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Ambient floating growth/sprout particles */}
        <motion.circle
          cx="210"
          cy="75"
          r="2.5"
          fill="#A7F3D0"
          animate={{
            y: [0, -15, 0],
            opacity: [0.2, 0.7, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="170"
          cy="120"
          r="2"
          fill="#6EE7B7"
          animate={{
            y: [0, -15, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [0.9, 1.3, 0.9],
          }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        />
        <motion.circle
          cx="280"
          cy="130"
          r="3"
          fill="#34D399"
          animate={{
            y: [0, -15, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [0.7, 1.1, 0.7],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
      </svg>
    </div>
  );
};
