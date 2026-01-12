"use client"

import { motion } from "framer-motion"
import { PersonStanding } from "lucide-react"
import { useAccessibility } from "@/contexts/accessibilityContext"
import { cn } from "@/lib/utils"

/**
 * AccessibilityButton - Opens accessibility options panel
 */
export function AccessibilityButton({ compact }) {
    const { openPanel } = useAccessibility()

    return (
        <motion.button
            onClick={openPanel}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
                "flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2",
                compact
                    ? "w-7 h-7 bg-transparent hover:bg-[var(--brand-accent)]/10"
                    : "w-8 h-8 sm:w-9 sm:h-9 bg-[var(--brand-accent)]/10 hover:bg-[var(--brand-accent)]/20 border border-[var(--brand-accent)]/30"
            )}
            aria-label="Open accessibility menu"
            title="Accessibility options"
        >
            <PersonStanding
                className={cn(
                    "text-[var(--brand-accent)]",
                    compact ? "w-4 h-4" : "w-4 h-4 sm:w-5 sm:h-5"
                )}
                strokeWidth={2}
            />
        </motion.button>
    )
}
