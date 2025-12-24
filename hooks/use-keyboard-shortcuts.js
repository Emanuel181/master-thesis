"use client"

import { useEffect, useCallback, useRef } from 'react'

/**
 * Global keyboard shortcuts hook
 * @param {Object} shortcuts - Map of keyboard shortcuts to handlers
 * @param {Object} options - Options for the hook
 * @returns {Object} - Methods to register/unregister shortcuts
 */
export function useKeyboardShortcuts(shortcuts = {}, options = {}) {
    const { enabled = true, preventDefault = true } = options
    const shortcutsRef = useRef(shortcuts)

    // Update ref when shortcuts change
    useEffect(() => {
        shortcutsRef.current = shortcuts
    }, [shortcuts])

    const handleKeyDown = useCallback((e) => {
        if (!enabled) return

        // Don't trigger shortcuts when typing in inputs (unless specifically allowed)
        const target = e.target
        const isInput = target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable ||
            target.getAttribute('role') === 'textbox'

        // Build the key combination string
        const parts = []
        if (e.metaKey || e.ctrlKey) parts.push('mod')
        if (e.altKey) parts.push('alt')
        if (e.shiftKey) parts.push('shift')

        // Normalize key
        let key = e.key.toLowerCase()
        if (key === ' ') key = 'space'
        if (key === 'escape') key = 'esc'

        parts.push(key)
        const combo = parts.join('+')

        // Check if this combination has a handler
        const handler = shortcutsRef.current[combo]
        if (handler) {
            // Some shortcuts should work even in inputs (like Escape)
            const alwaysAllow = ['mod+k', 'mod+p', 'mod+/', 'esc', 'mod+s', 'mod+shift+p']
            if (isInput && !alwaysAllow.includes(combo)) {
                return
            }

            if (preventDefault) {
                e.preventDefault()
                e.stopPropagation()
            }
            handler(e)
        }
    }, [enabled, preventDefault])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown, true)
        return () => window.removeEventListener('keydown', handleKeyDown, true)
    }, [handleKeyDown])

    return {
        isEnabled: enabled,
    }
}

/**
 * Parse a shortcut string into display format
 * @param {string} shortcut - e.g., 'mod+k'
 * @returns {string} - e.g., '⌘K' or 'Ctrl+K'
 */
export function formatShortcut(shortcut) {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

    return shortcut
        .split('+')
        .map(part => {
            switch (part.toLowerCase()) {
                case 'mod':
                    return isMac ? '⌘' : 'Ctrl'
                case 'alt':
                    return isMac ? '⌥' : 'Alt'
                case 'shift':
                    return isMac ? '⇧' : 'Shift'
                case 'esc':
                    return 'Esc'
                case 'enter':
                    return '↵'
                case 'space':
                    return 'Space'
                default:
                    return part.toUpperCase()
            }
        })
        .join(isMac ? '' : '+')
}

export default useKeyboardShortcuts

