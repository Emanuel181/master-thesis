"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const PromptsContext = createContext();

export function PromptsProvider({ children }) {
    const [prompts, setPrompts] = useState({});
    const [selectedPrompts, setSelectedPrompts] = useState({
        reviewer: [],
        implementation: [],
        tester: [],
        report: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch prompts on mount
    useEffect(() => {
        const fetchPrompts = async () => {
            try {
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
            }
        };

        fetchPrompts();
    }, []);

    const handlePromptChange = (agent, promptId) => {
        setSelectedPrompts(prev => {
            const current = prev[agent] || [];
            if (current.includes(promptId)) {
                return {
                    ...prev,
                    [agent]: current.filter(id => id !== promptId)
                };
            } else {
                return {
                    ...prev,
                    [agent]: [...current, promptId]
                };
            }
        });
    };

    const handlePromptTextChange = (agent, promptId, newText) => {
        setPrompts(prev => ({
            ...prev,
            [agent]: (prev[agent] || []).map(p => p.id === promptId ? { ...p, text: newText } : p)
        }));
    };

    const addPrompt = async (agent, text) => {
        try {
            const response = await fetch('/api/prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agent, text })
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
    };

    const savePrompts = async () => {
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
    };

    const deletePrompt = async (agent, promptId) => {
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
    };

    const editPrompt = async (agent, promptId, newText) => {
        try {
            const response = await fetch(`/api/prompts/${promptId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newText })
            });
            if (response.ok) {
                setPrompts(prev => ({
                    ...prev,
                    [agent]: (prev[agent] || []).map(p => p.id === promptId ? { ...p, text: newText } : p)
                }));
                return { success: true };
            } else {
                return { success: false, error: 'Failed to edit prompt' };
            }
        } catch (err) {
            console.error('Error editing prompt:', err);
            return { success: false, error: 'Error editing prompt' };
        }
    };

    const value = {
        prompts,
        selectedPrompts,
        loading,
        error,
        handlePromptChange,
        handlePromptTextChange,
        addPrompt,
        savePrompts,
        deletePrompt,
        editPrompt,
        setSelectedPrompts,
    };

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
