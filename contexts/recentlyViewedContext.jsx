"use client"

import * as React from "react"

const RECENTLY_VIEWED_KEY = 'vulniq_recently_viewed_docs'
const MAX_RECENT = 10

const RecentlyViewedContext = React.createContext(null)

export function useRecentlyViewed() {
    const context = React.useContext(RecentlyViewedContext)
    if (!context) {
        throw new Error("useRecentlyViewed must be used within RecentlyViewedProvider")
    }
    return context
}

export function RecentlyViewedProvider({ children }) {
    const [recentDocs, setRecentDocs] = React.useState([])

    // Load from localStorage on mount
    React.useEffect(() => {
        try {
            const saved = localStorage.getItem(RECENTLY_VIEWED_KEY)
            if (saved) {
                const parsed = JSON.parse(saved)
                // Restore timestamps as Date objects
                const restored = parsed.map(doc => ({
                    ...doc,
                    viewedAt: new Date(doc.viewedAt)
                }))
                setRecentDocs(restored)
            }
        } catch (e) {
            console.error('Failed to load recently viewed:', e)
        }
    }, [])

    // Persist to localStorage when recentDocs changes
    React.useEffect(() => {
        try {
            const toSave = recentDocs.map(doc => ({
                ...doc,
                viewedAt: doc.viewedAt.toISOString()
            }))
            localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(toSave))
        } catch (e) {
            // Ignore storage errors
        }
    }, [recentDocs])

    // Add a document to recently viewed
    const addRecentlyViewed = React.useCallback((doc) => {
        setRecentDocs(prev => {
            // Remove if already exists
            const filtered = prev.filter(d => d.id !== doc.id)
            // Add to beginning with timestamp
            const newDoc = {
                id: doc.id,
                name: doc.name,
                url: doc.url,
                categoryId: doc.categoryId,
                categoryName: doc.categoryName,
                viewedAt: new Date()
            }
            return [newDoc, ...filtered].slice(0, MAX_RECENT)
        })
    }, [])

    // Remove a document from recently viewed
    const removeRecentlyViewed = React.useCallback((docId) => {
        setRecentDocs(prev => prev.filter(d => d.id !== docId))
    }, [])

    // Clear all recently viewed
    const clearRecentlyViewed = React.useCallback(() => {
        setRecentDocs([])
    }, [])

    // Check if a document was recently viewed
    const isRecentlyViewed = React.useCallback((docId) => {
        return recentDocs.some(d => d.id === docId)
    }, [recentDocs])

    const value = React.useMemo(() => ({
        recentDocs,
        addRecentlyViewed,
        removeRecentlyViewed,
        clearRecentlyViewed,
        isRecentlyViewed,
    }), [
        recentDocs,
        addRecentlyViewed,
        removeRecentlyViewed,
        clearRecentlyViewed,
        isRecentlyViewed,
    ])

    return (
        <RecentlyViewedContext.Provider value={value}>
            {children}
        </RecentlyViewedContext.Provider>
    )
}

export default RecentlyViewedProvider

