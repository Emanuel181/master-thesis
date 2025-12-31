import { ServerHero } from '@/components/landing-page/hero/server-hero';
import { FeaturesSection } from '@/components/landing-page/features/features-section';
import { ClientLandingWrapper } from '@/components/landing-page/client-landing-wrapper';

/**
 * Landing Page - Server Component Architecture
 * 
 * This page is a Server Component by default (no 'use client' directive).
 * Critical SEO content (hero text, feature headers) is server-rendered for:
 * - Better FCP/LCP (text visible on first paint)
 * - Full SEO indexability (Google sees real content, not JS placeholders)
 * - Smaller initial JS bundle
 * 
 * Interactive/animated content is lazy-loaded via ClientLandingWrapper.
 */
export default function LandingPage() {
  return (
    <ClientLandingWrapper>
      {/* Server-rendered hero with full SEO content */}
      <ServerHero />
      
      {/* Server-rendered features section header + lazy client grid */}
      <FeaturesSection />
    </ClientLandingWrapper>
  );
}
