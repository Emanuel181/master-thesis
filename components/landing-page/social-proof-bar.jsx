"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Languages, BrainCircuit, BookCheck } from "lucide-react";

const stats = [
  {
    value: 4,
    suffix: "",
    label: "AI Agents in Pipeline",
    icon: BrainCircuit,
  },
  {
    value: 9,
    suffix: "+",
    label: "Languages Supported",
    icon: Languages,
  },
  {
    value: 0,
    suffix: "",
    label: "Hallucinations",
    icon: Shield,
    isZero: true,
  },
  {
    value: 100,
    suffix: "%",
    label: "RAG-Grounded Fixes",
    icon: BookCheck,
  },
];

function AnimatedCounter({ value, suffix = "", isZero = false, inView }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (isZero) {
      setCount(0);
      return;
    }

    let start = 0;
    const duration = 1600;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [inView, value, isZero]);

  return (
    <span className="gradient-text font-bold tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

export function SocialProofBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div
      ref={ref}
      className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-12 py-8 sm:py-10 md:py-12"
    >
      <div className="rounded-2xl border border-[var(--brand-accent)]/15 bg-[var(--brand-accent)]/[0.03] backdrop-blur-sm px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center text-center gap-2"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/20 flex items-center justify-center mb-1">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--brand-accent)]" />
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    isZero={stat.isZero}
                    inView={inView}
                  />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Trust badge */}
        <div className="flex justify-center mt-6 sm:mt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/20 text-xs sm:text-sm text-[var(--brand-accent)] font-medium">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-accent)] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--brand-accent)]" />
            </span>
            Open Beta — Free to use
          </div>
        </div>
      </div>
    </div>
  );
}

export default SocialProofBar;

