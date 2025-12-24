"use client"

import { useCallback, useEffect, useRef } from 'react'

/**
 * Hook for managing focus trap within a container
 * Useful for modals, dialogs, and dropdown menus
 */
export function useFocusTrap(isActive = true) {
    const containerRef = useRef(null)

    useEffect(() => {
        if (!isActive || !containerRef.current) return

        const container = containerRef.current
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        const handleKeyDown = (e) => {
            if (e.key !== 'Tab') return

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault()
                    lastElement?.focus()
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault()
                    firstElement?.focus()
                }
            }
        }

        container.addEventListener('keydown', handleKeyDown)

        // Focus first element when trap becomes active
        firstElement?.focus()

        return () => {
            container.removeEventListener('keydown', handleKeyDown)
        }
    }, [isActive])

    return containerRef
}

/**
 * Hook for managing focus return after modal/dialog closes
 */
export function useFocusReturn() {
    const previousFocusRef = useRef(null)

    const saveFocus = useCallback(() => {
        previousFocusRef.current = document.activeElement
    }, [])

    const restoreFocus = useCallback(() => {
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
            previousFocusRef.current.focus()
        }
    }, [])

    return { saveFocus, restoreFocus }
}

/**
 * Hook for announcing messages to screen readers
 */
export function useAnnounce() {
    const announce = useCallback((message, priority = 'polite') => {
        const announcement = document.createElement('div')
        announcement.setAttribute('role', 'status')
        announcement.setAttribute('aria-live', priority)
        announcement.setAttribute('aria-atomic', 'true')
        announcement.className = 'sr-only'
        announcement.textContent = message

        document.body.appendChild(announcement)

        setTimeout(() => {
            document.body.removeChild(announcement)
        }, 1000)
    }, [])

    return announce
}

/**
 * Hook for roving tabindex navigation (for tab lists, menus, etc.)
 */
export function useRovingTabIndex(itemCount, options = {}) {
    const {
        orientation = 'horizontal',
        loop = true,
        initialIndex = 0
    } = options

    const currentIndexRef = useRef(initialIndex)

    const handleKeyDown = useCallback((e, onSelect) => {
        const isHorizontal = orientation === 'horizontal'
        const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp'
        const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown'

        let newIndex = currentIndexRef.current

        if (e.key === prevKey) {
            e.preventDefault()
            newIndex = currentIndexRef.current - 1
            if (newIndex < 0) {
                newIndex = loop ? itemCount - 1 : 0
            }
        } else if (e.key === nextKey) {
            e.preventDefault()
            newIndex = currentIndexRef.current + 1
            if (newIndex >= itemCount) {
                newIndex = loop ? 0 : itemCount - 1
            }
        } else if (e.key === 'Home') {
            e.preventDefault()
            newIndex = 0
        } else if (e.key === 'End') {
            e.preventDefault()
            newIndex = itemCount - 1
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect?.(currentIndexRef.current)
            return currentIndexRef.current
        }

        currentIndexRef.current = newIndex
        return newIndex
    }, [itemCount, loop, orientation])

    const setCurrentIndex = useCallback((index) => {
        currentIndexRef.current = index
    }, [])

    return {
        currentIndex: currentIndexRef.current,
        setCurrentIndex,
        handleKeyDown,
        getTabIndex: (index) => index === currentIndexRef.current ? 0 : -1,
    }
}

export default useFocusTrap

