"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import { useProject } from "@/contexts/projectContext"
import { useDemo, DEMO_GITLAB_REPOS } from "@/contexts/demoContext"
import { toast } from "sonner"

const DEMO_GITLAB_KEY = 'vulniq_demo_gitlab_connected'
const REPOS_PER_PAGE = 4

/**
 * Custom hook for managing GitLab repository state and operations.
 * Handles fetching, connection, disconnection, search, and pagination.
 * Supports both authenticated mode and demo mode.
 */
export function useGitLabRepos() {
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

    // Load demo connection state from localStorage
    useEffect(() => {
        if (isDemoMode) {
            try {
                setIsConnected(localStorage.getItem(DEMO_GITLAB_KEY) === 'true')
            } catch {}
        }
    }, [isDemoMode])

    // Persist demo connection state
    useEffect(() => {
        if (!isDemoMode) return
        try {
            localStorage.setItem(DEMO_GITLAB_KEY, String(isConnected))
        } catch {}
    }, [isDemoMode, isConnected])

    // Load demo repos when connected in demo mode
    useEffect(() => {
        if (isDemoMode && isConnected) {
            setRepos(DEMO_GITLAB_REPOS)
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
     * Fetch repositories from GitLab API
     */
    const fetchRepos = useCallback(async (allowRefresh = false) => {
        if (!allowRefresh && fetchOnceRef.current) return
        if (allowRefresh) fetchOnceRef.current = false

        fetchOnceRef.current = true
        setIsLoading(true)
        
        try {
            const response = await fetch('/api/gitlab/repos')
            const data = await response.json()

            if (response.ok) {
                const dataWithProvider = data.map(r => ({ ...r, provider: 'gitlab' }))
                setRepos(dataWithProvider)
            } else {
                console.warn('[useGitLabRepos] fetch failed', data)
                if (data?.debug?.message) {
                    console.log(`gitlab debug: ${data.debug.message}`)
                } else if (data?.error) {
                    console.log(`gitlab error: ${data.error}`)
                }
                fetchOnceRef.current = false
            }
        } catch (err) {
            console.error("Error fetching gitlab repos:", err)
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
            return { gitlabLinked: true }
        }
        try {
            const res = await fetch('/api/providers/linked', { cache: 'no-store' })
            const data = await res.json()
            if (!res.ok) return null

            const linked = new Set(data.providers || [])
            const gitlabLinked = linked.has('gitlab')

            setIsConnected(gitlabLinked)
            if (!gitlabLinked) setRepos([])
            
            return { gitlabLinked }
        } catch (err) {
            console.error('Error refreshing linked providers:', err)
            return null
        }
    }, [isDemoMode])

    // Fetch repos when authenticated
    useEffect(() => {
        if (isDemoMode) return
        if (status === "authenticated" && session) {
            ;(async () => {
                const linked = await refreshLinkedProviders()
                if (linked?.gitlabLinked && repos.length === 0) {
                    fetchRepos()
                }
            })()
        }
    }, [isDemoMode, status, session, repos.length, refreshLinkedProviders, fetchRepos])

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
            setRepos([...DEMO_GITLAB_REPOS])
        } else {
            await fetchRepos(true)
        }
        setIsRefreshing(false)
        toast.success("GitLab repositories refreshed!")
    }, [isDemoMode, fetchRepos])

    /**
     * Connect to GitLab (demo mode: fake connection, real mode: OAuth)
     */
    const connect = useCallback(async () => {
        if (isDemoMode) {
            setIsLoading(true)
            await new Promise(resolve => setTimeout(resolve, 1000))
            setRepos(DEMO_GITLAB_REPOS)
            setIsConnected(true)
            setIsLoading(false)
            toast.success("Connected to GitLab!")
        } else {
            signIn("gitlab", { callbackUrl: "/dashboard" })
        }
    }, [isDemoMode])

    /**
     * Disconnect from GitLab
     */
    const disconnect = useCallback(async () => {
        const isCurrentProjectFromGitLab = currentRepo && currentRepo.provider === 'gitlab'
        
        if (isDemoMode) {
            setIsConnected(false)
            setRepos([])
            if (isCurrentProjectFromGitLab) {
                clearProject()
                toast.success("Disconnected from GitLab! Project unloaded.")
            } else {
                toast.success("Disconnected from GitLab!")
            }
            return
        }
        
        try {
            await fetch('/api/auth/disconnect?provider=gitlab', { method: 'POST' })
        } catch (err) {
            console.error('Error disconnecting GitLab:', err)
        }
        
        setIsConnected(false)
        setRepos([])
        
        if (isCurrentProjectFromGitLab) {
            clearProject()
            toast.success("Disconnected from GitLab! Project unloaded.")
        } else {
            toast.success("Disconnected from GitLab!")
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
