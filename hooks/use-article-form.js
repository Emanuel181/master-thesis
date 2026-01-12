"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"

// Predefined gradients
const PRESET_GRADIENTS = [
    { name: "Security Red", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(0,70%,35%), hsl(20,80%,30%), hsl(350,60%,35%), hsl(10,70%,20%))" },
    { name: "Ocean Teal", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(180,70%,25%), hsl(200,80%,30%), hsl(170,60%,35%), hsl(190,70%,20%))" },
    { name: "Purple Haze", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(270,70%,35%), hsl(290,80%,30%), hsl(260,60%,40%), hsl(280,70%,25%))" },
    { name: "Emerald", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(140,70%,30%), hsl(160,80%,25%), hsl(130,60%,35%), hsl(150,70%,20%))" },
    { name: "Amber Glow", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(40,80%,45%), hsl(30,90%,40%), hsl(45,70%,50%), hsl(35,85%,35%))" },
    { name: "Sunset", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(15,80%,50%), hsl(30,90%,45%), hsl(350,70%,45%), hsl(10,85%,40%))" },
    { name: "Deep Blue", value: "linear-gradient(45deg, hsl(220,70%,15%), hsl(230,80%,35%), hsl(240,70%,30%), hsl(225,75%,40%), hsl(235,80%,25%))" },
    { name: "Cyber", value: "linear-gradient(45deg, hsl(220,60%,10%), hsl(180,100%,35%), hsl(200,90%,30%), hsl(160,80%,40%), hsl(190,95%,25%))" },
]

// Categories
const CATEGORIES = [
    "Vulnerability Analysis", "Security Testing", "Web Security", "DevSecOps",
    "Cloud Security", "API Security", "Mobile Security", "General",
]

// Available icons
const ICONS = [
    { name: "Shield" }, { name: "Code" }, { name: "Zap" }, { name: "Lock" },
    { name: "AlertTriangle" }, { name: "Bug" }, { name: "Eye" }, { name: "Key" },
    { name: "Server" }, { name: "Database" }, { name: "Globe" }, { name: "Wifi" },
    { name: "Terminal" }, { name: "FileCode" }, { name: "GitBranch" }, { name: "Cloud" },
    { name: "Cpu" }, { name: "HardDrive" },
]

const ICONS_PER_PAGE = 9

// Icon position options
const ICON_POSITIONS = [
    { id: "top-left", label: "Top Left", class: "items-start justify-start" },
    { id: "top-center", label: "Top Center", class: "items-start justify-center" },
    { id: "top-right", label: "Top Right", class: "items-start justify-end" },
    { id: "center-left", label: "Center Left", class: "items-center justify-start" },
    { id: "center", label: "Center", class: "items-center justify-center" },
    { id: "center-right", label: "Center Right", class: "items-center justify-end" },
    { id: "bottom-left", label: "Bottom Left", class: "items-end justify-start" },
    { id: "bottom-center", label: "Bottom Center", class: "items-end justify-center" },
    { id: "bottom-right", label: "Bottom Right", class: "items-end justify-end" },
]

// Icon color options
const ICON_COLORS = [
    { id: "white", label: "White", value: "#ffffff", bg: "bg-black/40" },
    { id: "black", label: "Black", value: "#000000", bg: "bg-white/40" },
    { id: "red", label: "Red", value: "#ef4444", bg: "bg-black/40" },
    { id: "orange", label: "Orange", value: "#f97316", bg: "bg-black/40" },
    { id: "amber", label: "Amber", value: "#f59e0b", bg: "bg-black/40" },
    { id: "yellow", label: "Yellow", value: "#eab308", bg: "bg-black/40" },
    { id: "lime", label: "Lime", value: "#84cc16", bg: "bg-black/40" },
    { id: "green", label: "Green", value: "#22c55e", bg: "bg-black/40" },
    { id: "emerald", label: "Emerald", value: "#10b981", bg: "bg-black/40" },
    { id: "teal", label: "Teal", value: "#14b8a6", bg: "bg-black/40" },
    { id: "cyan", label: "Cyan", value: "#06b6d4", bg: "bg-black/40" },
    { id: "sky", label: "Sky", value: "#0ea5e9", bg: "bg-black/40" },
    { id: "blue", label: "Blue", value: "#3b82f6", bg: "bg-black/40" },
    { id: "indigo", label: "Indigo", value: "#6366f1", bg: "bg-black/40" },
    { id: "violet", label: "Violet", value: "#8b5cf6", bg: "bg-black/40" },
    { id: "purple", label: "Purple", value: "#a855f7", bg: "bg-black/40" },
    { id: "fuchsia", label: "Fuchsia", value: "#d946ef", bg: "bg-black/40" },
    { id: "pink", label: "Pink", value: "#ec4899", bg: "bg-black/40" },
    { id: "rose", label: "Rose", value: "#f43f5e", bg: "bg-black/40" },
]

// Sanitize string input to prevent injection attacks
const sanitizeString = (value) => {
    if (typeof value !== 'string') return ''
    return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()
}

/**
 * Custom hook for managing article form state and operations.
 * Handles form state, auto-save, and article updates.
 */
