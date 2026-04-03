'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

const SecurityCodeDemo = dynamic(
  () => import('./security-code-demo').then(mod => mod.SecurityCodeDemo),
  { ssr: false, loading: () => <div className="min-h-96 animate-pulse bg-muted/10 rounded-lg" /> }
);

// Start visible to avoid layout shift when replacing ServerHero
// Only the SecurityCodeDemo animates in as the enhancement
const containerVariants = {
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0,
      delayChildren: 0,
    },
  },
};

const itemVariants = {
  visible: {
    opacity: 1,
    y: 0,
  },
};

export function AnimatedHero({ scrollContainerRef }) {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ container: scrollContainerRef });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  
  const heroOpacity = useTransform(smoothProgress, [0, 0.12], [1, 0]);
  const heroY = useTransform(smoothProgress, [0, 0.12], [0, -40]);
  
  // Scroll-linked shrinking border effect
  const horizontalInset = useTransform(smoothProgress, [0, 0.15], [0, 32]);
  const borderRadius = useTransform(smoothProgress, [0, 0.15], [0, 24]);

  return (
    <motion.section
      ref={heroRef}
      id="hero"
      className="relative z-10 w-full min-h-svh md:min-h-screen flex flex-col justify-center bg-gradient-to-b from-background via-accent/5 to-background overflow-hidden"
      style={{
        opacity: heroOpacity,
        y: heroY,
        marginLeft: horizontalInset,
        marginRight: horizontalInset,
        borderRadius: borderRadius,
      }}
    >
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl pointer-events-none hidden sm:block" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none hidden sm:block" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full pt-16 sm:pt-20 md:pt-24 lg:pt-32 pb-8 sm:pb-12 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">
          {/* Left: Copy - No entrance animation to prevent layout shift */}
          <motion.div
            className="space-y-6 sm:space-y-7 md:space-y-8 text-center md:text-left w-full"
            variants={containerVariants}
            initial="visible"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="flex justify-center md:justify-start gap-3">
              <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 text-xs font-semibold text-accent bg-accent/10 border border-accent/20 rounded-full backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                Open beta
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight"
            >
              <span className="text-primary dark:text-foreground">Security </span>
              <br className="hidden sm:block" />
              <span className="text-primary dark:text-foreground">remediation </span>
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">without </span>
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">hallucinations.</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg md:text-xl text-primary/70 dark:text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0"
            >
              Autonomous AI agents that detect, patch, and verify vulnerabilities. Every fix is{' '}
              <span className="text-accent font-medium">grounded in your documentation</span> using RAG.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button asChild size="lg" className="rounded-lg w-full sm:w-auto bg-primary hover:bg-primary/90 dark:bg-white dark:hover:bg-white/90">
                <a
                  href="https://www.overleaf.com/read/vdqywdqywyhr#693113"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-white dark:text-primary"
                  aria-label="View thesis"
                >
                  View thesis
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-lg w-full sm:w-auto hover:bg-accent/10 hover:text-accent hover:border-accent/50 transition-all duration-300"
              >
                <a href="/login" aria-label="Explore VulnIQ">
                  Explore VulnIQ
                </a>
              </Button>
            </motion.div>
          </motion.div>

          {/* Right: Demo - This is the only part that animates in as an enhancement */}
          <motion.div
            className="hidden md:flex w-full justify-center"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <SecurityCodeDemo className="relative glow-accent w-full" />
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
