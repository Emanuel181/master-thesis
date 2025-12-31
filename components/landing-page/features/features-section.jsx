import {
  Database,
  Github,
  Gitlab,
  Search,
  Wrench,
  ShieldCheck,
  FileText,
  Settings2,
  Sparkles,
} from "lucide-react";
import { PointerHighlight } from '@/components/ui/pointer-highlight';

// Import the client-side FeaturesGrid for animations
import { FeaturesGrid } from './features-grid';

/**
 * Server-rendered Features Section wrapper.
 * The header content is server-rendered for SEO.
 * FeaturesGrid is a client component for animations.
 */
export function FeaturesSection({ techLogos }) {
  return (
    <section id="features" className="relative z-10 py-8 sm:py-12 md:py-16 lg:py-24 xl:py-32 pb-4 sm:pb-6 md:pb-8 lg:pb-12 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1fb6cf]/[0.02] to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-12 relative w-full">
        {/* Header - Server rendered for SEO */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12 lg:mb-16 xl:mb-20">
          <div className="text-center px-2">
            <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-muted-foreground mb-3 sm:mb-4 md:mb-6 font-medium">
              Vulnerability management is critical.
            </p>
            <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
              The next frontier is{" "}
              <PointerHighlight
                containerClassName="px-1"
                rectangleClassName="border-[var(--brand-accent)]/60 bg-[var(--brand-accent)]/10"
                pointerClassName="text-[var(--brand-accent)]"
              >
                <span className="gradient-text">agentic remediation</span>
              </PointerHighlight>
            </div>
          </div>
          <div className="accent-line-center w-12 sm:w-16 md:w-20 lg:w-24 mx-auto mt-4 sm:mt-6 md:mt-8" />
        </div>

        {/* Features Grid - Client component for animations */}
        <FeaturesGrid />
      </div>
    </section>
  );
}
