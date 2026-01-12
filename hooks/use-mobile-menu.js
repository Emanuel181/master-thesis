"use client"

import { useState, useCallback } from "react"

/**
 * Custom hook for managing mobile menu state.
 * Handles open/close state and toggle functionality.
 */
export function useMobileMenu() {
    const [isOpen, setIsOpen] = useState(false)

    /**
     * Toggle mobile menu open/close
     */
    const toggle = useCallback(() => {
        setIsOpen((prev) => !prev)
    }, [])

    /**
     * Open mobile menu
     */
    const open = useCallback(() => {
        setIsOpen(true)
    }, [])

    /**
     * Close mobile menu
     */
    const close = useCallback(() => {
        setIsOpen(false)
    }, [])

    return {
        isOpen,
        toggle,
        open,
        close,
    }
}
