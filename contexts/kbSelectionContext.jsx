"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const KbSelectionContext = createContext();

/**
 * Provider for shared Knowledge Base selection state.
 * Single source of truth for both Workflow tab and Knowledge tab.
 */
export function KbSelectionProvider({ children }) {
    const [selectedFiles, setSelectedFiles] = useState(() => {
        if (typeof window === 'undefined') return new Set();
        try {
            const saved = localStorage.getItem('vulniq_selected_documents');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch { return new Set(); }
    });

    const [selectedGroups, setSelectedGroups] = useState(() => {
        if (typeof window === 'undefined') return new Set();
        try {
            const saved = localStorage.getItem('vulniq_selected_groups');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch { return new Set(); }
    });

    // Persist to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('vulniq_selected_documents', JSON.stringify(Array.from(selectedFiles)));
            localStorage.setItem('vulniq_selected_groups', JSON.stringify(Array.from(selectedGroups)));
        } catch {}
    }, [selectedFiles, selectedGroups]);

    const clearAll = useCallback(() => {
        setSelectedFiles(new Set());
        setSelectedGroups(new Set());
    }, []);

    const value = React.useMemo(() => ({
        selectedFiles,
        selectedGroups,
        setSelectedFiles,
        setSelectedGroups,
        clearAll,
    }), [selectedFiles, selectedGroups, clearAll]);

    return (
        <KbSelectionContext.Provider value={value}>
            {children}
        </KbSelectionContext.Provider>
    );
}

export function useKbSelection() {
    const context = useContext(KbSelectionContext);
    if (!context) {
        throw new Error('useKbSelection must be used within a KbSelectionProvider');
    }
    return context;
}

