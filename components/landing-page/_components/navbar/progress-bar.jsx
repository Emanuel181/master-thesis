"use client"

import { motion } from "framer-motion"

/**
 * ProgressBar - Scroll progress indicator at top of page
 */
export function ProgressBar({ scaleX }) {
    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--brand-accent)] to-transparent z-[110] origin-left"
            style={{ scaleX }}
        />
    )
}
