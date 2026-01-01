"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// --- tiny helpers ---
function clampIndex(idx, len) {
  if (len <= 0) return 0
  return Math.min(Math.max(idx, 0), len - 1)
}

const DEFAULT_PANEL_GRADIENT = "radial-gradient(900px circle at 15% 20%, rgba(255,255,255,0.35), transparent 45%), linear-gradient(115deg, rgba(14,165,233,1), rgba(45,212,191,1), rgba(99,102,241,1))"

// Default items based on VulnIQ thesis and landing page content
// Add your product demo images to the public folder and reference them here
const defaultItems = [
  {
    title: "Agentic RAG",
    description: "LLMs act as central controllers orchestrating reasoning and tool interaction",
    image: "/demo/agentic-rag.png", // Add your image to public/demo/
  },
  {
    title: "Zero Hallucinations",
    description: "Knowledge-grounded fixes eliminate unreliable or fabricated remediation suggestions",
    image: "/demo/zero-hallucinations.png",
  },
  {
    title: "Security Knowledge",
    description: "RAG retrieves best-practice guidelines, relevant code snippets, and historical fixes",
    image: "/demo/security-knowledge.png",
  },
  {
    title: "Context-Aware",
    description: "Specialized retrieval methods yield substantial improvements over baselines",
    image: "/demo/context-aware.png",
  },
]

/**
 * @typedef {Object} HoverExpandItem
 * @property {string} title
 * @property {string} [description]
 * @property {string} [href]
 * @property {string} [image] - Image URL for the panel background
 * @property {string} [gradient] - CSS background-image string (fallback if no image)
 */

/**
 * HoverExpandPanels - Lightweight hover-expand gradient slider
 * Uses CSS Grid transition for the expand, animated gradients for the panels
 * 
 * @param {Object} props
 * @param {HoverExpandItem[]} [props.items] - Array of panel items
 * @param {number} [props.defaultActive=0] - Default active panel index
 * @param {number} [props.activeGrow=6] - How much the active panel grows
 * @param {boolean} [props.focusOnHover=false] - Move DOM focus on hover
 * @param {boolean} [props.animateOnlyActive=false] - Only animate active panel gradient
 * @param {string} [props.className] - Additional class names
 * @param {string} [props.heightClassName] - Height class names
 */
export function HoverExpandPanels({
  items = defaultItems,
  defaultActive = 0,
  activeGrow = 6,
  animateOnlyActive = false,
  className,
  heightClassName = "h-[340px] md:h-[380px]",
  entryAnimationDelay = 80, // ms between each step during entry animation
}) {
  const containerRef = React.useRef(null)
  const timeoutRef = React.useRef(null)
  const safeDefault = clampIndex(defaultActive, items.length)
  // Start with first panel fully expanded (looks like one rectangle)
  const [active, setActive] = React.useState(0)
  const [isAnimating, setIsAnimating] = React.useState(true) // Start in animating state

  // Check reduced motion preference once on mount
  const [reduceMotion, setReduceMotion] = React.useState(false)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setReduceMotion(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false)
    }
  }, [])

  // Entry animation: starts as one big rectangle, then splits and cycles through panels
  React.useEffect(() => {
    if (reduceMotion || items.length === 0) return

    const container = containerRef.current
    if (!container) return

    const clearTimeouts = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    const runAnimation = () => {
      setIsAnimating(true)
      setActive(0) // Start with first panel expanded (appears as one rectangle)

      // Animation sequence: cycle through each panel left to right
      let step = 0
      const totalSteps = items.length

      const runStep = () => {
        step++
        if (step < totalSteps) {
          setActive(step)
          timeoutRef.current = setTimeout(runStep, entryAnimationDelay)
        } else {
          // Animation complete - stay on last panel, enable hover
          setTimeout(() => setIsAnimating(false), 50) // Small delay to ensure state updates
        }
      }

      // Start cycling after initial delay
      timeoutRef.current = setTimeout(runStep, entryAnimationDelay)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          // Entering view - start animation
          runAnimation()
        }
        // Don't reset on leaving view - keep current state
      },
      { threshold: 0.2 }
    )

    observer.observe(container)

    return () => {
      observer.disconnect()
      clearTimeouts()
    }
  }, [reduceMotion, items.length, entryAnimationDelay])

  // Animate the GRID track sizes instead of using Framer Motion
  const gridTemplateColumns = items
    .map((_, i) => (i === active ? `${activeGrow}fr` : "1fr"))
    .join(" ")

  // Handle hover - only when not animating
  const handleMouseEnter = (index) => {
    if (!isAnimating) {
      setActive(index)
    }
  }

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "relative w-full overflow-visible", 
        "p-4 md:p-6", 
        heightClassName, 
        className,
        isAnimating && "pointer-events-none" // Block interactions during animation
      )}
    >
      <div
        className="relative z-10 grid h-full w-full gap-4"
        role="tablist"
        aria-label="Hover-expand gradient panels"
        style={{
          gridTemplateColumns,
          transition: reduceMotion ? undefined : "grid-template-columns 220ms cubic-bezier(0, 0, 0.2, 1)",
        }}
      >
        {items.map((item, i) => {
          const isActive = i === active
          const gradient = item.gradient ?? DEFAULT_PANEL_GRADIENT
          const dur = item.gradientDuration ?? 10

          const shouldAnimate = !reduceMotion && (!animateOnlyActive || isActive)

          return (
            <div
              key={`${item.title}-${i}`}
              role="tabpanel"
              aria-label={item.title}
              onMouseEnter={() => handleMouseEnter(i)}
              className={cn(
                "relative h-full min-w-0 overflow-hidden rounded-2xl",
                "bg-white/5",
                "outline-none",
                "transition-all duration-300 ease-out",
                !isAnimating && isActive && "-translate-y-1 shadow-2xl shadow-black/30 scale-[1.02]"
              )}
            >
              {/* Gradient background */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  backgroundImage: gradient,
                  backgroundSize: "200% 200%",
                  backgroundPosition: "0% 50%",
                  transform: "translateZ(0)",
                  animation: shouldAnimate ? `panelGradientShift ${dur}s ease-in-out infinite` : "none",
                }}
              />

              {/* Product demo image - smaller, positioned in center */}
              {item.image && (
                <div className={cn(
                  "absolute inset-4 md:inset-6 flex items-center justify-center",
                  "transition-all duration-300 ease-out",
                  isActive ? "opacity-100 scale-100" : "opacity-70 scale-95"
                )}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
              )}

              {/* Active polish without CSS filters */}
              <div
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 transition-opacity duration-200",
                  isActive
                    ? "opacity-100 bg-[radial-gradient(800px_circle_at_25%_15%,rgba(255,255,255,0.22),transparent_55%)]"
                    : "opacity-0"
                )}
              />

              {/* Readability overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

              {/* Labels */}
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                <div
                  className={cn(
                    "max-w-[50ch] text-white",
                    "transition-all duration-200 ease-out motion-reduce:transition-none",
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  )}
                >
                  <div className="text-lg md:text-xl font-semibold leading-tight">{item.title}</div>
                  {item.description && (
                    <div className="mt-1 text-sm md:text-[15px] text-white/85">{item.description}</div>
                  )}
                </div>
              </div>
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
