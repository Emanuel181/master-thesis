import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, ExternalLink } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

/**
 * Server-rendered Hero component for SEO and fast initial paint.
 * No 'use client' - this is a React Server Component.
 * All interactive elements are handled by the client wrapper.
 */
export async function ServerHero() {
  const t = await getTranslations('hero');
  return (
    <section
      id="hero"
      className="relative z-10 w-full min-h-svh md:min-h-screen flex flex-col justify-center bg-gradient-to-b from-background via-accent/5 to-background px-3 sm:px-4 overflow-hidden"
    >
      {/* Decorative elements - CSS only, no JS */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl pointer-events-none hidden sm:block" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none hidden sm:block" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 w-full pt-16 sm:pt-20 md:pt-24 lg:pt-32 pb-8 sm:pb-12 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">
          {/* Left: Copy - CSS animations for performance */}
          <div className="space-y-6 sm:space-y-7 md:space-y-8 text-center md:text-left w-full animate-fade-in-up">
            <div className="flex justify-center md:justify-start gap-3">
              <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 text-xs font-semibold text-accent bg-accent/10 border border-accent/20 rounded-full backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                {t('badge')}
              </span>
            </div>

            <h1 className="font-bold tracking-tight leading-tight" style={{ fontSize: 'clamp(2.25rem, 4.5vw + 0.75rem, 4.5rem)' }}>
              <span className="text-primary dark:text-foreground">{t('headingPart1')} </span>
              <br className="hidden sm:block" />
              <span className="text-primary dark:text-foreground">{t('headingPart2')} </span>
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">{t('headingPart3')} </span>
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">{t('headingPart4')}</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
              {t('subtitleBefore')}<span className="text-accent font-medium">{t('subtitleHighlight')}</span>{t('subtitleAfter')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button asChild size="lg" className="rounded-lg w-full sm:w-auto">
                <a
                  href="https://www.overleaf.com/read/vdqywdqywyhr#693113"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {t('paperButton')}
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-lg w-full sm:w-auto">
                <Link href="/demo">
                  {t('demoButton')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right: Hero demo placeholder - portal target for SecurityCodeDemo after hydration */}
          <div id="hero-demo-placeholder" className="relative hidden md:flex items-center justify-center">
            <div className="relative w-full max-w-lg aspect-square" />
          </div>
        </div>
      </div>
    </section>
    
  );
}
