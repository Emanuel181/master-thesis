"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * NavLogo - Logo with brand name for navbar
 */
export function NavLogo({ isAboveColoredSection }) {
    return (
        <motion.a
            href="/"
            className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 font-medium group shrink-0"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            aria-label="VulnIQ Home"
        >
            <div className="relative">
                <Image
                    src="/web-app-manifest-512x512.png"
                    alt="VulnIQ Logo"
                    className="h-7 w-7 xs:h-8 xs:w-8 sm:h-7 sm:w-7 rounded-lg xs:rounded-xl sm:rounded-lg"
                    width={32}
                    height={32}
                    priority
                    fetchPriority="high"
                />
                <div className="absolute -inset-1 bg-[var(--brand-accent)]/20 rounded-xl blur-sm -z-10 opacity-0 group-hover:opacity-100 transition-opacity md:hidden" />
            </div>
            <span
                className={cn(
                    "text-xs xs:text-sm font-semibold md:hidden transition-colors duration-500 ease-out",
                    isAboveColoredSection ? "text-[#1fb6cf]" : "text-foreground"
                )}
            >
                VulnIQ
            </span>
        </motion.a>
    )
}
