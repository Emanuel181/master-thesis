"use client"

import { useState, useCallback } from 'react';
import { fetchFileContent as apiFetchFileContent } from '@/lib/github-api';
import { detectLanguageFromContent } from '../constants/language-config';

/**
 * Custom hook for managing editor tabs
 * @param {Object} options - Hook options
 * @returns {Object} Tab state and handlers
 */
export function useEditorTabs({ currentRepo, setCode, setSelectedFile, setViewMode }) {
    const [openTabs, setOpenTabs] = useState([]);
    const [activeTabId, setActiveTabId] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [loadingFilePath, setLoadingFilePath] = useState(null);

    // Get active tab
    const activeTab = openTabs.find(t => t.id === activeTabId);

    // Handle file click to open in tab
    const onFileClick = async (node) => {
        const tabId = node.path;
        const existingTab = openTabs.find(tab => tab.id === tabId);
        if (existingTab) {
            setActiveTabId(existingTab.id);
            return;
        }
        if (loadingFilePath === node.path) return;
        setLoadingFilePath(node.path);
        try {
            const fileWithContent = await apiFetchFileContent(currentRepo.owner, currentRepo.repo, node.path, currentRepo.provider);
            // Use node.name for detection to ensure we have the full filename with extension
            const lang = detectLanguageFromContent(node.name, fileWithContent.content) || 'javascript';
            const newTab = {
                id: tabId,
                name: node.name,
                path: node.path,
                content: fileWithContent.content,
                language: lang
            };
            setOpenTabs(prev => {
                const newTabs = [...prev, newTab];
                return newTabs.filter((tab, index, self) => self.findIndex(t => t.id === tab.id) === index);
            });
            setActiveTabId(newTab.id);
            setViewMode('project');
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingFilePath(null);
        }
    };

    // Close a tab
    const closeTab = useCallback((tabId) => {
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
    }, [openTabs, activeTabId, setCode, setSelectedFile]);

    // Close all tabs
    const closeAllTabs = useCallback(() => {
        setOpenTabs([]);
        setActiveTabId(null);
        setCode(''); // Clear code area
        setSelectedFile(null); // Clear selected file
    }, [setCode, setSelectedFile]);

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
        updateTabContent,
        handleTabDragStart,
        handleTabDragOver,
        handleTabDragLeave,
        handleTabDrop,
    };
}

