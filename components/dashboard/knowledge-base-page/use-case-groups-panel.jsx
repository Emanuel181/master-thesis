"use client"

import React, { useState, useEffect, useMemo } from "react"
import { usePathname } from "next/navigation"
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
} from "lucide-react"
import * as LucideIcons from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { categoryColors } from "./add-category-dialog"

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

    // Drag-drop state
    const [dragOverGroupId, setDragOverGroupId] = useState(null)

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
                onGroupsChange?.([...groups, group])
                toast.success("Group created successfully")
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
        if (!searchTerm.trim()) {
            return {
                groups: groups,
                ungroupedUseCases: getUngroupedUseCases(),
                matchedUseCaseIds: new Set(),
            }
        }

        const search = searchTerm.toLowerCase()
        const matchedUseCaseIds = new Set()
        const matchedGroupIds = new Set()

        // Search through use cases (name and description)
        useCases.forEach(uc => {
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
        groups.forEach(group => {
            if (group.name?.toLowerCase().includes(search)) {
                matchedGroupIds.add(group.id)
            }
        })

        // Filter groups that either match by name or contain matching use cases
        const filteredGroups = groups.filter(group => matchedGroupIds.has(group.id))

        // Filter ungrouped use cases
        const filteredUngrouped = useCases.filter(uc =>
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

    const GroupIcon = ({ iconName, className }) => {
        const Icon = LucideIcons[iconName] || Folder
        return <Icon className={className} />
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
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-accent"
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
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-accent",
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
                        <div className="text-center py-4 text-xs text-muted-foreground">
                            No groups or use cases found
                        </div>
                    )}

                    {/* Groups */}
                    {filteredData.groups.map((group) => {
                        const groupUseCases = getUseCasesInGroup(group.id)
                        const isExpanded = expandedGroups.has(group.id) || (searchTerm && filteredData.matchedUseCaseIds.size > 0)
                        const isSelected = selectedGroupId === group.id
                        const colorClass = categoryColors.find(c => c.name === group.color)?.class || ""
                        const isDragOver = dragOverGroupId === group.id

                        return (
                            <Collapsible
                                key={group.id}
                                open={isExpanded}
                                onOpenChange={() => toggleGroup(group.id)}
                            >
                                <div
                                    onDragOver={(e) => handleDragOver(e, group.id)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, group.id)}
                                    className={cn(
                                        "flex items-center gap-1 rounded-md transition-all duration-200 group",
                                        isSelected ? "bg-primary/10" : "hover:bg-accent",
                                        isDragOver && "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/10 scale-[1.02]"
                                    )}
                                >
                                    <CollapsibleTrigger asChild>
                                        <button className="p-1.5 hover:bg-accent/50 rounded-md">
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
                                                        iconName={isDragOver ? "FolderOpen" : (isExpanded ? "FolderOpen" : group.icon)}
                                                        className={cn(
                                                            "h-4 w-4 shrink-0 transition-transform",
                                                            isDragOver
                                                                ? "text-primary scale-110"
                                                                : colorClass ? colorClass.replace('bg-', 'text-') : "text-muted-foreground"
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

                                <CollapsibleContent>
                                    <div className="ml-6 pl-2 border-l space-y-0.5 py-1 max-w-full overflow-hidden">
                                        {groupUseCases.length === 0 ? (
                                            <p className="text-xs text-muted-foreground py-1 px-2">
                                                No use cases
                                            </p>
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
                                                                        "w-full flex items-center gap-2 px-2 py-1 text-xs rounded-md hover:bg-accent/50 cursor-pointer transition-colors min-w-0",
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
                                : "hover:bg-accent border-transparent hover:border-border"
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
                                    : "hover:bg-accent border-transparent hover:border-border",
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
                        <div className="text-center py-4 text-xs text-muted-foreground">
                            No groups or use cases found
                        </div>
                    )}

                    {/* Group cards */}
                    {filteredData.groups.map((group) => {
                        const groupUseCases = getUseCasesInGroup(group.id)
                        const colorClass = categoryColors.find(c => c.name === group.color)?.class || ""
                        const isDragOver = dragOverGroupId === group.id

                        return (
                            <div
                                key={group.id}
                                onDragOver={(e) => handleDragOver(e, group.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, group.id)}
                                className={cn(
                                    "rounded-lg transition-all duration-200",
                                    isDragOver && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]"
                                )}
                            >
                                <button
                                    onClick={() => onSelectGroup(group.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-lg border transition-all group",
                                        selectedGroupId === group.id
                                            ? "bg-primary/10 border-primary text-primary"
                                            : "hover:bg-accent border-transparent hover:border-border",
                                        isDragOver && "bg-primary/10 border-primary"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2 rounded-md",
                                        colorClass || "bg-muted"
                                    )}>
                                        <GroupIcon
                                            iconName={isDragOver ? "FolderOpen" : group.icon}
                                            className={cn(
                                                "h-5 w-5",
                                                isDragOver ? "text-primary" : colorClass ? "text-white" : "text-muted-foreground"
                                            )}
                                        />
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {isDragOver ? "Drop here" : group.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {groupUseCases.length} items
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
                                </button>
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
            )}

            {/* Create Group Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
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
                <DialogContent className="sm:max-w-[400px]">
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
                <DialogContent className="sm:max-w-[400px]">
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

