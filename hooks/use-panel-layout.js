"use client"

import { useState, useEffect, useCallback } from "react"

const PANEL_LAYOUT_KEY = 'vulniq-panel-layout'

// Default section order for the home page
const DEFAULT_SECTION_ORDER = [
    'welcome',
    'stats',
    'activity',    // recent scans + top findings row
    'repos',       // github/gitlab + prompts/project grid
]

const DEFAULT_PANEL_LAYOUT = {
    repoSwapped: false, 
    rightSwapped: false, 
    columnsSwapped: false,
    sectionOrder: DEFAULT_SECTION_ORDER,
}

/**
 * Custom hook for managing panel layout state with localStorage persistence.
 * Handles swapping of repository panels, right panels, columns, and section ordering.
 */
export function usePanelLayout() {
    const [panelLayout, setPanelLayout] = useState(DEFAULT_PANEL_LAYOUT)
    const [isHydrated, setIsHydrated] = useState(false)

    // Load saved state from localStorage after mount to avoid hydration mismatch
    useEffect(() => {
        try {
            const saved = localStorage.getItem(PANEL_LAYOUT_KEY)
            if (saved) {
                const parsed = JSON.parse(saved)
                // Ensure sectionOrder exists and has all default sections
                if (!parsed.sectionOrder || !Array.isArray(parsed.sectionOrder)) {
                    parsed.sectionOrder = DEFAULT_SECTION_ORDER
                } else {
                    // Add any new sections that might have been added
                    for (const section of DEFAULT_SECTION_ORDER) {
                        if (!parsed.sectionOrder.includes(section)) {
                            parsed.sectionOrder.push(section)
                        }
                    }
                    // Remove any sections that no longer exist
                    parsed.sectionOrder = parsed.sectionOrder.filter(s => DEFAULT_SECTION_ORDER.includes(s))
                }
                setPanelLayout(parsed)
            }
        } catch {}
        setIsHydrated(true)
    }, [])

    // Persist panel layout to localStorage
    useEffect(() => {
        if (!isHydrated) return
        try {
            localStorage.setItem(PANEL_LAYOUT_KEY, JSON.stringify(panelLayout))
        } catch {}
    }, [panelLayout, isHydrated])

    /**
     * Swap GitHub and GitLab panel positions
     */
    const handleSwapRepoPanels = useCallback(() => {
        setPanelLayout(prev => ({ ...prev, repoSwapped: !prev.repoSwapped }))
    }, [])

    /**
     * Swap right panel positions (prompts and other panels)
     */
    const handleSwapRightPanels = useCallback(() => {
        setPanelLayout(prev => ({ ...prev, rightSwapped: !prev.rightSwapped }))
    }, [])

    /**
     * Swap left and right column positions
     */
    const handleSwapColumns = useCallback(() => {
        setPanelLayout(prev => ({ ...prev, columnsSwapped: !prev.columnsSwapped }))
    }, [])

    /**
     * Move a section up in the order
     */
    const moveSectionUp = useCallback((sectionId) => {
        setPanelLayout(prev => {
            const order = [...prev.sectionOrder]
            const idx = order.indexOf(sectionId)
            if (idx <= 0) return prev
            ;[order[idx - 1], order[idx]] = [order[idx], order[idx - 1]]
            return { ...prev, sectionOrder: order }
        })
    }, [])

    /**
     * Move a section down in the order
     */
    const moveSectionDown = useCallback((sectionId) => {
        setPanelLayout(prev => {
            const order = [...prev.sectionOrder]
            const idx = order.indexOf(sectionId)
            if (idx < 0 || idx >= order.length - 1) return prev
            ;[order[idx], order[idx + 1]] = [order[idx + 1], order[idx]]
            return { ...prev, sectionOrder: order }
        })
    }, [])

    /**
     * Reset layout to default
     */
    const resetLayout = useCallback(() => {
        setPanelLayout(DEFAULT_PANEL_LAYOUT)
    }, [])

    return {
        // State
        panelLayout,
        isHydrated,
        
        // Individual flags for convenience
        repoSwapped: panelLayout.repoSwapped,
        rightSwapped: panelLayout.rightSwapped,
        columnsSwapped: panelLayout.columnsSwapped,
        sectionOrder: panelLayout.sectionOrder || DEFAULT_SECTION_ORDER,

        // Actions
        handleSwapRepoPanels,
        handleSwapRightPanels,
        handleSwapColumns,
        moveSectionUp,
        moveSectionDown,
        resetLayout,
        
        // Direct setter for advanced use cases
        setPanelLayout,
    }
}
