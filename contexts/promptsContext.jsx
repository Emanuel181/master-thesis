"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { DEMO_PROMPTS } from './demoContext';

const PromptsContext = createContext();

// Public routes that don't need prompts data
const PUBLIC_ROUTES = ['/', '/login', '/about', '/privacy', '/terms', '/changelog'];

export function PromptsProvider({ children }) {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [prompts, setPrompts] = useState({});
    const [selectedPrompts, setSelectedPrompts] = useState({
        reviewer: [],
        implementation: [],
        tester: [],
        report: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchInProgress = useRef(false);
    const isDemoMode = pathname?.startsWith('/demo');

    const fetchPrompts = useCallback(async () => {
        // In demo mode, use demo data instead of fetching
        if (isDemoMode) {
            setPrompts(DEMO_PROMPTS);
            // Pre-select first prompt in each category (single select)
            setSelectedPrompts({
                reviewer: DEMO_PROMPTS.reviewer?.[0]?.id ? [DEMO_PROMPTS.reviewer[0].id] : [],
                implementation: DEMO_PROMPTS.implementation?.[0]?.id ? [DEMO_PROMPTS.implementation[0].id] : [],
                tester: DEMO_PROMPTS.tester?.[0]?.id ? [DEMO_PROMPTS.tester[0].id] : [],
                report: DEMO_PROMPTS.report?.[0]?.id ? [DEMO_PROMPTS.report[0].id] : [],
            });
            setLoading(false);
            return;
        }

        // Don't fetch if already in progress (deduplication)
        if (fetchInProgress.current) return;
        
        // Don't fetch if session is still loading
        if (status === 'loading') return;
        
        // Don't fetch on public routes
        const isPublicRoute = PUBLIC_ROUTES.some(route => 
            pathname === route || pathname?.startsWith('/login')
        );
        if (isPublicRoute) {
            setLoading(false);
            return;
        }
        
        // Don't fetch if not authenticated
        if (!session?.user) {
            setLoading(false);
            return;
        }

        try {
            fetchInProgress.current = true;
            setLoading(true);
            const response = await fetch("/api/prompts");
            if (response.ok) {
                const data = await response.json();
                setPrompts(data);
            } else {
                setError('Failed to load prompts');
            }
        } catch (err) {
            console.error("Error loading prompts:", err);
            setError('Error loading prompts');
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
        }
    }, [isDemoMode, status, pathname, session?.user]);

    // Fetch prompts on mount - debounced with idle callback for better performance
    useEffect(() => {
        // Use requestIdleCallback for non-critical initial fetch
        const scheduleId = typeof requestIdleCallback !== 'undefined'
            ? requestIdleCallback(() => fetchPrompts(), { timeout: 2000 })
            : setTimeout(() => fetchPrompts(), 100);
        
        return () => {
            if (typeof cancelIdleCallback !== 'undefined') {
                cancelIdleCallback(scheduleId);
            } else {
                clearTimeout(scheduleId);
            }
        };
    }, [session, pathname, status]);

    const handlePromptChange = useCallback((agent, promptId) => {
        setSelectedPrompts(prev => {
            const current = prev[agent] || [];
            if (current.includes(promptId)) {
                // Deselect - clear the selection for this agent
                return {
                    ...prev,
                    [agent]: []
                };
            } else {
                // Single select - replace with only this prompt
                return {
                    ...prev,
                    [agent]: [promptId]
                };
            }
        });
    }, []);

    const handlePromptTextChange = useCallback((agent, promptId, newText) => {
        setPrompts(prev => ({
            ...prev,
            [agent]: (prev[agent] || []).map(p => p.id === promptId ? { ...p, text: newText } : p)
        }));
    }, []);

    const addPrompt = useCallback(async (agent, promptData) => {
        // In demo mode, add locally with generated ID
        if (isDemoMode) {
            const newPrompt = {
                id: `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: promptData.title,
                text: promptData.text,
                order: (prompts[agent] || []).length
            };
            setPrompts(prev => ({
                ...prev,
                [agent]: [...(prev[agent] || []), newPrompt]
            }));
            return { success: true };
        }

        try {
            const response = await fetch('/api/prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agent, title: promptData.title, text: promptData.text })
            });
            if (response.ok) {
                const newPrompt = await response.json();
                setPrompts(prev => ({
                    ...prev,
                    [agent]: [...(prev[agent] || []), newPrompt]
                }));
                return { success: true };
            } else {
                return { success: false, error: 'Failed to add prompt' };
            }
        } catch (err) {
            console.error('Error adding prompt:', err);
            return { success: false, error: 'Error adding prompt' };
        }
    }, [isDemoMode, prompts]);

    const savePrompts = useCallback(async () => {
        try {
            const response = await fetch('/api/prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prompts)
            });
            if (response.ok) {
                // Optionally refetch to get updated data
                const data = await response.json();
                setPrompts(data);
                return { success: true };
            } else {
                return { success: false, error: 'Failed to save prompts' };
            }
        } catch (err) {
            console.error('Error saving prompts:', err);
            return { success: false, error: 'Error saving prompts' };
        }
    }, [prompts]);

    const deletePrompt = useCallback(async (agent, promptId) => {
        // In demo mode, just remove from local state
        if (isDemoMode) {
            setPrompts(prev => ({
                ...prev,
                [agent]: (prev[agent] || []).filter(p => p.id !== promptId)
            }));
            setSelectedPrompts(prev => ({
                ...prev,
                [agent]: (prev[agent] || []).filter(id => id !== promptId)
            }));
            return { success: true };
        }

        try {
            const response = await fetch(`/api/prompts/${promptId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setPrompts(prev => ({
                    ...prev,
                    [agent]: (prev[agent] || []).filter(p => p.id !== promptId)
                }));
                setSelectedPrompts(prev => ({
                    ...prev,
                    [agent]: (prev[agent] || []).filter(id => id !== promptId)
                }));
                return { success: true };
            } else {
                return { success: false, error: 'Failed to delete prompt' };
            }
        } catch (err) {
            console.error('Error deleting prompt:', err);
            return { success: false, error: 'Error deleting prompt' };
        }
    }, [isDemoMode]);

    const bulkDeletePrompts = useCallback(async (promptIds) => {
        const ids = Array.from(new Set((promptIds || []).filter(Boolean)));
        if (ids.length === 0) return { success: true, deletedIds: [], missingIds: [], s3Failed: [] };

        // In demo mode, just remove from local state
        if (isDemoMode) {
            const deletedSet = new Set(ids);
            setPrompts(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(agent => {
                    next[agent] = (next[agent] || []).filter(p => !deletedSet.has(p.id));
                });
                return next;
            });
            setSelectedPrompts(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(agent => {
                    next[agent] = (next[agent] || []).filter(id => !deletedSet.has(id));
                });
                return next;
            });
            return { success: true, deletedIds: ids, missingIds: [], s3Failed: [] };
        }

        try {
            const response = await fetch('/api/prompts/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            });

            const data = await response.json().catch(() => null);
            if (!response.ok || !data) {
                return { success: false, error: data?.error || 'Failed to delete prompts' };
            }

            const deleted = new Set(data.deletedIds || []);
            setPrompts(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(agent => {
                    next[agent] = (next[agent] || []).filter(p => !deleted.has(p.id));
                });
                return next;
            });
            setSelectedPrompts(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(agent => {
                    next[agent] = (next[agent] || []).filter(id => !deleted.has(id));
                });
                return next;
            });

            return data;
        } catch (err) {
            console.error('Error bulk deleting prompts:', err);
            return { success: false, error: 'Error bulk deleting prompts' };
        }
    }, [isDemoMode]);

    const editPrompt = useCallback(async (agent, promptId, promptData) => {
        // In demo mode, just update local state
        if (isDemoMode) {
            setPrompts(prev => ({
                ...prev,
                [agent]: (prev[agent] || []).map(p => p.id === promptId ? { ...p, title: promptData.title, text: promptData.text } : p)
            }));
            return { success: true };
        }

        try {
            const response = await fetch(`/api/prompts/${promptId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: promptData.title, text: promptData.text })
            });
            if (response.ok) {
                setPrompts(prev => ({
                    ...prev,
                    [agent]: (prev[agent] || []).map(p => p.id === promptId ? { ...p, title: promptData.title, text: promptData.text } : p)
                }));
                return { success: true };
            } else {
                return { success: false, error: 'Failed to edit prompt' };
            }
        } catch (err) {
            console.error('Error editing prompt:', err);
            return { success: false, error: 'Error editing prompt' };
        }
    }, [isDemoMode]);

    const reorderPrompts = useCallback(async (agent, orderedIds) => {
        // Get current prompts for rollback
        let previousPrompts;
        setPrompts(prev => {
            previousPrompts = prev[agent] || [];
            const reorderedPrompts = orderedIds
                .map(id => previousPrompts.find(p => p.id === id))
                .filter(Boolean)
                .map((p, index) => ({ ...p, order: index }));
            return {
                ...prev,
                [agent]: reorderedPrompts
            };
        });

        // In demo mode, just return success (local state already updated)
        if (isDemoMode) {
            return { success: true };
        }

        try {
            const response = await fetch('/api/prompts/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agent, orderedIds })
            });

            if (!response.ok) {
                // Revert on failure
                setPrompts(prev => ({
                    ...prev,
                    [agent]: previousPrompts
                }));
                return { success: false, error: 'Failed to reorder prompts' };
            }

            return { success: true };
        } catch (err) {
            console.error('Error reordering prompts:', err);
            // Revert on failure
            setPrompts(prev => ({
                ...prev,
                [agent]: previousPrompts
            }));
            return { success: false, error: 'Error reordering prompts' };
        }
    }, [isDemoMode]);

    // Memoize context value to prevent unnecessary re-renders
    const value = React.useMemo(() => ({
        prompts,
        selectedPrompts,
        loading,
        error,
        handlePromptChange,
        handlePromptTextChange,
        addPrompt,
        savePrompts,
        deletePrompt,
        bulkDeletePrompts,
        editPrompt,
        reorderPrompts,
        setSelectedPrompts,
        refresh: fetchPrompts,
    }), [
        prompts,
        selectedPrompts,
        loading,
        error,
        handlePromptChange,
        handlePromptTextChange,
        addPrompt,
        savePrompts,
        deletePrompt,
        bulkDeletePrompts,
        editPrompt,
        reorderPrompts,
        fetchPrompts,
    ]);

    return (
        <PromptsContext.Provider value={value}>
            {children}
        </PromptsContext.Provider>
    );
}

export function usePrompts() {
    const context = useContext(PromptsContext);
    if (!context) {
        throw new Error('usePrompts must be used within a PromptsProvider');
    }
    return context;
}
