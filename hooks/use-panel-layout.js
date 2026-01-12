"use client"

import { useState, useEffect, useCallback } from "react"

const PANEL_LAYOUT_KEY = 'vulniq-panel-layout'
const DEFAULT_PANEL_LAYOUT = { 
    repoSwapped: false, 
    rightSwapped: false, 
    columnsSwapped: false 
}

/**
 * Custom hook for managing panel layout state with localStorage persistence.
 * Handles swapping of repository panels, right panels, and columns.
 */
export function usePanelLayout() {
    const [panelLayout, setPanelLayout] = useState(DEFAULT_PANEL_LAYOUT)
    const [isHydrated, setIsHydrated] = useState(false)

    // Load saved state from localStorage after mount to avoid hydration mismatch
    useEffect(() => {
        try {
            const saved = localStorage.getItem(PANEL_LAYOUT_KEY)
            if (saved) {
                setPanelLayout(JSON.parse(saved))
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
        
        // Actions
        handleSwapRepoPanels,
        handleSwapRightPanels,
        handleSwapColumns,
        resetLayout,
        
        // Direct setter for advanced use cases
        setPanelLayout,
    }
}
