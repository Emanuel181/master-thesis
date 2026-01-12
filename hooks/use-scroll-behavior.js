"use client"

import { useState, useEffect } from "react"
import { useScroll, useMotionValueEvent, useSpring } from "framer-motion"

/**
 * Custom hook for managing navbar scroll behavior and styling.
 * Tracks scroll position, progress, and determines if navbar is above colored sections.
 */
export function useScrollBehavior() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isAboveColoredSection, setIsAboveColoredSection] = useState(false)

    const { scrollY, scrollYProgress } = useScroll()

    // Subtle progress indicator with spring animation
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

    // Check if navbar is above sections with problematic backgrounds
    useEffect(() => {
        const checkSectionPositions = () => {
            // Check multiple sections that have colored backgrounds
            const sections = [
                document.getElementById('about'),      // Lamp section
                document.getElementById('blog'),       // Blog section  
                document.getElementById('connect'),    // CTA section
                document.querySelector('[data-hover-panels]'), // Hover expand panels
            ]

            let isAbove = false
            for (const section of sections) {
                if (section) {
                    const rect = section.getBoundingClientRect()
                    // Navbar is above section when section top is near viewport top
                    if (rect.top <= 80 && rect.bottom > 60) {
                        isAbove = true
                        break
                    }
                }
            }
            setIsAboveColoredSection(isAbove)
        }

        const handleScroll = () => checkSectionPositions()
        window.addEventListener('scroll', handleScroll, { passive: true })

        const scrollContainer = document.querySelector('[data-radix-scroll-area-viewport]')
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
        }

        checkSectionPositions()
        const timeoutId = setTimeout(checkSectionPositions, 100)

        return () => {
            window.removeEventListener('scroll', handleScroll)
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', handleScroll)
            }
            clearTimeout(timeoutId)
        }
    }, [])

    // Track scroll state for styling
    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 50)
    })

    /**
     * Get navbar classes based on scroll state
     */
    const getNavbarClasses = () => {
        if (isAboveColoredSection) {
            return 'bg-background/95 dark:bg-background/90 border-[#1fb6cf]/50 shadow-xl shadow-black/20'
        }
        if (isScrolled) {
            return 'bg-[#1fb6cf]/10 dark:bg-[#1fb6cf]/5 border-[#1fb6cf]/30 shadow-xl shadow-[#1fb6cf]/10'
        }
        return 'bg-[#1fb6cf]/5 dark:bg-[#1fb6cf]/5 border-[#1fb6cf]/20 shadow-md shadow-[#1fb6cf]/5'
    }

    return {
        // State
        isScrolled,
        isAboveColoredSection,

        // Scroll values
        scrollY,
        scrollYProgress,
        scaleX,

        // Computed
        navbarClasses: getNavbarClasses(),
    }
}
