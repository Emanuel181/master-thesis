'use client';

import React from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Pure CSS animated hero - no framer-motion for fast initial paint
export function StaticHero() {
  return (
    <section
      id="hero"
      className="relative z-10 w-full min-h-svh md:min-h-screen flex flex-col justify-center bg-gradient-to-b from-background via-accent/5 to-background px-3 sm:px-4 overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl pointer-events-none hidden sm:block" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none hidden sm:block" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 w-full pt-16 sm:pt-20 md:pt-24 lg:pt-32 pb-8 sm:pb-12 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">
          {/* Left: Copy - uses CSS animations */}
          <div className="space-y-6 sm:space-y-7 md:space-y-8 text-center md:text-left w-full animate-fade-in-up">
            <div className="flex justify-center md:justify-start gap-3" style={{ animationDelay: '0ms' }}>
              <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 text-xs font-semibold text-accent bg-accent/10 border border-accent/20 rounded-full backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                Open beta
              </span>
            </div>

            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              <span className="text-primary dark:text-foreground">Security </span>
              <br className="hidden sm:block" />
              <span className="text-primary dark:text-foreground">remediation </span>
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">without </span>
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">hallucinations.</span>
            </h1>

            <p
              className="text-base sm:text-lg md:text-xl text-primary/70 dark:text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              Autonomous AI agents that detect, patch, and verify vulnerabilities. Every fix is{' '}
              <span className="text-accent font-medium">grounded in your documentation</span> using RAG.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up"
              style={{ animationDelay: '300ms' }}
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
            </div>
          </div>

          {/* Right: Demo placeholder */}
          <div className="hidden md:flex w-full justify-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="min-h-96 w-full animate-pulse bg-muted/10 rounded-lg" />
          </div>
        </div>
      </div>
    </section>
  );
}
