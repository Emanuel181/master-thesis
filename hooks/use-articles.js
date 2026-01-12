"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

const ITEMS_PER_PAGE = 10

// Tab configuration
const TABS = [
    { id: "all", label: "All", status: null },
    { id: "draft", label: "Draft", status: "DRAFT" },
    { id: "pending", label: "Pending", status: "PENDING_REVIEW" },
    { id: "in_review", label: "In review", status: "IN_REVIEW" },
    { id: "published", label: "Published", status: "PUBLISHED" },
    { id: "rejected", label: "Rejected", status: "REJECTED" },
    { id: "pending_deletion", label: "Pending deletion", status: "SCHEDULED_FOR_DELETION" },
]

// Status configuration
const STATUS_CONFIG = {
    DRAFT: { label: "Draft", color: "bg-secondary text-secondary-foreground" },
    PENDING_REVIEW: { label: "Pending", color: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" },
    IN_REVIEW: { label: "In review", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
    PUBLISHED: { label: "Published", color: "bg-green-500/15 text-green-600 dark:text-green-400" },
    APPROVED: { label: "Published", color: "bg-green-500/15 text-green-600 dark:text-green-400" },
    REJECTED: { label: "Rejected", color: "bg-red-500/15 text-red-600 dark:text-red-400" },
    SCHEDULED_FOR_DELETION: { label: "Pending deletion", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
}

/**
 * Custom hook for managing articles state and operations.
 * Handles CRUD operations, filtering, pagination, and status management.
 */
export function useArticles() {
    const { data: session } = useSession()

    // Articles state
    const [articles, setArticles] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)

    // UI state
    const [activeTab, setActiveTab] = useState("all")
    const [selectedArticle, setSelectedArticle] = useState(null)
    const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [articleToDelete, setArticleToDelete] = useState(null)
    const [refreshingTab, setRefreshingTab] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    const [submittingId, setSubmittingId] = useState(null)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [articleSearchTerm, setArticleSearchTerm] = useState("")

    // Pagination state per tab
    const [pages, setPages] = useState({
        all: 1, draft: 1, pending: 1, in_review: 1, published: 1, rejected: 1, pending_deletion: 1,
    })

    /**
     * Fetch all articles from API
     */
    const fetchArticles = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await fetch("/api/articles")
            if (!response.ok) throw new Error("Failed to fetch articles")
            const data = await response.json()
            setArticles(data.articles || [])
        } catch (error) {
            console.error("Error fetching articles:", error)
            toast.error("Failed to load articles")
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Fetch articles when session is available
    useEffect(() => {
        if (session?.user) {
            fetchArticles()
        }
    }, [session, fetchArticles])

    /**
     * Create a new article
     */
    const createArticle = useCallback(async () => {
        try {
            setIsCreating(true)
            const response = await fetch("/api/articles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: "Untitled Article", category: "General" }),
            })
            if (!response.ok) throw new Error("Failed to create article")
            const data = await response.json()
            setArticles((prev) => [data.article, ...prev])
            toast.success("Draft article created.")
            return data.article
        } catch (error) {
            console.error("Error creating article:", error)
            toast.error("Failed to create article")
            return null
        } finally {
            setIsCreating(false)
        }
    }, [])

    /**
     * Delete an article
     */
    const deleteArticle = useCallback(async () => {
        if (!articleToDelete) return
        try {
            setDeletingId(articleToDelete.id)
            const response = await fetch(`/api/articles/${articleToDelete.id}`, { method: "DELETE" })
            if (!response.ok) throw new Error("Failed to delete article")
            setArticles((prev) => prev.filter((a) => a.id !== articleToDelete.id))
            if (selectedArticle?.id === articleToDelete.id) {
                setSelectedArticle(null)
            }
            toast.success("Article deleted")
        } catch (error) {
            console.error("Error deleting article:", error)
            toast.error("Failed to delete article")
        } finally {
            setDeleteDialogOpen(false)
            setArticleToDelete(null)
            setDeletingId(null)
        }
    }, [articleToDelete, selectedArticle])

    /**
     * Submit article for review
     */
    const submitForReview = useCallback(async (article) => {
        try {
            setSubmittingId(article.id)
            const response = await fetch(`/api/articles/${article.id}/submit`, { method: "POST" })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to submit article")
            setArticles((prev) =>
                prev.map((a) =>
                    a.id === article.id ? { ...a, status: "PENDING_REVIEW", submittedAt: new Date().toISOString() } : a
                )
            )
            if (selectedArticle?.id === article.id) {
                setSelectedArticle((prev) => ({ ...prev, status: "PENDING_REVIEW" }))
            }
            toast.success(data.message || "Article submitted for review")
        } catch (error) {
            console.error("Error submitting article:", error)
            toast.error(error.message || "Failed to submit article")
        } finally {
            setSubmittingId(null)
        }
    }, [selectedArticle])

    /**
     * Import rejected/scheduled-for-deletion article back to drafts
     */
    const importToDrafts = useCallback(async (article) => {
        try {
            setSubmittingId(article.id)
            const response = await fetch(`/api/articles/${article.id}/import-to-drafts`, { method: "POST" })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to import article")
            setArticles((prev) =>
                prev.map((a) =>
                    a.id === article.id ? { ...a, status: "DRAFT", scheduledForDeletionAt: null, rejectedAt: null } : a
                )
            )
            if (selectedArticle?.id === article.id) {
                setSelectedArticle((prev) => ({ ...prev, status: "DRAFT", scheduledForDeletionAt: null, rejectedAt: null }))
            }
            toast.success(data.message || "Article imported to drafts")
        } catch (error) {
            console.error("Error importing article:", error)
            toast.error(error.message || "Failed to import article")
        } finally {
            setSubmittingId(null)
        }
    }, [selectedArticle])

    /**
     * Refresh current category/tab
     */
    const refreshCategory = useCallback(async () => {
        setRefreshingTab(activeTab)
        await fetchArticles()
        setRefreshingTab(null)
        const tabLabel = TABS.find(t => t.id === activeTab)?.label || "Articles"
        toast.success(`${tabLabel} refreshed`)
    }, [activeTab, fetchArticles])

    /**
     * Refresh all articles
     */
    const refreshAll = useCallback(async () => {
        setRefreshingTab("all_global")
        await fetchArticles()
        setRefreshingTab(null)
        toast.success("All articles refreshed")
    }, [fetchArticles])

    /**
     * Handle article update from fullscreen editor
     */
    const handleArticleUpdate = useCallback((updates) => {
        setArticles((prev) => prev.map((a) => (a.id === updates.id ? { ...a, ...updates } : a)))
        if (selectedArticle?.id === updates.id) {
            setSelectedArticle((prev) => ({ ...prev, ...updates }))
        }
    }, [selectedArticle])

    /**
     * Filter articles by tab and search
     */
    const getFilteredArticles = useCallback((tabId) => {
        const tab = TABS.find((t) => t.id === tabId)
        let filtered = articles

        // Filter by status
        if (tab && tab.status) {
            if (tab.status === "PUBLISHED") {
                filtered = filtered.filter((a) => a.status === "PUBLISHED" || a.status === "APPROVED")
            } else {
                filtered = filtered.filter((a) => a.status === tab.status)
            }
        }

        // Filter by search term
        if (articleSearchTerm.trim()) {
            const searchLower = articleSearchTerm.toLowerCase()
            filtered = filtered.filter((a) =>
                a.title?.toLowerCase().includes(searchLower) ||
                a.excerpt?.toLowerCase().includes(searchLower) ||
                a.category?.toLowerCase().includes(searchLower)
            )
        }

        return filtered
    }, [articles, articleSearchTerm])

    /**
     * Get paginated articles for a tab
     */
    const getPaginatedArticles = useCallback((tabId) => {
        const filtered = getFilteredArticles(tabId)
        const page = pages[tabId] || 1
        const start = (page - 1) * ITEMS_PER_PAGE
        return {
            items: filtered.slice(start, start + ITEMS_PER_PAGE),
            total: filtered.length,
            totalPages: Math.ceil(filtered.length / ITEMS_PER_PAGE),
            currentPage: page,
        }
    }, [getFilteredArticles, pages])

    /**
     * Get counts for all tabs
     */
    const getCounts = useCallback(() => ({
        all: articles.length,
        draft: articles.filter((a) => a.status === "DRAFT").length,
        pending: articles.filter((a) => a.status === "PENDING_REVIEW").length,
        in_review: articles.filter((a) => a.status === "IN_REVIEW").length,
        published: articles.filter((a) => a.status === "PUBLISHED" || a.status === "APPROVED").length,
        rejected: articles.filter((a) => a.status === "REJECTED").length,
        pending_deletion: articles.filter((a) => a.status === "SCHEDULED_FOR_DELETION").length,
    }), [articles])

    /**
     * Set page for a specific tab
     */
    const setPage = useCallback((tabId, page) => {
        setPages((prev) => ({ ...prev, [tabId]: page }))
    }, [])

    /**
     * Open delete dialog for an article
     */
    const openDeleteDialog = useCallback((article) => {
        setArticleToDelete(article)
        setDeleteDialogOpen(true)
    }, [])

    /**
     * Close delete dialog
     */
    const closeDeleteDialog = useCallback(() => {
        setDeleteDialogOpen(false)
        setArticleToDelete(null)
    }, [])

    return {
        // State
        articles,
        isLoading,
        isCreating,
        activeTab,
        selectedArticle,
        isFullscreenOpen,
        deleteDialogOpen,
        articleToDelete,
        refreshingTab,
        deletingId,
        submittingId,
        sidebarOpen,
        articleSearchTerm,
        pages,

        // Setters
        setActiveTab,
        setSelectedArticle,
        setIsFullscreenOpen,
        setSidebarOpen,
        setArticleSearchTerm,
        setPage,

        // Actions
        fetchArticles,
        createArticle,
        deleteArticle,
        submitForReview,
        importToDrafts,
        refreshCategory,
        refreshAll,
        handleArticleUpdate,
        openDeleteDialog,
        closeDeleteDialog,

        // Computed
        getFilteredArticles,
        getPaginatedArticles,
        getCounts,

        // Session
        session,

        // Constants
        TABS,
        STATUS_CONFIG,
        ITEMS_PER_PAGE,
    }
}
