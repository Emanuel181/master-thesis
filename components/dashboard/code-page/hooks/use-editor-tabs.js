"use client"

import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchFileContent as apiFetchFileContent } from '@/lib/github-api';
import { detectLanguageFromContent } from '../constants/language-config';
import { toast } from 'sonner';

const TABS_STORAGE_KEY = 'vulniq_editor_tabs';

// Predefined group colors
const GROUP_COLORS = [
    { name: 'blue', bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-500' },
    { name: 'green', bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-500' },
    { name: 'purple', bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-500' },
    { name: 'orange', bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-500' },
    { name: 'pink', bg: 'bg-pink-500/20', border: 'border-pink-500', text: 'text-pink-500' },
    { name: 'cyan', bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-500' },
    { name: 'yellow', bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-500' },
    { name: 'red', bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-500' },
];

/**
 * Custom hook for managing editor tabs with grouping support
 * @param {Object} options - Hook options
 * @returns {Object} Tab state and handlers
 */
export function useEditorTabs({ currentRepo, setCode, setSelectedFile, setViewMode }) {
    const [openTabs, setOpenTabs] = useState([]);
    const [activeTabId, setActiveTabId] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [loadingFilePath, setLoadingFilePath] = useState(null);
    const [isHydrated, setIsHydrated] = useState(false);

    // Tab groups: { [groupId]: { name, color, collapsed, tabIds } }
    const [tabGroups, setTabGroups] = useState({});
    const [activeGroupId, setActiveGroupId] = useState(null);

    // Use ref to prevent race conditions with concurrent file loads
    const loadingPathsRef = useRef(new Set());

    // Load tabs from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(TABS_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.openTabs && Array.isArray(parsed.openTabs)) {
                    setOpenTabs(parsed.openTabs);
                }
                if (parsed.activeTabId) {
                    setActiveTabId(parsed.activeTabId);
                }
                if (parsed.tabGroups) {
                    setTabGroups(parsed.tabGroups);
                }
                if (parsed.activeGroupId) {
                    setActiveGroupId(parsed.activeGroupId);
                }
            }
        } catch (err) {
            console.error("Error loading editor tabs from localStorage:", err);
        }
        setIsHydrated(true);
    }, []);

    // Save tabs to localStorage when they change
    useEffect(() => {
        if (!isHydrated) return;
        try {
            const state = {
                openTabs,
                activeTabId,
                tabGroups,
                activeGroupId,
            };
            localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(state));
        } catch (err) {
            console.error("Error saving editor tabs to localStorage:", err);
        }
    }, [openTabs, activeTabId, tabGroups, activeGroupId, isHydrated]);

    // Get active tab
    const activeTab = openTabs.find(t => t.id === activeTabId);

    // Get tabs organized by groups
    const getGroupedTabs = useCallback(() => {
        const grouped = {};
        const ungrouped = [];

        // Get all tab IDs that are in groups
        const groupedTabIds = new Set();
        Object.values(tabGroups).forEach(group => {
            group.tabIds.forEach(id => groupedTabIds.add(id));
        });

        // Separate grouped and ungrouped tabs
        openTabs.forEach(tab => {
            if (groupedTabIds.has(tab.id)) {
                // Find which group this tab belongs to
                for (const [groupId, group] of Object.entries(tabGroups)) {
                    if (group.tabIds.includes(tab.id)) {
                        if (!grouped[groupId]) {
                            grouped[groupId] = { ...group, tabs: [] };
                        }
                        grouped[groupId].tabs.push(tab);
                        break;
                    }
                }
            } else {
                ungrouped.push(tab);
            }
        });

        return { grouped, ungrouped };
    }, [openTabs, tabGroups]);

    // Create a new tab group
    const createGroup = useCallback((name, tabIds = []) => {
        const groupId = `group-${Date.now()}`;
        const usedColors = Object.values(tabGroups).map(g => g.color);
        const availableColor = GROUP_COLORS.find(c => !usedColors.includes(c.name)) || GROUP_COLORS[0];

        setTabGroups(prev => {
            // Create new group object with the new group first
            const newGroup = {
                name: name || `Group ${Object.keys(prev).length + 1}`,
                color: availableColor.name,
                collapsed: false,
                tabIds: tabIds,
                createdAt: Date.now(),
            };
            return {
                [groupId]: newGroup,
                ...prev,
            };
        });

        toast.success(`Created group "${name || `Group ${Object.keys(tabGroups).length + 1}`}"`);
        return groupId;
    }, [tabGroups]);

    // Add tab to group
    const addTabToGroup = useCallback((tabId, groupId) => {
        setTabGroups(prev => {
            // Remove tab from any existing group
            const updated = { ...prev };
            Object.keys(updated).forEach(gId => {
                updated[gId] = {
                    ...updated[gId],
                    tabIds: updated[gId].tabIds.filter(id => id !== tabId)
                };
            });

            // Add to new group
            if (updated[groupId]) {
                updated[groupId] = {
                    ...updated[groupId],
                    tabIds: [...updated[groupId].tabIds, tabId]
                };
            }

            return updated;
        });
    }, []);

    // Remove tab from its group
    const removeTabFromGroup = useCallback((tabId) => {
        setTabGroups(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(gId => {
                updated[gId] = {
                    ...updated[gId],
                    tabIds: updated[gId].tabIds.filter(id => id !== tabId)
                };
            });
            return updated;
        });
    }, []);

    // Delete a group (tabs remain open but ungrouped)
    const deleteGroup = useCallback((groupId) => {
        setTabGroups(prev => {
            const { [groupId]: removed, ...rest } = prev;
            return rest;
        });
        if (activeGroupId === groupId) {
            setActiveGroupId(null);
        }
        toast.success("Group deleted");
    }, [activeGroupId]);

    // Rename a group
    const renameGroup = useCallback((groupId, newName) => {
        setTabGroups(prev => ({
            ...prev,
            [groupId]: {
                ...prev[groupId],
                name: newName
            }
        }));
    }, []);

    // Change group color
    const changeGroupColor = useCallback((groupId, colorName) => {
        setTabGroups(prev => ({
            ...prev,
            [groupId]: {
                ...prev[groupId],
                color: colorName
            }
        }));
    }, []);

    // Toggle group collapsed state
    const toggleGroupCollapsed = useCallback((groupId) => {
        setTabGroups(prev => ({
            ...prev,
            [groupId]: {
                ...prev[groupId],
                collapsed: !prev[groupId].collapsed
            }
        }));
    }, []);

    // Close all tabs in a group
    const closeGroupTabs = useCallback((groupId) => {
        const group = tabGroups[groupId];
        if (!group) return;

        const tabIdsToClose = new Set(group.tabIds);
        setOpenTabs(prev => prev.filter(t => !tabIdsToClose.has(t.id)));

        // If active tab was in the group, switch to another tab
        if (tabIdsToClose.has(activeTabId)) {
            const remaining = openTabs.filter(t => !tabIdsToClose.has(t.id));
            if (remaining.length > 0) {
                setActiveTabId(remaining[remaining.length - 1].id);
            } else {
                setActiveTabId(null);
                setCode('');
                setSelectedFile(null);
            }
        }

        // Delete the group
        deleteGroup(groupId);
    }, [tabGroups, openTabs, activeTabId, setCode, setSelectedFile, deleteGroup]);

    // Get color classes for a group
    const getGroupColorClasses = useCallback((colorName) => {
        return GROUP_COLORS.find(c => c.name === colorName) || GROUP_COLORS[0];
    }, []);

    // Handle file click to open in tab
    const onFileClick = useCallback(async (node) => {
        const tabId = node.path;

        // Check if tab already exists
        const existingTab = openTabs.find(tab => tab.id === tabId);
        if (existingTab) {
            setActiveTabId(existingTab.id);
            return;
        }

        // Use ref for synchronous race condition check (more reliable than state)
        if (loadingPathsRef.current.has(node.path)) {
            return;
        }

        // Mark as loading (synchronously via ref, async via state for UI)
        loadingPathsRef.current.add(node.path);
        setLoadingFilePath(node.path);

        try {
            const fileWithContent = await apiFetchFileContent(
                currentRepo.owner,
                currentRepo.repo,
                node.path,
                currentRepo.provider
            );

            // Use node.name for detection to ensure we have the full filename with extension
            const lang = detectLanguageFromContent(node.name, fileWithContent.content) || 'javascript';

            // Double-check tab doesn't exist after async operation (handles race condition)
            setOpenTabs(prev => {
                // If tab was already added by another concurrent call, skip
                if (prev.some(t => t.id === tabId)) {
                    return prev;
                }

                const newTab = {
                    id: tabId,
                    name: node.name,
                    path: node.path,
                    content: fileWithContent.content,
                    language: lang
                };
                return [...prev, newTab];
            });

            setActiveTabId(tabId);
            setViewMode('project');
        } catch (err) {
            console.error('Failed to load file:', err);
            toast.error(`Failed to load file: ${err.message || 'Unknown error'}`);
        } finally {
            // Clean up loading state
            loadingPathsRef.current.delete(node.path);
            setLoadingFilePath(null);
        }
    }, [currentRepo, openTabs, setViewMode]);

    // Close a tab
    const closeTab = useCallback((tabId) => {
        // Remove from any group
        removeTabFromGroup(tabId);

        const remaining = openTabs.filter(t => t.id !== tabId);
        setOpenTabs(remaining);
        if (activeTabId === tabId) {
            if (remaining.length > 0) {
                setActiveTabId(remaining[remaining.length - 1].id);
            } else {
                setActiveTabId(null);
                setCode(''); // Clear the code when closing the last tab
                setSelectedFile(null); // Clear the selected file
            }
        }
    }, [openTabs, activeTabId, setCode, setSelectedFile, removeTabFromGroup]);

    // Close all tabs
    const closeAllTabs = useCallback(() => {
        setOpenTabs([]);
        setActiveTabId(null);
        setTabGroups({});
        setActiveGroupId(null);
        setCode(''); // Clear code area
        setSelectedFile(null); // Clear selected file
        // Clear tabs from localStorage
        try {
            localStorage.removeItem(TABS_STORAGE_KEY);
        } catch (err) {
            console.error("Error clearing tabs from localStorage:", err);
        }
    }, [setCode, setSelectedFile]);

    // Close all tabs except the specified one
    const closeOtherTabs = useCallback((tabId) => {
        const tabToKeep = openTabs.find(t => t.id === tabId);
        if (tabToKeep) {
            setOpenTabs([tabToKeep]);
            setActiveTabId(tabId);
            // Clear all groups since we're keeping only one tab
            setTabGroups({});
            setActiveGroupId(null);
        }
    }, [openTabs]);

    // Update tab content
    const updateTabContent = useCallback((tabId, content) => {
        setOpenTabs(prev => prev.map(t => t.id === tabId ? { ...t, content } : t));
    }, []);

    // Handle tab drag and drop reordering
    const handleTabDragStart = useCallback((e, index) => {
        e.dataTransfer.setData('text/plain', index.toString());
    }, []);

    const handleTabDragOver = useCallback((e, index) => {
        e.preventDefault();
        setDragOverIndex(index);
    }, []);

    const handleTabDragLeave = useCallback(() => {
        setDragOverIndex(null);
    }, []);

    const handleTabDrop = useCallback((e, targetIndex) => {
        e.preventDefault();
        const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
        if (draggedIndex === targetIndex) return;
        const newTabs = [...openTabs];
        const [dragged] = newTabs.splice(draggedIndex, 1);
        newTabs.splice(targetIndex, 0, dragged);
        setOpenTabs(newTabs);
        setDragOverIndex(null);
    }, [openTabs]);

    return {
        openTabs,
        setOpenTabs,
        activeTabId,
        setActiveTabId,
        activeTab,
        dragOverIndex,
        loadingFilePath,
        onFileClick,
        closeTab,
        closeAllTabs,
        closeOtherTabs,
        updateTabContent,
        handleTabDragStart,
        handleTabDragOver,
        handleTabDragLeave,
        handleTabDrop,
        // Tab group functionality
        tabGroups,
        activeGroupId,
        setActiveGroupId,
        getGroupedTabs,
        createGroup,
        addTabToGroup,
        removeTabFromGroup,
        deleteGroup,
        renameGroup,
        changeGroupColor,
        toggleGroupCollapsed,
        closeGroupTabs,
        getGroupColorClasses,
        GROUP_COLORS,
    };
}

