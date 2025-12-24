"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"

// Page transition variants
const pageVariants = {
    initial: {
        opacity: 0,
        y: 10,
    },
    enter: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.2,
            ease: "easeOut",
        },
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: {
            duration: 0.15,
            ease: "easeIn",
        },
    },
}

const fadeVariants = {
    initial: { opacity: 0 },
    enter: {
        opacity: 1,
        transition: { duration: 0.2 },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.15 },
    },
}

const slideVariants = {
    initial: {
        opacity: 0,
        x: 20,
    },
    enter: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.25,
            ease: "easeOut",
        },
    },
    exit: {
        opacity: 0,
        x: -20,
        transition: {
            duration: 0.2,
            ease: "easeIn",
        },
    },
}

const scaleVariants = {
    initial: {
        opacity: 0,
        scale: 0.95,
    },
    enter: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.2,
            ease: "easeOut",
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: {
            duration: 0.15,
            ease: "easeIn",
        },
    },
}

/**
 * PageTransition - Wraps page content with animated transitions
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.pageKey - Unique key for the page (triggers animation on change)
 * @param {string} props.variant - Animation variant: 'default' | 'fade' | 'slide' | 'scale'
 * @param {string} props.className - Additional CSS classes
 */
export function PageTransition({
    children,
    pageKey,
    variant = "default",
    className = "",
}) {
    const variants = {
        default: pageVariants,
        fade: fadeVariants,
        slide: slideVariants,
        scale: scaleVariants,
    }

    const selectedVariants = variants[variant] || pageVariants

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pageKey}
                initial="initial"
                animate="enter"
                exit="exit"
                variants={selectedVariants}
                className={`flex-1 flex flex-col overflow-hidden ${className}`}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}

/**
 * FadeIn - Simple fade-in animation for elements
 */
export function FadeIn({
    children,
    delay = 0,
    duration = 0.3,
    className = "",
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay, duration }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

/**
 * SlideIn - Slide-in animation from a direction
 */
export function SlideIn({
    children,
    direction = "up",
    delay = 0,
    duration = 0.3,
    distance = 20,
    className = "",
}) {
    const directions = {
        up: { y: distance },
        down: { y: -distance },
        left: { x: distance },
        right: { x: -distance },
    }

    return (
        <motion.div
            initial={{ opacity: 0, ...directions[direction] }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay, duration, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

/**
 * StaggerContainer - Container for staggered child animations
 */
export function StaggerContainer({
    children,
    staggerDelay = 0.1,
    className = "",
}) {
    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={{
                hidden: { opacity: 0 },
                show: {
                    opacity: 1,
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

/**
 * StaggerItem - Child item for StaggerContainer
 */
export function StaggerItem({ children, className = "" }) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 },
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

/**
 * ScaleOnHover - Adds scale effect on hover
 */
export function ScaleOnHover({
    children,
    scale = 1.02,
    className = "",
}) {
    return (
        <motion.div
            whileHover={{ scale }}
            whileTap={{ scale: 0.98 }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

/**
 * AnimatedList - Animated list with enter/exit animations
 */
export function AnimatedList({ children, className = "" }) {
    return (
        <AnimatePresence mode="popLayout">
            <motion.div layout className={className}>
                {children}
            </motion.div>
        </AnimatePresence>
    )
}

/**
 * AnimatedListItem - Item for AnimatedList
 */
export function AnimatedListItem({ children, itemKey, className = "" }) {
    return (
        <motion.div
            key={itemKey}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

export default PageTransition

