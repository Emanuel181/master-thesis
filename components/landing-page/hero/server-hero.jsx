import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, ExternalLink } from 'lucide-react';

/**
 * Server-rendered Hero component for SEO and fast initial paint.
 * No 'use client' - this is a React Server Component.
 * All interactive elements are handled by the client wrapper.
 */
export function ServerHero() {
  return (
    <section
      id="hero"
      className="relative z-10 w-full min-h-[100svh] md:min-h-screen flex flex-col justify-center hero-gradient px-3 sm:px-4 overflow-hidden"
    >
      {/* Decorative elements - CSS only, no JS */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-[#1fb6cf]/10 rounded-full blur-[100px] pointer-events-none hidden sm:block" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#1fb6cf]/5 rounded-full blur-[120px] pointer-events-none hidden sm:block" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 w-full pt-16 sm:pt-24 md:pt-32 pb-8 sm:pb-12 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">
          {/* Left: Copy - CSS animations for performance */}
          <div className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 text-center md:text-left w-full animate-fade-in-up">
            <div className="flex justify-center md:justify-start gap-3">
              <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 text-[9px] xs:text-[10px] sm:text-xs font-semibold text-[#1fb6cf] bg-[#1fb6cf]/10 border border-[#1fb6cf]/20 rounded-full backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1fb6cf] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[#1fb6cf]"></span>
                </span>
                Open beta
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1]">
              <span className="text-[var(--brand-primary)] dark:text-foreground">Security </span>
              <br className="hidden sm:block" />
              <span className="text-[var(--brand-primary)] dark:text-foreground">remediation </span>
              <br className="hidden sm:block" />
              <span className="gradient-text">without </span>
              <br className="hidden sm:block" />
              <span className="gradient-text">hallucinations.</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-[var(--brand-primary)]/70 dark:text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
              Autonomous AI agents that detect, patch, and verify vulnerabilities. Every fix is{' '}
              <span className="text-[#1fb6cf] font-medium">grounded in your documentation</span> using RAG.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Button asChild size="lg" className="rounded-lg w-full sm:w-auto bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 dark:bg-white dark:hover:bg-white/90">
                <a
                  href="https://www.overleaf.com/read/vdqywdqywyhr#693113"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center text-white dark:text-[var(--brand-primary)]"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Paper in progress...
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-lg w-full sm:w-auto border-[var(--brand-accent)]/30 hover:bg-[var(--brand-accent)]/10 hover:border-[var(--brand-accent)]/50">
                <Link href="/demo">
                  Try demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right: Hero demo placeholder - will be enhanced with animated code demo after hydration */}
          <div id="hero-demo-placeholder" className="relative hidden md:flex items-center justify-center">
            <div className="relative w-full max-w-lg aspect-square">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#1fb6cf]/20 to-[#1fb6cf]/10 rounded-full blur-3xl" />
              
              {/* Static placeholder - will be covered by animated code demo */}
              <div className="relative z-10 w-full h-full rounded-2xl bg-gradient-to-br from-[var(--brand-accent)]/20 to-[var(--brand-primary)]/10 border border-[var(--brand-accent)]/30 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-xl bg-[var(--brand-accent)]/20 flex items-center justify-center">
                    <svg className="w-12 h-12 text-[var(--brand-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">AI-Powered Security</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
  );
}
