'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Pure CSS animated hero - no framer-motion for fast initial paint
export function StaticHero() {
  return (
    <section
      id="hero"
      className="relative z-10 w-full min-h-[100svh] md:min-h-screen flex flex-col justify-center hero-gradient px-3 sm:px-4 overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-[#1fb6cf]/10 rounded-full blur-[100px] pointer-events-none hidden sm:block" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#1fb6cf]/5 rounded-full blur-[120px] pointer-events-none hidden sm:block" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 w-full pt-16 sm:pt-24 md:pt-32 pb-8 sm:pb-12 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">
          {/* Left: Copy - uses CSS animations */}
          <div className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 text-center md:text-left w-full animate-fade-in-up">
            <div className="flex justify-center md:justify-start gap-3" style={{ animationDelay: '0ms' }}>
              <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 text-[9px] xs:text-[10px] sm:text-xs font-semibold text-[#1fb6cf] bg-[#1fb6cf]/10 border border-[#1fb6cf]/20 rounded-full backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1fb6cf] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[#1fb6cf]"></span>
                </span>
                Open beta
              </span>
            </div>

            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1] animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              <span className="text-foreground">Security</span>
              <br />
              <span className="text-foreground">remediation</span>
              <br />
              <span className="gradient-text">without</span>
              <br />
              <span className="gradient-text">hallucinations.</span>
            </h1>

            <p
              className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              Autonomous AI agents that detect, patch, and verify vulnerabilities. Every fix is{' '}
              <span className="text-[#1fb6cf] font-medium">grounded in your documentation</span> using RAG.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start animate-fade-in-up"
              style={{ animationDelay: '300ms' }}
            >
              <Button asChild size="lg" className="rounded-lg w-full sm:w-auto bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 dark:bg-white dark:hover:bg-white/90">
                <a
                  href="https://www.overleaf.com/read/vdqywdqywyhr#693113"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-white dark:text-[var(--brand-primary)]"
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
            </div>
          </div>

          {/* Right: Demo placeholder */}
          <div className="hidden md:flex w-full justify-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="min-h-[400px] w-full animate-pulse bg-muted/10 rounded-lg" />
          </div>
        </div>
      </div>
    </section>
  );
}
