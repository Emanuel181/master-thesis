'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { HexGridBackground } from '@/components/landing-page/hex-grid-background';

/**
 * Wraps the hero section with scroll-linked shrinking border animation.
 * As user scrolls down, margins increase creating a shrinking effect.
 * An accent border appears as the animation progresses.
 */
export function HeroScrollWrapper({ children }) {
  const heroRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const smoothProgress = useSpring(scrollYProgress, { 
    stiffness: 200, 
    damping: 25,
    restDelta: 0.001
  });
  
  // Subtle shrinking - just margins, completes at 25% scroll
  const horizontalMargin = useTransform(smoothProgress, [0, 0.25], [0, 20]);
  const borderRadius = useTransform(smoothProgress, [0, 0.25], [0, 20]);
  const borderColor = useTransform(
    smoothProgress, 
    [0, 0.15], 
    ['rgba(31, 182, 207, 0)', 'rgba(31, 182, 207, 0.5)']
  );

  return (
    <div ref={heroRef} className="relative">
      {/* Animated border wrapper with hex grid inside */}
      <motion.div
        style={{
          marginLeft: horizontalMargin,
          marginRight: horizontalMargin,
        }}
      >
        <motion.div
          style={{
            borderRadius,
            borderWidth: 2,
            borderStyle: 'solid',
            borderColor,
          }}
          className="overflow-hidden relative"
        >
          {/* Hex Grid Background - inside the shrinking container */}
          <HexGridBackground className="z-0 opacity-70" />
          
          <div className="relative z-10">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
