"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    Database,
    Sparkles,
    Search,
    ShieldCheck,
    FileText,
    Settings2,
    CheckCircle2,
    XCircle,
    Github,
    Gitlab,
    Wrench,
    Zap,
    Lock,
    Brain,
} from "lucide-react"

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
    title: "Zero hallucinations",
    description: "Knowledge-grounded fixes eliminate unreliable or fabricated remediation suggestions",
    image: "/demo/zero-hallucinations.png",
  },
  {
    title: "Security knowledge",
    description: "RAG retrieves best-practice guidelines, relevant code snippets, and historical fixes",
    image: "/demo/security-knowledge.png",
  },
  {
    title: "Context-aware",
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
  activeGrow = 5,
  animateOnlyActive = false,
  className,
  heightClassName = "h-[320px] sm:h-[400px] md:h-[480px] lg:h-[520px]",
  entryAnimationDelay = 350, // ms between each step during entry animation
}) {
  const containerRef = React.useRef(null)
  const timeoutRef = React.useRef(null)
  const safeDefault = clampIndex(defaultActive, items.length)
  // Start with first panel fully expanded (looks like one rectangle)
  const [active, setActive] = React.useState(0)
  const [isAnimating, setIsAnimating] = React.useState(true) // Start in animating state
  const isMobile = useIsMobile()

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

  // Animate the GRID track sizes with spring physics
  // On mobile, use rows instead of columns
  const gridTemplateColumns = isMobile
    ? "1fr"
    : items.map((_, i) => (i === active ? `${activeGrow}fr` : "1fr")).join(" ")

  const gridTemplateRows = isMobile
    ? items.map(() => "1fr").join(" ")
    : undefined

  // Handle hover - only when not animating
  const handleMouseEnter = (index) => {
    if (!isAnimating) {
      setActive(index)
    }
  }

  // Panel-specific animations based on index - unique animations for hover panels
  const getPanelAnimation = (index) => {
    const animations = [
      <PanelAgenticRAG key="agentic-rag" />,
      <PanelZeroHallucinations key="zero-hallucinations" />,
      <PanelSecurityKnowledge key="security-knowledge" />,
      <PanelContextAware key="context-aware" />,
    ];
    return animations[index] || animations[0];
  }

  return (
    <div 
      ref={containerRef} 
      data-hover-panels
      className={cn(
        "relative w-full overflow-visible", 
        "p-2 sm:p-4 md:p-6 lg:p-8", 
        heightClassName, 
        className,
        isAnimating && "pointer-events-none" // Block interactions during animation
      )}
    >
      <div
        className={cn(
          "relative z-10 h-full w-full gap-2 sm:gap-3 md:gap-4 lg:gap-5",
          isMobile ? "flex flex-col" : "grid"
        )}
        role="tablist"
        aria-label="Hover-expand gradient panels"
        style={isMobile ? undefined : {
          gridTemplateColumns,
          transition: reduceMotion ? undefined : "grid-template-columns 600ms cubic-bezier(0.25, 0.1, 0.25, 1)",
        }}
      >
        {items.map((item, i) => {
          const isActive = i === active
          const gradient = item.gradient ?? DEFAULT_PANEL_GRADIENT
          const dur = item.gradientDuration ?? 10

          const shouldAnimate = !reduceMotion && (!animateOnlyActive || isActive)

          return (
            <motion.div
              key={`${item.title}-${i}`}
              role="tabpanel"
              aria-label={item.title}
              onMouseEnter={() => handleMouseEnter(i)}
              onClick={() => isMobile && setActive(i)}
              className={cn(
                "relative min-w-0 overflow-hidden rounded-2xl sm:rounded-3xl",
                "bg-white/5 backdrop-blur-sm",
                "outline-none",
                "cursor-pointer",
                isMobile ? "h-[180px] sm:h-[220px]" : "h-full",
              )}
              initial={false}
              animate={{
                y: !isAnimating && isActive && !isMobile ? -6 : 0,
                scale: !isAnimating && isActive && !isMobile ? 1.01 : 1,
              }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              style={{
                boxShadow: !isAnimating && isActive && !isMobile 
                  ? "0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.1)" 
                  : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
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

              {/* Animated content like features cards */}
              <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10 z-0 opacity-40 sm:opacity-50 md:opacity-100">
                {getPanelAnimation(i)}
              </div>

              {/* Active glow effect */}
              <motion.div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: isActive ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                style={{
                  background: "radial-gradient(800px circle at 25% 15%, rgba(255,255,255,0.25), transparent 55%)",
                }}
              />

              {/* Scan line effect on active */}
              <motion.div
                className="absolute inset-x-0 h-[2px] pointer-events-none"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                }}
                initial={{ top: 0, opacity: 0 }}
                animate={{
                  top: isActive ? ["0%", "100%"] : "0%",
                  opacity: isActive ? [0, 0.6, 0.6, 0] : 0,
                }}
                transition={{
                  duration: 2.5,
                  repeat: isActive ? Infinity : 0,
                  ease: "linear",
                  repeatDelay: 1,
                }}
              />

              {/* Readability overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 z-10" />

              {/* Labels */}
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 md:p-6 lg:p-8 z-20">
                <motion.div
                  className="max-w-[50ch] text-white"
                  initial={false}
                  animate={{
                    opacity: isMobile || isActive ? 1 : 0,
                    y: isMobile || isActive ? 0 : 10,
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold leading-tight tracking-tight">{item.title}</div>
                  {item.description && (
                    <div className="mt-1.5 sm:mt-2 text-sm sm:text-base md:text-lg text-white/80 line-clamp-2 leading-relaxed">{item.description}</div>
                  )}
                </motion.div>
              </div>

              {/* Active indicator dot */}
              <motion.div
                className="absolute top-4 right-4 sm:top-5 sm:right-5 md:top-6 md:right-6 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white"
                animate={{
                  scale: isActive ? [1, 1.3, 1] : 1,
                  opacity: isActive ? 1 : 0.3,
                  boxShadow: isActive 
                    ? "0 0 12px 4px rgba(255,255,255,0.5)" 
                    : "0 0 0px 0px transparent",
                }}
                transition={{
                  duration: 1.5,
                  repeat: isActive ? Infinity : 0,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
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

// Unique animation components for hover expand panels (different from features grid)
const PanelAgenticRAG = () => {
    const orbitRadius = { base: 50, sm: 60, md: 70, lg: 80 };
    
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[380px] lg:max-w-[420px] flex flex-col gap-4 sm:gap-6">
                {/* Central controller with orbiting tools */}
                <div className="relative flex items-center justify-center h-32 sm:h-40 md:h-48 lg:h-56">
                    {/* Outer ring glow */}
                    <motion.div
                        className="absolute w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-52 lg:h-52 rounded-full"
                        style={{
                            background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
                        }}
                        animate={{ 
                            scale: [1, 1.15, 1],
                            opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    
                    {/* Central brain/controller */}
                    <motion.div
                        className="absolute w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-white/20 to-white/5 border-2 border-white/40 flex items-center justify-center z-10 backdrop-blur-sm"
                        style={{
                            boxShadow: "0 0 40px rgba(255,255,255,0.2), inset 0 0 20px rgba(255,255,255,0.1)",
                        }}
                        animate={{ 
                            scale: [1, 1.08, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        <Brain className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 text-white/90" />
                    </motion.div>
                    
                    {/* Orbiting tool icons */}
                    {[
                        { Icon: Search, color: "from-cyan-400/30 to-cyan-600/20" },
                        { Icon: Database, color: "from-emerald-400/30 to-emerald-600/20" },
                        { Icon: FileText, color: "from-violet-400/30 to-violet-600/20" },
                        { Icon: Zap, color: "from-amber-400/30 to-amber-600/20" },
                    ].map(({ Icon, color }, i) => (
                        <motion.div
                            key={i}
                            className={`absolute w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br ${color} border border-white/30 flex items-center justify-center backdrop-blur-sm`}
                            style={{
                                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                            }}
                            animate={{
                                x: [
                                    Math.cos(((i * 90) - 90) * Math.PI / 180) * 55,
                                    Math.cos(((i * 90) + 270) * Math.PI / 180) * 55,
                                ],
                                y: [
                                    Math.sin(((i * 90) - 90) * Math.PI / 180) * 55,
                                    Math.sin(((i * 90) + 270) * Math.PI / 180) * 55,
                                ],
                                scale: [1, 1.1, 1],
                            }}
                            transition={{
                                x: { duration: 12, repeat: Infinity, ease: "linear" },
                                y: { duration: 12, repeat: Infinity, ease: "linear" },
                                scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 },
                            }}
                        >
                            <Icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-white/80" />
                        </motion.div>
                    ))}
                    
                    {/* Connection lines */}
                    <svg className="absolute w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
                        {[0, 1, 2, 3].map((i) => (
                            <motion.circle
                                key={i}
                                cx="50%"
                                cy="50%"
                                r="55"
                                fill="none"
                                stroke="rgba(255,255,255,0.15)"
                                strokeWidth="1"
                                strokeDasharray="8 8"
                                animate={{ 
                                    rotate: [0, 360],
                                }}
                                transition={{
                                    duration: 20,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                                style={{ transformOrigin: "center" }}
                            />
                        ))}
                    </svg>
                </div>
            </div>
        </div>
    );
};

const PanelZeroHallucinations = () => {
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[380px] lg:max-w-[420px] flex flex-col gap-6 sm:gap-8 items-center">
                {/* Verification chain - larger and more prominent */}
                <div className="flex items-center gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                    {/* Invalid source */}
                    <motion.div
                        className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-xl bg-gradient-to-br from-red-500/30 to-red-600/20 border-2 border-red-400/50 flex items-center justify-center backdrop-blur-sm"
                        style={{
                            boxShadow: "0 0 30px rgba(239,68,68,0.3)",
                        }}
                        animate={{ 
                            opacity: [0.6, 1, 0.6],
                            scale: [0.95, 1.05, 0.95],
                        }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <XCircle className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-red-400" />
                    </motion.div>
                    
                    {/* Verification arrow */}
                    <div className="relative w-16 sm:w-20 md:w-28 lg:w-36 h-3 sm:h-4">
                        <div className="absolute inset-0 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full w-1/3 bg-gradient-to-r from-red-400/60 via-yellow-400/60 to-green-400/60 rounded-full"
                                animate={{ x: ["-100%", "400%"] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </div>
                        {/* Arrow head */}
                        <motion.div
                            className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[8px] sm:border-l-[10px] md:border-l-[12px] border-l-green-400/60 border-y-[5px] sm:border-y-[6px] md:border-y-[8px] border-y-transparent"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </div>
                    
                    {/* Verified output */}
                    <motion.div
                        className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-xl bg-gradient-to-br from-green-500/30 to-green-600/20 border-2 border-green-400/50 flex items-center justify-center backdrop-blur-sm"
                        style={{
                            boxShadow: "0 0 30px rgba(34,197,94,0.3)",
                        }}
                        animate={{ 
                            opacity: [0.6, 1, 0.6],
                            scale: [0.95, 1.05, 0.95],
                        }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    >
                        <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-green-400" />
                    </motion.div>
                </div>
                
                {/* Shield verification badge */}
                <motion.div
                    className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm"
                    animate={{ 
                        scale: [1, 1.03, 1],
                        boxShadow: [
                            "0 0 0 0 rgba(255,255,255,0)",
                            "0 0 20px 4px rgba(255,255,255,0.15)",
                            "0 0 0 0 rgba(255,255,255,0)",
                        ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-400" />
                </motion.div>
            </div>
        </div>
    );
};

const PanelSecurityKnowledge = () => {
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[380px] lg:max-w-[420px]">
                {/* Knowledge base layers - stacked 3D effect */}
                <div className="relative h-40 sm:h-48 md:h-56 lg:h-64 flex items-center justify-center">
                    {[0, 1, 2].map((layer) => (
                        <motion.div
                            key={layer}
                            className="absolute w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/30 flex flex-col items-center justify-center gap-2 sm:gap-3 backdrop-blur-sm"
                            style={{
                                zIndex: 3 - layer,
                                boxShadow: `0 ${(3 - layer) * 8}px ${(3 - layer) * 16}px rgba(0,0,0,0.3)`,
                                transform: `translateX(${layer * 12}px) translateY(${layer * 12}px)`,
                            }}
                            animate={{
                                y: [layer * 12, layer * 12 - 10, layer * 12],
                                opacity: [0.5 + layer * 0.15, 0.85 + layer * 0.05, 0.5 + layer * 0.15],
                                scale: [1 - layer * 0.05, 1.02 - layer * 0.05, 1 - layer * 0.05],
                            }}
                            transition={{
                                duration: 3.5,
                                delay: layer * 0.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            <motion.div
                                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-xl bg-white/10 flex items-center justify-center"
                                animate={{
                                    rotate: [0, 5, -5, 0],
                                }}
                                transition={{
                                    duration: 4,
                                    delay: layer * 0.3,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-10 lg:w-10 text-white/80" />
                            </motion.div>
                        </motion.div>
                    ))}
                    
                    {/* Floating particles */}
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={`particle-${i}`}
                            className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/40"
                            style={{
                                left: `${20 + (i % 3) * 30}%`,
                                top: `${20 + Math.floor(i / 3) * 40}%`,
                            }}
                            animate={{
                                y: [0, -15, 0],
                                opacity: [0.2, 0.6, 0.2],
                                scale: [0.8, 1.2, 0.8],
                            }}
                            transition={{
                                duration: 2.5 + i * 0.3,
                                delay: i * 0.4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const PanelContextAware = () => {
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[380px] lg:max-w-[420px]">
                {/* Context flow diagram - professional and larger */}
                <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 items-center">
                    {/* Source node */}
                    <motion.div
                        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/20 border-2 border-cyan-400/50 flex items-center justify-center backdrop-blur-sm"
                        style={{
                            boxShadow: "0 0 40px rgba(34,211,238,0.3)",
                        }}
                        animate={{ 
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        <Search className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-cyan-300" />
                    </motion.div>
                    
                    {/* Flowing context lines */}
                    <div className="relative w-full h-12 sm:h-16 md:h-20 flex items-center justify-center">
                        {/* Main flow line */}
                        <div className="absolute w-1 sm:w-1.5 h-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="w-full h-1/3 bg-gradient-to-b from-cyan-400/60 via-white/40 to-violet-400/60 rounded-full"
                                animate={{ y: ["-100%", "400%"] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            />
                        </div>
                        
                        {/* Side branches */}
                        {[-1, 1].map((dir) => (
                            <motion.div
                                key={dir}
                                className="absolute w-12 sm:w-16 md:w-20 lg:w-24 h-1 sm:h-1.5 bg-white/20 rounded-full"
                                style={{
                                    rotate: dir === -1 ? -35 : 35,
                                    top: "50%",
                                }}
                                animate={{
                                    scaleX: [0.4, 1, 0.4],
                                    opacity: [0.3, 0.7, 0.3],
                                }}
                                transition={{
                                    duration: 2,
                                    delay: dir === 1 ? 0.5 : 0,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            />
                        ))}
                        
                        {/* Context particles flowing */}
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full bg-white/60"
                                style={{
                                    left: `${40 + i * 10}%`,
                                }}
                                animate={{
                                    y: [-30, 30],
                                    opacity: [0, 1, 0],
                                    scale: [0.5, 1, 0.5],
                                }}
                                transition={{
                                    duration: 1.5,
                                    delay: i * 0.3,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            />
                        ))}
                    </div>
                    
                    {/* Output node */}
                    <motion.div
                        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-2xl bg-gradient-to-br from-violet-400/30 to-purple-500/20 border-2 border-violet-400/50 flex items-center justify-center backdrop-blur-sm"
                        style={{
                            boxShadow: "0 0 40px rgba(139,92,246,0.3)",
                        }}
                        animate={{ 
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1.5,
                        }}
                    >
                        <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-violet-300" />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default HoverExpandPanels
