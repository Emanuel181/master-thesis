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
    <section id="features" className="relative z-10 py-16 sm:py-20 md:py-24 lg:py-32 pb-8 sm:pb-10 md:pb-12 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-12 relative w-full">
        {/* Header - Server rendered for SEO */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16 lg:mb-20">
          <div className="text-center px-2">
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-muted-foreground mb-4 sm:mb-5 md:mb-6 font-medium">
              Vulnerability management is critical.
            </p>
            <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
              The next frontier is{" "}
              <PointerHighlight
                containerClassName="px-1"
                rectangleClassName="border-accent/60 bg-accent/10"
                pointerClassName="text-accent"
              >
                <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">agentic remediation</span>
              </PointerHighlight>
            </div>
          </div>
          <div className="h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent w-16 sm:w-20 md:w-24 mx-auto mt-6 sm:mt-7 md:mt-8" />
        </div>

        {/* Features Grid - Client component for animations */}
        <FeaturesGrid />
      </div>
    </section>
  );
}
