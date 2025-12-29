'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

const SecurityCodeDemo = dynamic(
  () => import('./security-code-demo').then(mod => mod.SecurityCodeDemo),
  { ssr: false, loading: () => <div className="min-h-[400px] animate-pulse bg-muted/10 rounded-lg" /> }
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function AnimatedHero({ scrollContainerRef }) {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ container: scrollContainerRef });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  
  const heroOpacity = useTransform(smoothProgress, [0, 0.12], [1, 0]);
  const heroY = useTransform(smoothProgress, [0, 0.12], [0, -40]);

  return (
    <motion.section
      ref={heroRef}
      id="hero"
      className="relative z-10 w-full min-h-[100svh] md:min-h-screen flex flex-col justify-center hero-gradient px-3 sm:px-4 overflow-hidden"
      style={{ opacity: heroOpacity, y: heroY }}
    >
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-[#1fb6cf]/10 rounded-full blur-[100px] pointer-events-none hidden sm:block" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#1fb6cf]/5 rounded-full blur-[120px] pointer-events-none hidden sm:block" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 w-full pt-16 sm:pt-24 md:pt-32 pb-8 sm:pb-12 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">
          {/* Left: Copy */}
          <motion.div
            className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 text-center md:text-left w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="flex justify-center md:justify-start gap-3">
              <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 text-[9px] xs:text-[10px] sm:text-xs font-semibold text-[#1fb6cf] bg-[#1fb6cf]/10 border border-[#1fb6cf]/20 rounded-full backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1fb6cf] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[#1fb6cf]"></span>
                </span>
                Open beta
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1]"
            >
              <span className="text-foreground">Security</span>
              <br />
              <span className="text-foreground">remediation</span>
              <br />
              <span className="gradient-text">without</span>
              <br />
              <span className="gradient-text">hallucinations.</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0"
            >
              Autonomous AI agents that detect, patch, and verify vulnerabilities. Every fix is{' '}
              <span className="text-[#1fb6cf] font-medium">grounded in your documentation</span> using RAG.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
            >
              <Button asChild size="lg" className="rounded-lg w-full sm:w-auto">
                <a
                  href="https://www.overleaf.com/read/vdqywdqywyhr#693113"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                  aria-label="View thesis"
                >
                  View thesis
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-lg w-full sm:w-auto hover:bg-[var(--brand-accent)]/10 hover:text-[var(--brand-accent)] hover:border-[var(--brand-accent)]/50 transition-all duration-300"
              >
                <a href="/login" aria-label="Explore prototype">
                  Explore prototype
                </a>
              </Button>
            </motion.div>
          </motion.div>

          {/* Right: Demo */}
          <motion.div
            className="hidden md:flex w-full justify-center"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <SecurityCodeDemo className="relative glow-accent w-full" />
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
