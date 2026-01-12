"use client"

import { useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import { usePrompts } from "@/contexts/promptsContext"
import { toast } from "sonner"
import { arrayMove } from '@dnd-kit/sortable'

const PROMPTS_PER_PAGE = 5
const agents = ["reviewer", "implementation", "tester", "report"]

/**
 * Custom hook for managing prompts state and operations.
 * Handles CRUD operations, drag-and-drop reordering, bulk delete, and pagination.
 * Supports both authenticated mode and demo mode.
 */
export function usePromptManagement() {
    const pathname = usePathname()
    const isDemoMode = pathname?.startsWith('/demo')

    const {
        prompts,
        addPrompt: addPromptContext,
        editPrompt: editPromptContext,
        deletePrompt: deletePromptContext,
        bulkDeletePrompts,
        reorderPrompts,
        refresh: refreshPrompts,
    } = usePrompts()

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [currentAgent, setCurrentAgent] = useState("reviewer")
    const [viewFullTextPrompt, setViewFullTextPrompt] = useState(null)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // New prompt form state
    const [newTitle, setNewTitle] = useState("")
    const [newPrompt, setNewPrompt] = useState("")

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingPromptData, setEditingPromptData] = useState(null)

    // Delete dialog state
    const [deleteDialog, setDeleteDialog] = useState(null)

    // Selected prompts for bulk operations
    const [selectedPrompts, setSelectedPrompts] = useState(new Set())

    // Pagination state per agent
    const [promptPages, setPromptPages] = useState({
        reviewer: 1,
        implementation: 1,
        tester: 1,
        report: 1,
    })

    // Drag state
    const [activeId, setActiveId] = useState(null)
    const [activeDragAgent, setActiveDragAgent] = useState(null)

    /**
     * Add a new prompt
     */
    const handleAddPrompt = useCallback(async () => {
        if (!newTitle.trim() || !newPrompt.trim()) {
            toast.error("Please enter both title and prompt")
            return
        }

        const result = await addPromptContext(currentAgent, { 
            title: newTitle.trim(), 
            text: newPrompt.trim() 
        })
        
        if (result.success) {
            setNewTitle("")
            setNewPrompt("")
            setIsDialogOpen(false)
            toast.success("Prompt added successfully!")
        } else {
            toast.error(result.error || "Failed to add prompt")
        }
    }, [newTitle, newPrompt, currentAgent, addPromptContext])

    /**
     * Edit an existing prompt
     */
    const handleEditPrompt = useCallback(async (agent, id, title, text) => {
        const trimmedTitle = title.trim()
        const trimmedText = text.trim()
        
        if (!trimmedTitle || !trimmedText) {
            toast.error("Title and prompt cannot be empty")
            return
        }

        const result = await editPromptContext(agent, id, { 
            title: trimmedTitle, 
            text: trimmedText 
        })
        
        if (result.success) {
            setEditDialogOpen(false)
            setEditingPromptData(null)
            toast.success("Prompt updated successfully!")
        } else {
            toast.error(result.error || "Failed to update prompt")
        }
    }, [editPromptContext])

    /**
     * Open edit dialog for a prompt
     */
    const openEditDialog = useCallback((agent, prompt) => {
        setEditingPromptData({
            agent,
            id: prompt.id,
            title: prompt.title || "",
            text: prompt.text
        })
        setEditDialogOpen(true)
    }, [])

    /**
     * Delete a single prompt
     */
    const handleDeletePrompt = useCallback(async (agent, id) => {
        const result = await deletePromptContext(agent, id)
        if (result.success) {
            toast.success("Prompt deleted successfully!")
        } else {
            toast.error(result.error || "Failed to delete prompt")
        }
    }, [deletePromptContext])

    /**
     * Delete selected prompts (bulk)
     */
    const handleDeleteSelected = useCallback(async () => {
        if (selectedPrompts.size === 0) return

        const ids = Array.from(selectedPrompts)
            .map(key => key.split('-')[1])
            .filter(Boolean)
        
        const result = await bulkDeletePrompts(ids)

        if (result?.success) {
            toast.success(`${(result.deletedIds || []).length} prompt(s) deleted successfully!`)
        } else {
            const deletedCount = (result?.deletedIds || []).length
            const missingCount = (result?.missingIds || []).length
            const s3FailedCount = (result?.s3Failed || []).length

            const summary = [
                deletedCount ? `${deletedCount} deleted` : null,
                missingCount ? `${missingCount} missing` : null,
                s3FailedCount ? `${s3FailedCount} storage cleanup failed` : null,
            ].filter(Boolean).join(', ')

            toast.error(summary || result?.error || 'Bulk deletion failed')
        }

        setSelectedPrompts(new Set())
    }, [selectedPrompts, bulkDeletePrompts])

    /**
     * Delete all prompts from a category
     */
    const handleDeleteAllFromCategory = useCallback(async (agent) => {
        const promptsToDelete = prompts[agent] || []
        const deletePromises = promptsToDelete.map(prompt => 
            deletePromptContext(agent, prompt.id)
        )
        const results = await Promise.all(deletePromises)
        const successCount = results.filter(r => r.success).length

        if (successCount === promptsToDelete.length) {
            toast.success(`All ${successCount} prompts from ${agent} deleted successfully!`)
        } else {
            toast.error(`Failed to delete some prompts. ${successCount} deleted.`)
        }
    }, [prompts, deletePromptContext])

    /**
     * Confirm delete action based on dialog type
     */
    const confirmDelete = useCallback(async () => {
        if (!deleteDialog) return

        if (deleteDialog.type === 'single') {
            await handleDeletePrompt(deleteDialog.agent, deleteDialog.id)
        } else if (deleteDialog.type === 'selected') {
            await handleDeleteSelected()
        } else if (deleteDialog.type === 'category') {
            await handleDeleteAllFromCategory(deleteDialog.agent)
        }

        setDeleteDialog(null)
    }, [deleteDialog, handleDeletePrompt, handleDeleteSelected, handleDeleteAllFromCategory])

    /**
     * Refresh prompts
     */
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true)
        if (isDemoMode) {
            await new Promise(resolve => setTimeout(resolve, 600))
        }
        await refreshPrompts()
        setIsRefreshing(false)
        toast.success("Prompts refreshed successfully!")
    }, [isDemoMode, refreshPrompts])

    /**
     * Handle drag start
     */
    const handleDragStart = useCallback((event, agent) => {
        setActiveId(event.active.id)
        setActiveDragAgent(agent)
    }, [])

    /**
     * Handle drag end - reorder prompts
     */
    const handleDragEnd = useCallback(async (event, agent) => {
        const { active, over } = event

        setActiveId(null)
        setActiveDragAgent(null)

        if (over && active.id !== over.id) {
            const oldIndex = prompts[agent].findIndex(p => p.id === active.id)
            const newIndex = prompts[agent].findIndex(p => p.id === over.id)

            const newOrder = arrayMove(prompts[agent], oldIndex, newIndex)
            const orderedIds = newOrder.map(p => p.id)

            const result = await reorderPrompts(agent, orderedIds)
            if (!result.success) {
                toast.error("Failed to reorder prompts")
            }
        }
    }, [prompts, reorderPrompts])

    /**
     * Move prompt up in order
     */
    const handleMoveUp = useCallback(async (agent, promptId) => {
        const currentPrompts = prompts[agent] || []
        const currentIndex = currentPrompts.findIndex(p => p.id === promptId)
        if (currentIndex <= 0) return

        const newOrder = arrayMove(currentPrompts, currentIndex, currentIndex - 1)
        const orderedIds = newOrder.map(p => p.id)

        const result = await reorderPrompts(agent, orderedIds)
        if (!result.success) {
            toast.error("Failed to move prompt up")
        }
    }, [prompts, reorderPrompts])

    /**
     * Move prompt down in order
     */
    const handleMoveDown = useCallback(async (agent, promptId) => {
        const currentPrompts = prompts[agent] || []
        const currentIndex = currentPrompts.findIndex(p => p.id === promptId)
        if (currentIndex < 0 || currentIndex === currentPrompts.length - 1) return

        const newOrder = arrayMove(currentPrompts, currentIndex, currentIndex + 1)
        const orderedIds = newOrder.map(p => p.id)

        const result = await reorderPrompts(agent, orderedIds)
        if (!result.success) {
            toast.error("Failed to move prompt down")
        }
    }, [prompts, reorderPrompts])

    /**
     * Get paginated prompts for an agent
     */
    const getPaginatedPrompts = useCallback((agent) => {
        const agentPrompts = prompts[agent] || []
        const page = promptPages[agent] || 1
        const totalPages = Math.ceil(agentPrompts.length / PROMPTS_PER_PAGE)
        const paginatedItems = agentPrompts.slice(
            (page - 1) * PROMPTS_PER_PAGE,
            page * PROMPTS_PER_PAGE
        )
        
        return {
            items: paginatedItems,
            currentPage: page,
            totalPages,
            totalCount: agentPrompts.length,
        }
    }, [prompts, promptPages])

    /**
     * Set page for an agent
     */
    const setAgentPage = useCallback((agent, page) => {
        setPromptPages(prev => ({ ...prev, [agent]: page }))
    }, [])

    /**
     * Truncate text helper
     */
    const truncateText = useCallback((text, maxLength = 50) => {
        if (!text) return ""
        if (text.length <= maxLength) return text
        return text.slice(0, maxLength) + "..."
    }, [])

    return {
        // Data
        prompts,
        agents,
        
        // Dialog states
        isDialogOpen,
        setIsDialogOpen,
        currentAgent,
        setCurrentAgent,
        viewFullTextPrompt,
        setViewFullTextPrompt,
        isRefreshing,
        
        // New prompt form
        newTitle,
        setNewTitle,
        newPrompt,
        setNewPrompt,
        
        // Edit dialog
        editDialogOpen,
        setEditDialogOpen,
        editingPromptData,
        setEditingPromptData,
        
        // Delete dialog
        deleteDialog,
        setDeleteDialog,
        
        // Selection
        selectedPrompts,
        setSelectedPrompts,
        
        // Pagination
        promptPages,
        setPromptPages,
        getPaginatedPrompts,
        setAgentPage,
        PROMPTS_PER_PAGE,
        
        // Drag state
        activeId,
        activeDragAgent,
        
        // Actions
        handleAddPrompt,
        handleEditPrompt,
        openEditDialog,
        handleDeletePrompt,
        handleDeleteSelected,
        handleDeleteAllFromCategory,
        confirmDelete,
        handleRefresh,
        handleDragStart,
        handleDragEnd,
        handleMoveUp,
        handleMoveDown,
        
        // Helpers
        truncateText,
        isDemoMode,
    }
}
