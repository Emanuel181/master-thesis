"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"

// Custom hooks
import { useScrollBehavior } from "@/hooks/use-scroll-behavior"
import { useMobileMenu } from "@/hooks/use-mobile-menu"

// Components
import {
    NavLogo,
    NavMenu,
    NavActions,
    MobileMenu,
    ProgressBar,
    FeedbackDialog,
} from "./_components/navbar"

/**
 * FloatingNavbar - Main navigation component with scroll behavior and mobile menu.
 * Refactored to use custom hooks and extracted sub-components.
 */
export const FloatingNavbar = () => {
    const { data: session, status } = useSession()
    const isAuthenticated = status === "authenticated" && !!session

    // Custom hooks
    const scroll = useScrollBehavior()
    const mobileMenu = useMobileMenu()

    // Feedback dialog state
    const [feedbackOpen, setFeedbackOpen] = useState(false)

    return (
        <>
            {/* Progress bar */}
            <ProgressBar scaleX={scroll.scaleX} />

            {/* Main navbar container */}
            <motion.div
                className="fixed top-2 sm:top-3 md:top-6 inset-x-0 z-[100] flex justify-center px-2 sm:px-3 md:px-4 pointer-events-none"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                }}
            >
                <motion.nav
                    className={`pointer-events-auto flex items-center justify-between gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 border px-2 xs:px-3 sm:px-4 md:px-4 lg:px-6 py-2 xs:py-2.5 sm:py-3 md:py-3 lg:py-3.5 rounded-2xl sm:rounded-full w-full max-w-5xl backdrop-blur-xl transition-all duration-500 ease-out ${scroll.navbarClasses}`}
                    style={{
                        transitionProperty: 'background-color, border-color, box-shadow, color',
                        transitionDuration: '500ms',
                        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    layout
                >
                    {/* LEFT: Logo */}
                    <NavLogo isAboveColoredSection={scroll.isAboveColoredSection} />

                    {/* CENTER: Navigation Menu */}
                    <NavMenu isAboveColoredSection={scroll.isAboveColoredSection} />

                    {/* RIGHT: Actions */}
                    <NavActions
                        isAuthenticated={isAuthenticated}
                        mobileMenuOpen={mobileMenu.isOpen}
                        onToggleMobileMenu={mobileMenu.toggle}
                        onOpenFeedback={() => setFeedbackOpen(true)}
                    />
                </motion.nav>
            </motion.div>

            {/* Mobile Menu Dropdown */}
            <MobileMenu
                isOpen={mobileMenu.isOpen}
                onClose={mobileMenu.close}
                isAuthenticated={isAuthenticated}
            />

            {/* Feedback Dialog */}
            <FeedbackDialog
                isOpen={feedbackOpen}
                onClose={() => setFeedbackOpen(false)}
            />
        </>
    )
}
