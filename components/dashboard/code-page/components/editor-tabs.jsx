"use client"

import React, { useState } from 'react';
import { X, Copy, XCircle, FolderPlus, FolderMinus, ChevronDown, ChevronRight, Palette, Pencil, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { ContextMenuTrigger } from "@radix-ui/react-context-menu";
import { getFileIconUrl } from '../constants/icon-config';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Editor Tabs component for managing open files with grouping support
 */
export function EditorTabs({
    openTabs,
    activeTabId,
    setActiveTabId,
    closeTab,
    closeAllTabs,
    closeOtherTabs,
    dragOverIndex,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    // Tab group props
    tabGroups = {},
    createGroup,
    addTabToGroup,
    removeTabFromGroup,
    deleteGroup,
    renameGroup,
    changeGroupColor,
    toggleGroupCollapsed,
    closeGroupTabs,
    getGroupColorClasses,
    GROUP_COLORS = [],
    // External trigger for new group dialog
    newGroupDialogOpen: externalNewGroupDialogOpen,
    setNewGroupDialogOpen: externalSetNewGroupDialogOpen,
}) {
    const [internalNewGroupDialogOpen, setInternalNewGroupDialogOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [selectedTabForGroup, setSelectedTabForGroup] = useState(null);
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [editingGroupName, setEditingGroupName] = useState("");
    const [dragOverGroupId, setDragOverGroupId] = useState(null);
    const [dragOverUngroupedArea, setDragOverUngroupedArea] = useState(false);

    // Use external state if provided, otherwise use internal
    const newGroupDialogOpen = externalNewGroupDialogOpen ?? internalNewGroupDialogOpen;
    const setNewGroupDialogOpen = externalSetNewGroupDialogOpen ?? setInternalNewGroupDialogOpen;

    if (openTabs.length === 0) return null;

    const handleCopyPath = (tab) => {
        navigator.clipboard.writeText(tab.path || tab.name);
        toast.success("Path copied to clipboard");
    };

    const handleCreateNewGroup = () => {
        if (newGroupName.trim()) {
            const groupId = createGroup(newGroupName.trim(), selectedTabForGroup ? [selectedTabForGroup] : []);
            if (selectedTabForGroup) {
                addTabToGroup(selectedTabForGroup, groupId);
            }
        }
        setNewGroupDialogOpen(false);
        setNewGroupName("");
        setSelectedTabForGroup(null);
    };

    const openNewGroupDialog = (tabId = null) => {
        setSelectedTabForGroup(tabId);
        setNewGroupName("");
        setNewGroupDialogOpen(true);
    };

    const handleRenameGroup = (groupId) => {
        if (editingGroupName.trim()) {
            renameGroup(groupId, editingGroupName.trim());
        }
        setEditingGroupId(null);
        setEditingGroupName("");
    };

    // Find which group a tab belongs to
    const getTabGroup = (tabId) => {
        for (const [groupId, group] of Object.entries(tabGroups)) {
            if (group.tabIds.includes(tabId)) {
                return { groupId, group };
            }
        }
        return null;
    };

    // Organize tabs by groups - groups appear first (newest first), then ungrouped tabs
    const organizeTabsWithGroups = () => {
        const result = [];
        const processedTabIds = new Set();

        // Sort groups by createdAt (newest first), then add grouped tabs
        const sortedGroups = Object.entries(tabGroups)
            .sort(([, a], [, b]) => (b.createdAt || 0) - (a.createdAt || 0));

        sortedGroups.forEach(([groupId, group]) => {
            const groupTabs = openTabs.filter(tab => group.tabIds.includes(tab.id));
            if (groupTabs.length > 0) {
                result.push({ type: 'group', groupId, group, tabs: groupTabs });
                groupTabs.forEach(tab => processedTabIds.add(tab.id));
            }
        });

        // Then add ungrouped tabs
        openTabs.forEach(tab => {
            if (!processedTabIds.has(tab.id)) {
                result.push({ type: 'tab', tab });
            }
        });

        return result;
    };

    const organizedItems = organizeTabsWithGroups();

    const renderTab = (tab, index) => {
        const isActive = tab.id === activeTabId;
        const tabGroup = getTabGroup(tab.id);
        const colorClasses = tabGroup ? getGroupColorClasses(tabGroup.group.color) : null;

        const handleDragStart = (e) => {
            e.dataTransfer.setData('text/plain', index.toString());
            e.dataTransfer.setData('application/tab-id', tab.id);
            onDragStart(e, index);
        };

        return (
            <ContextMenu key={`tab-${tab.id}-${index}`}>
                <ContextMenuTrigger asChild>
                    <TabsTrigger
                        value={tab.id}
                        className={cn(
                            "group relative h-9 px-3 rounded-none",
                            "text-sm flex items-center gap-2",
                            "transition-all data-[state=active]:bg-transparent",
                            "border-r border-border/30",
                            dragOverIndex === index && "bg-accent",
                            isActive
                                ? "text-primary font-medium border-t-2 border-t-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border-t-2 border-t-transparent",
                            colorClasses && `${colorClasses.bg} border-b-2 ${colorClasses.border}`
                        )}
                        draggable="true"
                        onDragStart={handleDragStart}
                        onDragOver={(e) => onDragOver(e, index)}
                        onDragLeave={onDragLeave}
                        onDrop={(e) => onDrop(e, index)}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic icon URL from API */}
                        <img src={getFileIconUrl(tab.name)} alt="" className="w-4 h-4 flex-shrink-0" />
                        <span className={cn(
                            "truncate max-w-[120px]",
                            isActive && "text-foreground"
                        )}>{tab.name}</span>
                        <span
                            onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                            className={cn(
                                "hover:bg-muted rounded p-0.5 -mr-1 transition-opacity",
                                isActive ? "opacity-70 hover:opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}
                        >
                            <X className="h-3 w-3" />
                        </span>
                    </TabsTrigger>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-56">
                    <ContextMenuItem onClick={() => handleCopyPath(tab)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Path
                    </ContextMenuItem>
                    <ContextMenuSeparator />

                    {/* Group options */}
                    {Object.keys(tabGroups).length > 0 && (
                        <ContextMenuSub>
                            <ContextMenuSubTrigger>
                                <FolderPlus className="mr-2 h-4 w-4" />
                                Add to Group
                            </ContextMenuSubTrigger>
                            <ContextMenuSubContent className="w-48">
                                {Object.entries(tabGroups).map(([gId, g]) => {
                                    const colors = getGroupColorClasses(g.color);
                                    return (
                                        <ContextMenuItem
                                            key={gId}
                                            onClick={() => addTabToGroup(tab.id, gId)}
                                            disabled={g.tabIds.includes(tab.id)}
                                        >
                                            <div className={cn("w-3 h-3 rounded-full mr-2", colors.bg, "border", colors.border)} />
                                            {g.name}
                                        </ContextMenuItem>
                                    );
                                })}
                            </ContextMenuSubContent>
                        </ContextMenuSub>
                    )}

                    <ContextMenuItem onClick={() => openNewGroupDialog(tab.id)}>
                        <FolderPlus className="mr-2 h-4 w-4" />
                        New Group from Tab
                    </ContextMenuItem>

                    {tabGroup && (
                        <ContextMenuItem onClick={() => removeTabFromGroup(tab.id)}>
                            <FolderMinus className="mr-2 h-4 w-4" />
                            Remove from Group
                        </ContextMenuItem>
                    )}

                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => closeTab(tab.id)}>
                        <X className="mr-2 h-4 w-4" />
                        Close
                        <ContextMenuShortcut>⌘W</ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuItem
                        onClick={() => closeOtherTabs(tab.id)}
                        disabled={openTabs.length <= 1}
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Close Others
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => closeAllTabs()}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Close All
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        );
    };

    const renderGroupHeader = (groupId, group) => {
        const colorClasses = getGroupColorClasses(group.color);
        const isEditing = editingGroupId === groupId;
        const isDragOver = dragOverGroupId === groupId;

        const handleGroupDragOver = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverGroupId(groupId);
        };

        const handleGroupDragLeave = (e) => {
            e.preventDefault();
            setDragOverGroupId(null);
        };

        const handleGroupDrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const tabId = e.dataTransfer.getData('application/tab-id');
            if (tabId && addTabToGroup) {
                addTabToGroup(tabId, groupId);
                toast.success(`Tab added to ${group.name}`);
            }
            setDragOverGroupId(null);
        };

        return (
            <ContextMenu key={`group-header-${groupId}`}>
                <ContextMenuTrigger asChild>
                    <div
                        className={cn(
                            "flex items-center gap-1 h-9 px-2 cursor-pointer select-none",
                            "border-r border-border/30",
                            colorClasses.bg,
                            "border-b-2",
                            colorClasses.border,
                            "hover:brightness-95 transition-all",
                            isDragOver && "ring-2 ring-inset ring-primary brightness-110"
                        )}
                        onClick={() => toggleGroupCollapsed(groupId)}
                        onDragOver={handleGroupDragOver}
                        onDragLeave={handleGroupDragLeave}
                        onDrop={handleGroupDrop}
                    >
                        {group.collapsed ? (
                            <ChevronRight className={cn("h-3 w-3", colorClasses.text)} />
                        ) : (
                            <ChevronDown className={cn("h-3 w-3", colorClasses.text)} />
                        )}
                        {isEditing ? (
                            <Input
                                value={editingGroupName}
                                onChange={(e) => setEditingGroupName(e.target.value)}
                                onBlur={() => handleRenameGroup(groupId)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameGroup(groupId);
                                    if (e.key === 'Escape') {
                                        setEditingGroupId(null);
                                        setEditingGroupName("");
                                    }
                                }}
                                className="h-5 w-20 text-xs px-1"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className={cn("text-xs font-medium", colorClasses.text)}>
                                {group.name} ({group.tabIds.length})
                            </span>
                        )}
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                    <ContextMenuItem onClick={() => {
                        setEditingGroupId(groupId);
                        setEditingGroupName(group.name);
                    }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename Group
                    </ContextMenuItem>
                    <ContextMenuSub>
                        <ContextMenuSubTrigger>
                            <Palette className="mr-2 h-4 w-4" />
                            Change Color
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-32">
                            {GROUP_COLORS.map((color) => (
                                <ContextMenuItem
                                    key={color.name}
                                    onClick={() => changeGroupColor(groupId, color.name)}
                                >
                                    <div className={cn("w-4 h-4 rounded-full mr-2", color.bg, "border", color.border)} />
                                    {color.name.charAt(0).toUpperCase() + color.name.slice(1)}
                                </ContextMenuItem>
                            ))}
                        </ContextMenuSubContent>
                    </ContextMenuSub>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => closeGroupTabs(groupId)}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Close Group Tabs
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => deleteGroup(groupId)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Group
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        );
    };

    let flatIndex = 0;

    // Check if there are any groups
    const hasGroups = Object.keys(tabGroups).length > 0;

    // Handle drop on ungrouped area to remove tab from group
    const handleUngroupedDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverUngroupedArea(true);
    };

    const handleUngroupedDragLeave = (e) => {
        e.preventDefault();
        setDragOverUngroupedArea(false);
    };

    const handleUngroupedDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const tabId = e.dataTransfer.getData('application/tab-id');
        if (tabId && removeTabFromGroup) {
            const tabGroup = getTabGroup(tabId);
            if (tabGroup) {
                removeTabFromGroup(tabId);
                toast.success("Tab removed from group");
            }
        }
        setDragOverUngroupedArea(false);
    };

    return (
        <>
            <ScrollArea orientation="horizontal" className="w-full border-b">
                <div className="w-max flex items-center">
                    <Tabs value={activeTabId} onValueChange={setActiveTabId}>
                        <TabsList className="h-9 p-0 bg-transparent rounded-none gap-0">
                            {organizedItems.map((item) => {
                                if (item.type === 'group') {
                                    const { groupId, group, tabs } = item;
                                    return (
                                        <React.Fragment key={`group-${groupId}`}>
                                            {renderGroupHeader(groupId, group)}
                                            {!group.collapsed && tabs.map((tab) => {
                                                const currentIndex = flatIndex++;
                                                return renderTab(tab, currentIndex);
                                            })}
                                        </React.Fragment>
                                    );
                                } else {
                                    const currentIndex = flatIndex++;
                                    return renderTab(item.tab, currentIndex);
                                }
                            })}
                        </TabsList>
                    </Tabs>

                    {/* Ungrouped drop zone - shows when there are groups */}
                    {hasGroups && (
                        <div
                            className={cn(
                                "h-9 w-9 flex items-center justify-center border-l border-dashed border-border/50 cursor-default transition-all",
                                dragOverUngroupedArea && "bg-accent ring-2 ring-inset ring-primary"
                            )}
                            onDragOver={handleUngroupedDragOver}
                            onDragLeave={handleUngroupedDragLeave}
                            onDrop={handleUngroupedDrop}
                            title="Drop here to remove from group"
                        >
                            <FolderMinus className={cn("h-3.5 w-3.5", dragOverUngroupedArea ? "opacity-100" : "opacity-40")} />
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* New Group Dialog */}
            <Dialog open={newGroupDialogOpen} onOpenChange={setNewGroupDialogOpen}>
                <DialogContent className="sm:max-w-[300px]">
                    <DialogHeader>
                        <DialogTitle>Create Tab Group</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="Group name"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateNewGroup();
                            }}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNewGroupDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateNewGroup} disabled={!newGroupName.trim()}>
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

