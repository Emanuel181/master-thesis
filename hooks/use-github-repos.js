"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname } from "@/i18n/navigation"
import { useSession, signIn } from "next-auth/react"
import { useProject } from "@/contexts/projectContext"
import { useDemo, DEMO_GITHUB_REPOS } from "@/contexts/demoContext"
import { toast } from "sonner"

const DEMO_GITHUB_KEY = 'vulniq_demo_github_connected'
const REPOS_PER_PAGE = 4

/**
 * Custom hook for managing GitHub repository state and operations.
 * Handles fetching, connection, disconnection, search, and pagination.
 * Supports both authenticated mode and demo mode.
 */
export function useGitHubRepos() {
    const { data: session, status } = useSession()
    const { currentRepo, clearProject } = useProject()
    const pathname = usePathname()

    // Demo mode detection
    const isDemoMode = pathname?.startsWith('/demo')

    // Repository state
    const [repos, setRepos] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Search and pagination
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)

    // Prevent double-fetch in React 18 dev mode
    const fetchOnceRef = useRef(false)

    // Guard: don't persist demo state until after initial hydration from localStorage
    const demoHydratedRef = useRef(false)

    // Load demo connection state from localStorage
    useEffect(() => {
        if (isDemoMode) {
            try {
                setIsConnected(localStorage.getItem(DEMO_GITHUB_KEY) === 'true')
            } catch {}
            requestAnimationFrame(() => { demoHydratedRef.current = true })
        }
        return () => { demoHydratedRef.current = false }
    }, [isDemoMode])

    // Persist demo connection state (only after initial hydration)
    useEffect(() => {
        if (!isDemoMode) return
        if (!demoHydratedRef.current) return
        try {
            localStorage.setItem(DEMO_GITHUB_KEY, String(isConnected))
        } catch {}
    }, [isDemoMode, isConnected])

    // Load demo repos when connected in demo mode
    useEffect(() => {
        if (isDemoMode && isConnected) {
            setRepos(DEMO_GITHUB_REPOS)
            setIsLoading(false)
        }
    }, [isDemoMode, isConnected])

    // Clear state when logged out (non-demo mode)
    useEffect(() => {
        if (isDemoMode) return
        if (status === "unauthenticated") {
            setIsConnected(false)
            setRepos([])
        }
    }, [isDemoMode, status])

    /**
     * Fetch repositories from GitHub API
     */
    const fetchRepos = useCallback(async (allowRefresh = false, signal = undefined) => {
        if (!allowRefresh && fetchOnceRef.current) return
        if (allowRefresh) fetchOnceRef.current = false

        fetchOnceRef.current = true
        setIsLoading(true)

        try {
            const response = await fetch('/api/github/repos', { signal })
            const jsonResponse = await response.json()

            if (response.ok) {
                // Handle wrapped response from createApiHandler
                const reposData = jsonResponse.data || jsonResponse

                if (!Array.isArray(reposData)) {
                    console.error('[GitHub Home] Repos data is not an array:', reposData)
                    toast.error('Invalid response format from GitHub API')
                    fetchOnceRef.current = false
                    return
                }

                const dataWithProvider = reposData.map(r => ({ ...r, provider: 'github' }))
                setRepos(dataWithProvider)
            } else {
                console.error('[GitHub Home] fetch failed', jsonResponse)
                const errorMsg = jsonResponse?.error || jsonResponse?.debug?.message || 'Failed to load repositories'
                toast.error(errorMsg)
                fetchOnceRef.current = false
            }
        } catch (err) {
            if (err.name === 'AbortError') return
            console.error("[GitHub Home] Error fetching repos:", err)
            toast.error('Failed to connect to GitHub API')
            fetchOnceRef.current = false
        } finally {
            setIsLoading(false)
        }
    }, [])

    /**
     * Refresh linked providers status
     */
    const refreshLinkedProviders = useCallback(async () => {
        if (isDemoMode) {
            return { githubLinked: true }
        }
        try {
            const res = await fetch('/api/providers/linked', {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            })

            if (!res.ok) {
                return null
            }

            const response = await res.json()

            // Handle wrapped response from createApiHandler
            // The response could be: { success: true, data: { providers: [...] } }
            // Or just: { providers: [...] }
            let providers = []

            if (response.success && response.data && Array.isArray(response.data.providers)) {
                providers = response.data.providers
            } else if (Array.isArray(response.providers)) {
                providers = response.providers
            } else if (response.data && Array.isArray(response.data)) {
                providers = response.data
            } else {
                console.error('[GitHub Home] Could not find providers array in response:', response)
            }

            const linked = new Set(providers)
            const githubLinked = linked.has('github')

            setIsConnected(githubLinked)
            if (!githubLinked) setRepos([])

            return { githubLinked }
        } catch (err) {
            console.error('[GitHub Home] Error refreshing linked providers:', err)
            return null
        }
    }, [isDemoMode])

    // Fetch repos when authenticated
    useEffect(() => {
        if (isDemoMode) return
        if (status === "authenticated" && session) {
            const controller = new AbortController()
            ;(async () => {
                const linked = await refreshLinkedProviders()
                if (linked?.githubLinked) {
                    fetchRepos(false, controller.signal)
                }
            })()
            return () => controller.abort()
        }
    }, [isDemoMode, status, session, refreshLinkedProviders, fetchRepos])

    // Periodic refresh of linked providers
    useEffect(() => {
        if (isDemoMode) return
        if (status !== 'authenticated') return

        const interval = setInterval(() => {
            refreshLinkedProviders()
        }, 30000)

        return () => clearInterval(interval)
    }, [isDemoMode, status, refreshLinkedProviders])

    /**
     * Refresh repositories
     */
    const refresh = useCallback(async () => {
        setIsRefreshing(true)
        if (isDemoMode) {
            await new Promise(resolve => setTimeout(resolve, 800))
            setRepos([...DEMO_GITHUB_REPOS])
        } else {
            await fetchRepos(true)
        }
        setIsRefreshing(false)
        toast.success("GitHub repositories refreshed!")
    }, [isDemoMode, fetchRepos])

    /**
     * Connect to GitHub (demo mode: fake connection, real mode: OAuth linking)
     */
    const connect = useCallback(async () => {
        if (isDemoMode) {
            setIsLoading(true)
            await new Promise(resolve => setTimeout(resolve, 1000))
            setRepos(DEMO_GITHUB_REPOS)
            setIsConnected(true)
            setIsLoading(false)
            toast.success("Connected to GitHub!")
        } else {
            // Link GitHub account to existing session instead of signing in again
            // This prevents the "Account Already Exists" error when user is already logged in
            const currentPath = window.location.pathname
            signIn("github", {
                callbackUrl: currentPath || "/dashboard",
                redirect: true
            })
        }
    }, [isDemoMode])

    /**
     * Disconnect from GitHub
     */
    const disconnect = useCallback(async () => {
        const isCurrentProjectFromGitHub = currentRepo && currentRepo.provider === 'github'

        if (isDemoMode) {
            setIsConnected(false)
            setRepos([])
            if (isCurrentProjectFromGitHub) {
                clearProject()
                toast.success("Disconnected from GitHub! Project unloaded.")
            } else {
                toast.success("Disconnected from GitHub!")
            }
            return
        }

        try {
            await fetch('/api/auth/disconnect?provider=github', { method: 'POST' })
        } catch (err) {
            console.error('Error disconnecting GitHub:', err)
        }

        setIsConnected(false)
        setRepos([])

        if (isCurrentProjectFromGitHub) {
            clearProject()
            toast.success("Disconnected from GitHub! Project unloaded.")
        } else {
            toast.success("Disconnected from GitHub!")
        }

        await refreshLinkedProviders()
    }, [isDemoMode, currentRepo, clearProject, refreshLinkedProviders])

    // Filtered repos based on search term
    const filteredRepos = repos.filter(repo => {
        if (!searchTerm.trim()) return true
        const searchLower = searchTerm.toLowerCase()
        return (
            repo.full_name?.toLowerCase().includes(searchLower) ||
            repo.shortDescription?.toLowerCase().includes(searchLower)
        )
    })

    // Pagination calculations
    const totalPages = Math.ceil(filteredRepos.length / REPOS_PER_PAGE)
    const paginatedRepos = filteredRepos.slice(
        (currentPage - 1) * REPOS_PER_PAGE,
        currentPage * REPOS_PER_PAGE
    )

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    return {
        // State
        repos,
        isLoading,
        isConnected,
        isRefreshing,
        searchTerm,
        currentPage,

        // Computed
        filteredRepos,
        paginatedRepos,
        totalPages,
        totalCount: filteredRepos.length,

        // Actions
        setSearchTerm,
        setCurrentPage,
        connect,
        disconnect,
        refresh,

        // Auth status
        status,
        isDemoMode,
    }
}
