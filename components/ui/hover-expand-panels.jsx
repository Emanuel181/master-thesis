"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile"

// --- tiny helpers ---
function clampIndex(idx, len) {
  if (len <= 0) return 0
  return Math.min(Math.max(idx, 0), len - 1)
}

const defaultItems = [
  {
    title: "Agentic RAG",
    description: "LLMs act as central controllers orchestrating reasoning and tool interaction",
    gradient: "linear-gradient(135deg, #6366f1, #818cf8, #a78bfa, #6366f1)",
  },
  {
    title: "Zero hallucinations",
    description: "Knowledge-grounded fixes eliminate unreliable or fabricated remediation suggestions",
    gradient: "linear-gradient(135deg, #3b82f6, #60a5fa, #93c5fd, #3b82f6)",
  },
  {
    title: "Security knowledge",
    description: "RAG retrieves best-practice guidelines, relevant code snippets, and historical fixes",
    gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa, #c4b5fd, #8b5cf6)",
  },
  {
    title: "Context-aware",
    description: "Specialized retrieval methods yield substantial improvements over baselines",
    gradient: "linear-gradient(135deg, #06b6d4, #22d3ee, #67e8f9, #06b6d4)",
  },
]

/**
 * HoverExpandPanels - Panels with animated gradients that expand on hover.
 */
export function HoverExpandPanels({
  items = defaultItems,
  defaultActive = 0,
  activeGrow = 5,
  className,
  heightClassName = "h-[320px] sm:h-[400px] md:h-[480px] lg:h-[520px]",
}) {
  const containerRef = React.useRef(null)
  const safeDefault = clampIndex(defaultActive, items.length)
  const [active, setActive] = React.useState(safeDefault)
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isMobileOrTablet = isMobile || isTablet

  const [reduceMotion, setReduceMotion] = React.useState(false)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setReduceMotion(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false)
    }
  }, [])

  const gridTemplateColumns = isMobile
    ? "1fr"
    : items.map((_, i) => (i === active ? `${activeGrow}fr` : "1fr")).join(" ")

  return (
    <div
      ref={containerRef}
      data-hover-panels
      className={cn(
        "relative w-full overflow-visible",
        "p-2 sm:p-4 md:p-6 lg:p-8",
        heightClassName,
        className,
      )}
    >
      <div
        className={cn(
          "relative z-10 h-full w-full gap-2 sm:gap-3 md:gap-4 lg:gap-5",
          isMobile ? "flex flex-col" : "grid"
        )}
        role="tablist"
        aria-label="Feature highlight panels"
        style={isMobile ? undefined : {
          gridTemplateColumns,
          transition: reduceMotion ? undefined : "grid-template-columns 350ms cubic-bezier(0.33, 1, 0.68, 1)",
        }}
      >
        {items.map((item, i) => {
          const isActive = i === active
          const gradient = item.gradient ?? defaultItems[0].gradient
          const animDuration = 6 + i * 2

          return (
            <div
              key={`${item.title}-${i}`}
              role="tabpanel"
              aria-label={item.title}
              onMouseEnter={() => setActive(i)}
              onClick={() => isMobile && setActive(i)}
              className={cn(
                "relative min-w-0 overflow-hidden rounded-2xl sm:rounded-3xl",
                "outline-none cursor-pointer",
                "transition-shadow duration-300",
                isMobile ? "h-[160px] sm:h-[200px]" : "h-full",
                isActive && !isMobileOrTablet
                  ? "shadow-2xl shadow-black/30"
                  : "shadow-lg shadow-black/15",
              )}
            >
              {/* Animated gradient background */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  backgroundImage: gradient,
                  backgroundSize: "300% 300%",
                  animation: reduceMotion ? "none" : `panelGradientShift ${animDuration}s ease-in-out infinite`,
                }}
              />

              {/* Subtle top-left radial highlight for depth */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at 15% 20%, rgba(255,255,255,0.18), transparent 55%)",
                }}
              />

              {/* Labels - always visible, positioned bottom-left */}
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 md:p-8 lg:p-10 z-20">
                <div
                  className={cn(
                    "max-w-[50ch] transition-all duration-300",
                    isActive || isMobile ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  )}
                >
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold leading-tight tracking-tight text-white">
                    {item.title}
                  </div>
                  {item.description && (
                    <div className="mt-2 sm:mt-3 text-sm sm:text-base md:text-lg text-white/80 line-clamp-2 leading-relaxed">
                      {item.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Active indicator dot */}
              <div
                className={cn(
                  "absolute top-4 right-4 sm:top-5 sm:right-5 md:top-6 md:right-6 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white transition-opacity duration-300",
                  isActive ? "opacity-100" : "opacity-30"
                )}
              />
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes panelGradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  )
}

export default HoverExpandPanels
