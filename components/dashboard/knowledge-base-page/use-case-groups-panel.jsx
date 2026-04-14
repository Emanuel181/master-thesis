"use client"

import React, { useState, useEffect, useMemo } from "react"
import { usePathname } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    FolderPlus,
    Folder,
    ChevronRight,
    ChevronDown,
    MoreVertical,
    Pencil,
    Trash2,
    Loader2,
    Check,
    LayoutGrid,
    List,
    Search,
    X,
    FileText,
    PanelLeftClose,
    GripVertical,
    Download,
} from "lucide-react"
import * as LucideIcons from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { categoryColors } from "./add-category-dialog"

// Extracted outside parent component to avoid re-creation on every render
const GroupIcon = ({ iconName, className }) => {
    const Icon = LucideIcons[iconName] || Folder
    return <Icon className={className} />
}

export function UseCaseGroupsPanel({
    groups,
    useCases,
    selectedGroupId,
    onSelectGroup,
    onGroupsChange,
    selectedUseCases = new Set(),
    onMoveUseCases,
    onSelectUseCase,
    onCollapse,
    onDownloadGroup,
    onBulkDownloadGroups,
    isDownloading = false,
}) {
    const pathname = usePathname()
    const isDemoMode = pathname?.startsWith('/demo')


    const [isLoading, setIsLoading] = useState(false)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [groupToEdit, setGroupToEdit] = useState(null)
    const [groupToDelete, setGroupToDelete] = useState(null)

    // Search state
    const [searchTerm, setSearchTerm] = useState("")
    const [showSearch, setShowSearch] = useState(false)

    // View mode state: "tree" or "grid"
    const [viewMode, setViewMode] = useState("tree")

    // Drag-drop state (for dropping use cases onto groups)
    const [dragOverGroupId, setDragOverGroupId] = useState(null)

    // Drag-reorder state (for reordering the groups themselves)
    const [draggingGroupId, setDraggingGroupId] = useState(null)
    const [dropTargetGroupId, setDropTargetGroupId] = useState(null)
    const [dropPosition, setDropPosition] = useState(null) // "above" | "below"

    // Multi-select groups for bulk actions
    const [selectedGroups, setSelectedGroups] = useState(new Set())

    const toggleGroupSelection = (groupId) => {
        setSelectedGroups(prev => {
            const next = new Set(prev)
            if (next.has(groupId)) next.delete(groupId)
            else next.add(groupId)
            return next
        })
    }

    // Form state
    const [newGroupName, setNewGroupName] = useState("")
    const [newGroupIcon, setNewGroupIcon] = useState("Folder")
    const [newGroupColor, setNewGroupColor] = useState("default")

    // Track expanded groups
    const [expandedGroups, setExpandedGroups] = useState(new Set())

    // Initialize expanded state based on selected group
    useEffect(() => {
        if (selectedGroupId) {
            setExpandedGroups(prev => new Set(prev).add(selectedGroupId))
        }
    }, [selectedGroupId])

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => {
            const next = new Set(prev)
            if (next.has(groupId)) {
                next.delete(groupId)
            } else {
                next.add(groupId)
            }
            return next
        })
    }

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            toast.error("Please enter a group name")
            return
        }

        setIsLoading(true)
        try {
            if (isDemoMode) {
                // Mock create in demo mode
                const newGroup = {
                    id: `demo-group-${Date.now()}`,
                    name: newGroupName.trim(),
                    icon: newGroupIcon,
                    color: newGroupColor,
                    order: groups.length,
                    parentId: null,
                    useCaseCount: 0,
                }
                onGroupsChange?.([...groups, newGroup])
                toast.success("Group created (demo)")
            } else {
                const response = await fetch("/api/use-case-groups", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        name: newGroupName.trim(),
                        icon: newGroupIcon,
                        color: newGroupColor,
                    }),
                })

                if (!response.ok) {
                    throw new Error("Failed to create group")
                }

                const { group } = await response.json()
                
                // Force immediate UI update
                const updatedGroups = [...groups, group]
                onGroupsChange?.(updatedGroups)
                
                toast.success("Group created successfully")
                
                // Force a page refresh to ensure data consistency
                window.location.reload()
            }

            setCreateDialogOpen(false)
            setNewGroupName("")
            setNewGroupIcon("Folder")
            setNewGroupColor("default")
        } catch (error) {
            console.error("Error creating group:", error)
            toast.error("Failed to create group")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEditGroup = async () => {
        if (!groupToEdit || !newGroupName.trim()) return

        setIsLoading(true)
        try {
            if (isDemoMode) {
                const updatedGroups = groups.map(g =>
                    g.id === groupToEdit.id
                        ? { ...g, name: newGroupName.trim(), icon: newGroupIcon, color: newGroupColor }
                        : g
                )
                onGroupsChange?.(updatedGroups)
                toast.success("Group updated (demo)")
            } else {
                const response = await fetch(`/api/use-case-groups/${groupToEdit.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        name: newGroupName.trim(),
                        icon: newGroupIcon,
                        color: newGroupColor,
                    }),
                })

                if (!response.ok) {
                    throw new Error("Failed to update group")
                }

                const { group } = await response.json()
                const updatedGroups = groups.map(g => g.id === group.id ? group : g)
                onGroupsChange?.(updatedGroups)
                toast.success("Group updated successfully")
            }

            setEditDialogOpen(false)
            setGroupToEdit(null)
        } catch (error) {
            console.error("Error updating group:", error)
            toast.error("Failed to update group")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteGroup = async () => {
        if (!groupToDelete) return

        setIsLoading(true)
        try {
            if (isDemoMode) {
                const updatedGroups = groups.filter(g => g.id !== groupToDelete.id)
                onGroupsChange?.(updatedGroups)
                toast.success("Group deleted (demo)")
            } else {
                const response = await fetch(`/api/use-case-groups/${groupToDelete.id}`, {
                    method: "DELETE",
                    credentials: "include",
                })

                if (!response.ok) {
                    throw new Error("Failed to delete group")
                }

                const updatedGroups = groups.filter(g => g.id !== groupToDelete.id)
                onGroupsChange?.(updatedGroups)
                toast.success("Group deleted successfully")
            }

            setDeleteDialogOpen(false)
            setGroupToDelete(null)
            if (selectedGroupId === groupToDelete.id) {
                onSelectGroup(null)
            }
        } catch (error) {
            console.error("Error deleting group:", error)
            toast.error("Failed to delete group")
        } finally {
            setIsLoading(false)
        }
    }

    const openEditDialog = (group) => {
        setGroupToEdit(group)
        setNewGroupName(group.name)
        setNewGroupIcon(group.icon || "Folder")
        setNewGroupColor(group.color || "default")
        setEditDialogOpen(true)
    }

    const getUseCasesInGroup = (groupId) => {
        return useCases.filter(uc => uc.groupId === groupId)
    }

    const getUngroupedUseCases = () => {
        return useCases.filter(uc => !uc.groupId)
    }

    // Filter groups and use cases based on search term
    const filteredData = useMemo(() => {
        // Ensure groups is always an array and filter out any undefined/null values
        const validGroups = Array.isArray(groups) ? groups.filter(g => g?.id) : []
        const validUseCases = Array.isArray(useCases) ? useCases.filter(uc => uc?.id) : []

        if (!searchTerm.trim()) {
            return {
                groups: validGroups,
                ungroupedUseCases: getUngroupedUseCases(),
                matchedUseCaseIds: new Set(),
            };
        }

        const search = searchTerm.toLowerCase()
        const matchedUseCaseIds = new Set()
        const matchedGroupIds = new Set()

        // Search through use cases (name and description)
        validUseCases.forEach(uc => {
            const nameMatch = uc.name?.toLowerCase().includes(search)
            const descMatch = uc.description?.toLowerCase().includes(search)
            // Also search through PDFs if available
            const pdfMatch = uc.pdfs?.some(pdf =>
                pdf.name?.toLowerCase().includes(search) ||
                pdf.title?.toLowerCase().includes(search)
            )

            if (nameMatch || descMatch || pdfMatch) {
                matchedUseCaseIds.add(uc.id)
                if (uc.groupId) {
                    matchedGroupIds.add(uc.groupId)
                }
            }
        })

        // Search through group names
        validGroups.forEach(group => {
            if (group.name?.toLowerCase().includes(search)) {
                matchedGroupIds.add(group.id)
            }
        })

        // Filter groups that either match by name or contain matching use cases
        const filteredGroups = validGroups.filter(group => matchedGroupIds.has(group.id))

        // Filter ungrouped use cases
        const filteredUngrouped = validUseCases.filter(uc =>
            !uc.groupId && matchedUseCaseIds.has(uc.id)
        )

        return {
            groups: filteredGroups,
            ungroupedUseCases: filteredUngrouped,
            matchedUseCaseIds,
        }
    }, [searchTerm, groups, useCases])

    // Drag-drop handlers
    const handleDragOver = (e, groupId) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOverGroupId(groupId)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setDragOverGroupId(null)
    }

    const handleDrop = (e, targetGroupId) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOverGroupId(null)

        // Get dragged use case IDs from dataTransfer
        const dragData = e.dataTransfer.getData("application/json")
        if (dragData) {
            try {
                const { useCaseIds } = JSON.parse(dragData)

                if (useCaseIds && useCaseIds.length > 0 && onMoveUseCases) {
                    onMoveUseCases(useCaseIds, targetGroupId)
                }
            } catch (err) {
                console.error("Error parsing drag data:", err)
            }
        }
    }

    // ── Group drag-reorder handlers ───────────────────────────────────
    const handleGroupDragStart = (e, groupId) => {
        e.stopPropagation()
        setDraggingGroupId(groupId)
        e.dataTransfer.setData("application/group-reorder", groupId)
        e.dataTransfer.effectAllowed = "move"
    }

    const handleGroupDragEnd = () => {
        setDraggingGroupId(null)
        setDropTargetGroupId(null)
        setDropPosition(null)
    }

    const handleGroupDragOver = (e, groupId) => {
        e.preventDefault()
        e.stopPropagation()

        // Only handle group reorder transfers
        if (!e.dataTransfer.types.includes("application/group-reorder")) return

        const rect = e.currentTarget.getBoundingClientRect()
        const midY = rect.top + rect.height / 2
        const pos = e.clientY < midY ? "above" : "below"

        setDropTargetGroupId(groupId)
        setDropPosition(pos)
        e.dataTransfer.dropEffect = "move"
    }

    const handleGroupDrop = async (e, targetGroupId) => {
        e.preventDefault()
        e.stopPropagation()

        const sourceGroupId = e.dataTransfer.getData("application/group-reorder")
        setDraggingGroupId(null)
        setDropTargetGroupId(null)
        setDropPosition(null)

        if (!sourceGroupId || sourceGroupId === targetGroupId) return

        // Compute new order
        const currentOrder = filteredData.groups.map(g => g.id)
        const sourceIdx = currentOrder.indexOf(sourceGroupId)
        let targetIdx = currentOrder.indexOf(targetGroupId)

        if (sourceIdx === -1 || targetIdx === -1) return

        // Remove source from its current position
        const newOrder = currentOrder.filter(id => id !== sourceGroupId)

        // Recalculate targetIdx after removal
        targetIdx = newOrder.indexOf(targetGroupId)
        const insertIdx = dropPosition === "below" ? targetIdx + 1 : targetIdx
        newOrder.splice(insertIdx, 0, sourceGroupId)

        // Optimistic update
        const reorderedGroups = newOrder.map((id, i) => {
            const g = groups.find(gr => gr.id === id)
            return g ? { ...g, order: i } : null
        }).filter(Boolean)

        onGroupsChange?.(reorderedGroups)

        // Persist
        if (!isDemoMode) {
            try {
                const res = await fetch("/api/use-case-groups/reorder", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ orderedIds: newOrder }),
                })
                if (!res.ok) throw new Error("Failed to reorder groups")
            } catch (err) {
                console.error("Error reordering groups:", err)
                toast.error("Failed to save group order")
                // Revert to original
                onGroupsChange?.(groups)
            }
        } else {
            toast.success("Groups reordered (demo)")
        }
    }



    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Header */}
            <div className="flex flex-col gap-2 p-3 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">Groups</h3>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                            {groups.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        {/* Collapse panel button */}
                        {onCollapse && (
                            <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={onCollapse}
                                        >
                                            <PanelLeftClose className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-xs">Collapse Panel</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}

                        {/* Search toggle */}
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={showSearch ? "secondary" : "ghost"}
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => {
                                            setShowSearch(!showSearch)
                                            if (showSearch) setSearchTerm("")
                                        }}
                                    >
                                        <Search className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">Search</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* View mode toggles */}
                        <div className="flex items-center border rounded-md">
                            <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant={viewMode === "tree" ? "secondary" : "ghost"}
                                            size="icon"
                                            className="h-7 w-7 rounded-r-none"
                                            onClick={() => setViewMode("tree")}
                                        >
                                            <List className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-xs">Tree View</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                                            size="icon"
                                            className="h-7 w-7 rounded-l-none"
                                            onClick={() => setViewMode("grid")}
                                        >
                                            <LayoutGrid className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-xs">Grid View</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        {/* Add group button */}
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => {
                                            setNewGroupName("")
                                            setNewGroupIcon("Folder")
                                            setNewGroupColor("default")
                                            setCreateDialogOpen(true)
                                        }}
                                    >
                                        <FolderPlus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">New Group</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                {/* Search input */}
                {showSearch && (
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search groups & files..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 pl-8 pr-8 text-xs"
                            autoFocus
                        />
                        {searchTerm && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                                onClick={() => setSearchTerm("")}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Bulk action bar for selected groups */}
            {selectedGroups.size > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 border-b bg-primary/5">
                    <span className="text-xs font-medium text-primary">
                        {selectedGroups.size} selected
                    </span>
                    <div className="flex-1" />
                    {onBulkDownloadGroups && (
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => onBulkDownloadGroups(Array.from(selectedGroups))}
                                        disabled={isDownloading}
                                    >
                                        {isDownloading ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Download className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">
                                    Download selected groups
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                    onClick={() => {
                                        // Delete all selected groups one by one
                                        const ids = Array.from(selectedGroups)
                                        if (ids.length === 1) {
                                            const g = groups.find(gr => gr.id === ids[0])
                                            if (g) {
                                                setGroupToDelete(g)
                                                setDeleteDialogOpen(true)
                                            }
                                        } else {
                                            // Bulk delete — confirm then proceed
                                            if (confirm(`Delete ${ids.length} groups? Use cases will be moved to Ungrouped.`)) {
                                                (async () => {
                                                    setIsLoading(true)
                                                    try {
                                                        for (const id of ids) {
                                                            if (!isDemoMode) {
                                                                await fetch(`/api/use-case-groups/${id}`, { method: "DELETE", credentials: "include" })
                                                            }
                                                        }
                                                        const remaining = groups.filter(g => !selectedGroups.has(g.id))
                                                        onGroupsChange?.(remaining)
                                                        setSelectedGroups(new Set())
                                                        toast.success(`${ids.length} groups deleted`)
                                                        if (selectedGroups.has(selectedGroupId)) onSelectGroup(null)
                                                    } catch (err) {
                                                        console.error("Bulk delete groups error:", err)
                                                        toast.error("Failed to delete some groups")
                                                    } finally {
                                                        setIsLoading(false)
                                                    }
                                                })()
                                            }
                                        }
                                    }}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                                Delete selected groups
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => setSelectedGroups(new Set())}
                    >
                        Clear
                    </Button>
                </div>
            )}

            {/* Groups List - Tree View */}
            {viewMode === "tree" && (
            <ScrollArea className="flex-1 h-0">
                <div className="p-2 space-y-1">
                    {/* All use cases view */}
                    <button
                        onClick={() => onSelectGroup(null)}
                        className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                            selectedGroupId === null
                                ? "bg-primary/10 text-primary border-l-2 border-l-primary font-medium"
                                : "hover:bg-muted"
                        )}
                    >
                        <LayoutGrid className="h-4 w-4 shrink-0" />
                        <span className="truncate">All use cases</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                            {useCases.length}
                        </span>
                    </button>

                    {/* Separator */}
                    <div className="h-px bg-border my-2" />

                    {/* Ungrouped folder - default location for use cases without a group */}
                    <div
                        onDragOver={(e) => handleDragOver(e, "ungrouped")}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, null)}
                        className={cn(
                            "rounded-md transition-all duration-200",
                            dragOverGroupId === "ungrouped" && "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/10 scale-[1.02]"
                        )}
                    >
                        <button
                            onClick={() => onSelectGroup("ungrouped")}
                            className={cn(
                                "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                                selectedGroupId === "ungrouped"
                                    ? "bg-primary/10 text-primary border-l-2 border-l-primary font-medium"
                                    : "hover:bg-muted",
                                dragOverGroupId === "ungrouped" && "bg-primary/15 text-primary font-medium"
                            )}
                        >
                            <Folder className={cn(
                                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                                dragOverGroupId === "ungrouped" && "scale-110 text-primary"
                            )} />
                            <span className="truncate">
                                {dragOverGroupId === "ungrouped" ? "Drop here" : "Ungrouped"}
                            </span>
                            <span className="ml-auto text-xs text-muted-foreground">
                                {searchTerm ? filteredData.ungroupedUseCases.length : getUngroupedUseCases().length}
                            </span>
                        </button>
                    </div>

                    {/* Separator if there are groups */}
                    {filteredData.groups.length > 0 && (
                        <div className="h-px bg-border my-2" />
                    )}

                    {/* No results message */}
                    {searchTerm && filteredData.groups.length === 0 && filteredData.ungroupedUseCases.length === 0 && (
                        <div className="flex flex-col items-center text-center py-6">
                            <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center mb-2">
                                <Search className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="text-xs font-medium text-muted-foreground">No results found</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Try a different search term</p>
                        </div>
                    )}

                    {/* Groups */}
                    {filteredData.groups.map((group) => {
                        const groupUseCases = getUseCasesInGroup(group.id)
                        const isExpanded = expandedGroups.has(group.id) || (searchTerm && filteredData.matchedUseCaseIds.size > 0)
                        const isSelected = selectedGroupId === group.id
                        const colorClass = categoryColors.find(c => c.name === group.color)?.class || ""
                        const isDragOver = dragOverGroupId === group.id
                        const isBeingDragged = draggingGroupId === group.id
                        const isDropTarget = dropTargetGroupId === group.id
                        const isChecked = selectedGroups.has(group.id)

                        return (
                            <Collapsible
                                key={group.id}
                                open={isExpanded}
                                onOpenChange={() => toggleGroup(group.id)}
                            >
                                {/* Drop indicator line - above */}
                                {isDropTarget && dropPosition === "above" && !isBeingDragged && (
                                    <div className="h-0.5 bg-primary rounded-full mx-1 -mb-0.5 transition-all" />
                                )}

                                <div
                                    draggable
                                    onDragStart={(e) => handleGroupDragStart(e, group.id)}
                                    onDragEnd={handleGroupDragEnd}
                                    onDragOver={(e) => {
                                        handleDragOver(e, group.id)
                                        handleGroupDragOver(e, group.id)
                                    }}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => {
                                        // Handle both use-case drops and group reorder drops
                                        if (e.dataTransfer.types.includes("application/group-reorder")) {
                                            handleGroupDrop(e, group.id)
                                        } else {
                                            handleDrop(e, group.id)
                                        }
                                    }}
                                    className={cn(
                                        "flex items-center gap-1 rounded-md transition-all duration-200 group",
                                        isSelected ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-muted",
                                        isDragOver && !isBeingDragged && "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/10 scale-[1.02]",
                                        isBeingDragged && "opacity-40 scale-[0.97]",
                                        isChecked && "ring-1 ring-primary/50 bg-primary/5"
                                    )}
                                >
                                    {/* Checkbox for multi-select */}
                                    <div className={cn(
                                        "shrink-0 pl-1",
                                        isChecked ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                                        "transition-opacity"
                                    )}>
                                        <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={() => toggleGroupSelection(group.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-3.5 w-3.5"
                                        />
                                    </div>

                                    {/* Drag grip handle */}
                                    <div className="opacity-0 group-hover:opacity-60 cursor-grab active:cursor-grabbing shrink-0 self-center">
                                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                                    </div>

                                    <CollapsibleTrigger asChild>
                                        <button className="p-1.5 hover:bg-muted/50 rounded-md">
                                            {isExpanded ? (
                                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                            )}
                                        </button>
                                    </CollapsibleTrigger>

                                    <TooltipProvider delayDuration={500}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelectGroup(group.id);
                                                    }}
                                                    className={cn(
                                                        "flex-1 flex items-center gap-2 py-1.5 pr-1 text-sm transition-all min-w-0",
                                                        isSelected ? "text-primary" : "",
                                                        isDragOver && "text-primary font-medium"
                                                    )}
                                                >
                                                    <GroupIcon
                                                        iconName={(isDragOver || isExpanded) ? "FolderOpen" : group.icon}
                                                        className={cn(
                                                            "h-4 w-4 shrink-0 transition-transform",
                                                            isDragOver
                                                                ? "text-primary scale-110"
                                                                : colorClass
                                                                    ? colorClass.replace('bg-', 'text-')
                                                                    : "text-muted-foreground"
                                                        )}
                                                    />
                                                    <span className="truncate max-w-[140px]">
                                                        {isDragOver ? "Drop here" : group.name}
                                                    </span>
                                                    <span className="ml-auto text-xs text-muted-foreground shrink-0">
                                                        {groupUseCases.length}
                                                    </span>
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="text-xs max-w-[250px]">
                                                {group.name}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                                            >
                                                <MoreVertical className="h-3.5 w-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditDialog(group)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            {onDownloadGroup && (
                                                <DropdownMenuItem
                                                    onClick={() => onDownloadGroup(group.id)}
                                                    disabled={isDownloading}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    {isDownloading ? "Downloading…" : "Download All"}
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setGroupToDelete(group)
                                                    setDeleteDialogOpen(true)
                                                }}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Drop indicator line - below */}
                                {isDropTarget && dropPosition === "below" && !isBeingDragged && (
                                    <div className="h-0.5 bg-primary rounded-full mx-1 -mt-0.5 transition-all" />
                                )}

                                <CollapsibleContent>
                                    <div className="ml-6 pl-2 border-l space-y-0.5 py-1 max-w-full overflow-hidden">
                                        {groupUseCases.length === 0 ? (
                                            <div className="flex items-center gap-2 py-2 px-2 rounded-md border border-dashed border-border/60">
                                                <FileText className="h-3 w-3 text-muted-foreground/50" />
                                                <p className="text-[10px] text-muted-foreground/70 italic">
                                                    No use cases — drag items here
                                                </p>
                                            </div>
                                        ) : (
                                            groupUseCases.map((uc) => {
                                                const UseCaseIcon = LucideIcons[uc.icon] || LucideIcons.File
                                                return (
                                                    <TooltipProvider key={uc.id} delayDuration={500}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        // Select this group and then select the use case
                                                                        onSelectGroup(group.id)
                                                                        onSelectUseCase?.(uc.id)
                                                                    }}
                                                                    className={cn(
                                                                        "w-full flex items-center gap-2 px-2 py-1 text-xs rounded-md hover:bg-muted/50 cursor-pointer transition-colors min-w-0",
                                                                        searchTerm && filteredData.matchedUseCaseIds.has(uc.id)
                                                                            ? "text-primary bg-primary/5 font-medium"
                                                                            : "text-muted-foreground hover:text-foreground"
                                                                    )}
                                                                >
                                                                    <UseCaseIcon className="h-3.5 w-3.5 shrink-0" />
                                                                    <span className="truncate text-left max-w-[150px]">{uc.name}</span>
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="right" className="text-xs max-w-[250px]">
                                                                {uc.name}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )
                                            })
                                        )}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        )
                    })}
                </div>
            </ScrollArea>
            )}

            {/* Groups List - Grid View */}
            {viewMode === "grid" && (
            <ScrollArea className="flex-1 h-0">
                <div className="p-2 space-y-2">
                    {/* All use cases card */}
                    <button
                        onClick={() => onSelectGroup(null)}
                        className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                            selectedGroupId === null
                                ? "bg-primary/10 border-primary text-primary"
                                : "hover:bg-muted border-transparent hover:border-border"
                        )}
                    >
                        <div className="p-2 rounded-md bg-muted">
                            <LayoutGrid className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-medium">All use cases</p>
                            <p className="text-xs text-muted-foreground">{useCases.length} items</p>
                        </div>
                    </button>

                    {/* Ungrouped card */}
                    <div
                        onDragOver={(e) => handleDragOver(e, "ungrouped")}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, null)}
                        className={cn(
                            "rounded-lg transition-all duration-200",
                            dragOverGroupId === "ungrouped" && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]"
                        )}
                    >
                        <button
                            onClick={() => onSelectGroup("ungrouped")}
                            className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                                selectedGroupId === "ungrouped"
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "hover:bg-muted border-transparent hover:border-border",
                                dragOverGroupId === "ungrouped" && "bg-primary/10 border-primary"
                            )}
                        >
                            <div className="p-2 rounded-md bg-muted">
                                <Folder className={cn(
                                    "h-5 w-5",
                                    dragOverGroupId === "ungrouped" && "text-primary"
                                )} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium">
                                    {dragOverGroupId === "ungrouped" ? "Drop here" : "Ungrouped"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {searchTerm ? filteredData.ungroupedUseCases.length : getUngroupedUseCases().length} items
                                </p>
                            </div>
                        </button>
                    </div>

                    {/* No results message */}
                    {searchTerm && filteredData.groups.length === 0 && filteredData.ungroupedUseCases.length === 0 && (
                        <div className="flex flex-col items-center text-center py-6 col-span-full">
                            <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center mb-2">
                                <Search className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="text-xs font-medium text-muted-foreground">No results found</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Try a different search term</p>
                        </div>
                    )}

                    {/* Group cards */}
                    {filteredData.groups.map((group) => {
                        const groupUseCases = getUseCasesInGroup(group.id)
                        const colorClass = categoryColors.find(c => c.name === group.color)?.class || ""
                        const isDragOver = dragOverGroupId === group.id
                        const isBeingDragged = draggingGroupId === group.id
                        const isDropTarget = dropTargetGroupId === group.id
                        const isChecked = selectedGroups.has(group.id)

                        return (
                            <div key={group.id}>
                                {/* Drop indicator - above */}
                                {isDropTarget && dropPosition === "above" && !isBeingDragged && (
                                    <div className="h-0.5 bg-primary rounded-full mx-1 mb-1 transition-all" />
                                )}
                                <div
                                    draggable
                                    onDragStart={(e) => handleGroupDragStart(e, group.id)}
                                    onDragEnd={handleGroupDragEnd}
                                    onDragOver={(e) => {
                                        handleDragOver(e, group.id)
                                        handleGroupDragOver(e, group.id)
                                    }}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => {
                                        if (e.dataTransfer.types.includes("application/group-reorder")) {
                                            handleGroupDrop(e, group.id)
                                        } else {
                                            handleDrop(e, group.id)
                                        }
                                    }}
                                    className={cn(
                                        "rounded-lg transition-all duration-200",
                                        isDragOver && !isBeingDragged && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]",
                                        isBeingDragged && "opacity-40 scale-[0.97]"
                                    )}
                                >
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onSelectGroup(group.id)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectGroup(group.id); } }}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-lg border transition-all group cursor-pointer",
                                        selectedGroupId === group.id
                                            ? "bg-primary/10 border-primary text-primary border-l-[3px]"
                                            : "hover:bg-muted border-transparent hover:border-border",
                                        isDragOver && "bg-primary/10 border-primary",
                                        isChecked && "ring-1 ring-primary/50 bg-primary/5"
                                    )}
                                >
                                    {/* Checkbox for multi-select */}
                                    <div className={cn(
                                        "shrink-0 -ml-1",
                                        isChecked ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                                        "transition-opacity"
                                    )}>
                                        <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={() => toggleGroupSelection(group.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-4 w-4"
                                        />
                                    </div>

                                    {/* Drag grip */}
                                    <div className="opacity-0 group-hover:opacity-60 cursor-grab active:cursor-grabbing shrink-0 -ml-1">
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>

                                    <div className={cn(
                                        "p-2 rounded-md",
                                        colorClass || "bg-muted"
                                    )}>
                                        <GroupIcon
                                            iconName={isDragOver ? "FolderOpen" : group.icon}
                                            className={cn(
                                                "h-5 w-5",
                                                isDragOver
                                                    ? "text-primary"
                                                    : colorClass
                                                        ? "text-white"
                                                        : "text-muted-foreground"
                                            )}
                                        />
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            {colorClass && (
                                                <div className={cn(
                                                    "h-2 w-2 rounded-full shrink-0",
                                                    colorClass
                                                )} />
                                            )}
                                            <p className="text-sm font-medium truncate">
                                                {isDragOver ? "Drop here" : group.name}
                                            </p>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {groupUseCases.length} item{groupUseCases.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditDialog(group)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            {onDownloadGroup && (
                                                <DropdownMenuItem
                                                    onClick={() => onDownloadGroup(group.id)}
                                                    disabled={isDownloading}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    {isDownloading ? "Downloading…" : "Download All"}
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setGroupToDelete(group)
                                                    setDeleteDialogOpen(true)
                                                }}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                                {/* Drop indicator - below */}
                                {isDropTarget && dropPosition === "below" && !isBeingDragged && (
                                    <div className="h-0.5 bg-primary rounded-full mx-1 mt-1 transition-all" />
                                )}
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
            )}

            {/* Create Group Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Group</DialogTitle>
                        <DialogDescription>
                            Create a new group to organize your use cases.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="group-name">Name</Label>
                            <Input
                                id="group-name"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="e.g., Web Security"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Color</Label>
                            <div className="flex flex-wrap gap-2">
                                {categoryColors.map((c) => (
                                    <button
                                        key={c.name}
                                        type="button"
                                        onClick={() => setNewGroupColor(c.name)}
                                        className={cn(
                                            "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all",
                                            c.class,
                                            newGroupColor === c.name ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                                        )}
                                        title={c.label}
                                    >
                                        {newGroupColor === c.name && <Check className="h-3 w-3" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateGroup} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Group Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Group</DialogTitle>
                        <DialogDescription>
                            Update the group details.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-group-name">Name</Label>
                            <Input
                                id="edit-group-name"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Color</Label>
                            <div className="flex flex-wrap gap-2">
                                {categoryColors.map((c) => (
                                    <button
                                        key={c.name}
                                        type="button"
                                        onClick={() => setNewGroupColor(c.name)}
                                        className={cn(
                                            "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all",
                                            c.class,
                                            newGroupColor === c.name ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                                        )}
                                        title={c.label}
                                    >
                                        {newGroupColor === c.name && <Check className="h-3 w-3" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditGroup} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Group</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{groupToDelete?.name}&quot;? Use cases in this group will be moved to ungrouped.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteGroup} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