export function useArticleForm(selectedArticle, isFullscreenOpen, onArticleUpdate) {
    // Edit form state
    const [formState, setFormState] = useState({
        title: "",
        excerpt: "",
        category: "General",
        coverType: "gradient",
        gradient: PRESET_GRADIENTS[0].value,
        coverImage: "",
        iconName: "Shield",
        iconPosition: "center",
        iconColor: "white",
    })

    // Icon search and pagination
    const [iconSearch, setIconSearch] = useState("")
    const [iconPage, setIconPage] = useState(1)

    // Auto-save timestamp
    const [lastSavedAt, setLastSavedAt] = useState(null)

    // Computed: can edit article
    const canEdit = selectedArticle && selectedArticle.status !== "PUBLISHED" && selectedArticle.status !== "APPROVED"
    const canSubmit = selectedArticle && ["DRAFT", "REJECTED"].includes(selectedArticle.status)

    /**
     * Initialize form state from selected article
     */
    const initializeForm = useCallback((article) => {
        if (!article) return
        setFormState({
            title: sanitizeString(article.title) || "",
            excerpt: sanitizeString(article.excerpt) || "",
            category: article.category || "General",
            coverType: article.coverType || "gradient",
            gradient: article.gradient || PRESET_GRADIENTS[0].value,
            coverImage: sanitizeString(article.coverImage) || "",
            iconName: article.iconName || "Shield",
            iconPosition: article.iconPosition || "center",
            iconColor: article.iconColor || "white",
        })
    }, [])

    // Initialize form when article changes
    useEffect(() => {
        if (selectedArticle) {
            initializeForm(selectedArticle)
        }
    }, [selectedArticle, initializeForm])

    /**
     * Update a single form field
     */
    const updateField = useCallback((field, value) => {
        setFormState((prev) => ({ ...prev, [field]: value }))
    }, [])

    /**
     * Save article metadata to API
     */
    const saveArticle = useCallback(async (silent = false) => {
        if (!selectedArticle) return
        try {
            const response = await fetch(`/api/articles/${selectedArticle.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formState.title,
                    excerpt: formState.excerpt,
                    category: formState.category,
                    coverType: formState.coverType,
                    gradient: formState.coverType === "gradient" ? formState.gradient : null,
                    coverImage: formState.coverType === "image" ? formState.coverImage : null,
                    iconName: formState.iconName,
                    iconPosition: formState.iconPosition,
                    iconColor: formState.iconColor,
                }),
            })
            if (!response.ok) throw new Error("Failed to update article")
            const data = await response.json()
            onArticleUpdate?.({ ...selectedArticle, ...data.article })
            setLastSavedAt(new Date())
            if (!silent) {
                toast.success("Article saved")
            }
        } catch (error) {
            console.error("Error updating article:", error)
            if (!silent) {
                toast.error("Failed to update article")
            }
        }
    }, [selectedArticle, formState, onArticleUpdate])

    // Auto-save every 30 seconds only when fullscreen editor is open
    useEffect(() => {
        if (!selectedArticle || !canEdit || !isFullscreenOpen) return

        const autoSaveInterval = setInterval(() => {
            saveArticle(true) // silent save
        }, 30000) // 30 seconds

        return () => clearInterval(autoSaveInterval)
    }, [selectedArticle, canEdit, isFullscreenOpen, saveArticle])

    // Save on page unload/close (only if fullscreen editor was open)
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (selectedArticle && canEdit && isFullscreenOpen) {
                const data = JSON.stringify({
                    title: formState.title,
                    excerpt: formState.excerpt,
                    category: formState.category,
                    coverType: formState.coverType,
                    gradient: formState.coverType === "gradient" ? formState.gradient : null,
                    coverImage: formState.coverType === "image" ? formState.coverImage : null,
                    iconName: formState.iconName,
                    iconPosition: formState.iconPosition,
                    iconColor: formState.iconColor,
                })
                navigator.sendBeacon(`/api/articles/${selectedArticle.id}`, new Blob([data], { type: 'application/json' }))
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [selectedArticle, canEdit, isFullscreenOpen, formState])

    // Icon filtering and pagination
    const filteredIcons = ICONS.filter((icon) => icon.name.toLowerCase().includes(iconSearch.toLowerCase()))
    const totalIconPages = Math.ceil(filteredIcons.length / ICONS_PER_PAGE)
    const paginatedIcons = filteredIcons.slice((iconPage - 1) * ICONS_PER_PAGE, iconPage * ICONS_PER_PAGE)

    // Reset icon page when search changes
    useEffect(() => {
        setIconPage(1)
    }, [iconSearch])

    /**
     * Handle file upload for cover image
     */
    const handleCoverImageUpload = useCallback((file) => {
        if (!file) return
        const reader = new FileReader()
        reader.onloadend = () => {
            setFormState((prev) => ({ ...prev, coverImage: reader.result }))
        }
        reader.readAsDataURL(file)
    }, [])

    /**
     * Toggle icon selection
     */
    const toggleIcon = useCallback((iconName) => {
        setFormState((prev) => ({
            ...prev,
            iconName: prev.iconName === iconName ? "" : iconName
        }))
    }, [])

    return {
        // Form state
        formState,
        setFormState,
        updateField,

        // Icon state
        iconSearch,
        setIconSearch,
        iconPage,
        setIconPage,
        filteredIcons,
        paginatedIcons,
        totalIconPages,

        // Auto-save
        lastSavedAt,

        // Computed
        canEdit,
        canSubmit,

        // Actions
        initializeForm,
        saveArticle,
        handleCoverImageUpload,
        toggleIcon,

        // Constants
        PRESET_GRADIENTS,
        CATEGORIES,
        ICONS,
        ICONS_PER_PAGE,
        ICON_POSITIONS,
        ICON_COLORS,
    }
}
