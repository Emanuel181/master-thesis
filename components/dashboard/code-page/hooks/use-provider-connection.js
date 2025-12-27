"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from "sonner";

/**
 * Custom hook for managing GitHub and GitLab provider connections
 * @param {Object} options - Hook options
 * @param {Object} options.currentRepo - Current repository info (with provider field)
 * @param {Function} options.clearProject - Function to clear the project state
 * @param {Function} options.closeAllTabs - Function to close all open tabs
 * @param {Function} options.setCode - Function to set the code state
 * @returns {Object} Provider connection state and handlers
 */
export function useProviderConnection({ currentRepo, clearProject, closeAllTabs, setCode } = {}) {
    const { data: session, status } = useSession();

    // Use refs to always have access to latest values in callbacks
    const currentRepoRef = useRef(currentRepo);
    const clearProjectRef = useRef(clearProject);
    const closeAllTabsRef = useRef(closeAllTabs);
    const setCodeRef = useRef(setCode);

    // Keep refs updated
    useEffect(() => {
        currentRepoRef.current = currentRepo;
        clearProjectRef.current = clearProject;
        closeAllTabsRef.current = closeAllTabs;
        setCodeRef.current = setCode;
    }, [currentRepo, clearProject, closeAllTabs, setCode]);

    // Provider connection state
    const [isGithubConnected, setIsGithubConnected] = useState(false);
    const [isGitlabConnected, setIsGitlabConnected] = useState(false);

    // Repository state
    const [repos, setRepos] = useState([]);
    const [gitlabRepos, setGitlabRepos] = useState([]);
    const [isLoadingRepos, setIsLoadingRepos] = useState(false);

    // Load GitHub repos
    const loadRepos = useCallback(async () => {
        setIsLoadingRepos(true);
        try {
            const response = await fetch('/api/github/repos');
            if (response.ok) setRepos(await response.json());
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingRepos(false);
        }
    }, []);

    // Load GitLab repos
    const loadGitlabRepos = useCallback(async () => {
        setIsLoadingRepos(true);
        try {
            const response = await fetch('/api/gitlab/repos');
            if (response.ok) setGitlabRepos(await response.json());
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingRepos(false);
        }
    }, []);

    // Refresh linked providers from API
    const refreshLinkedProviders = useCallback(async () => {
        if (!session) return;
        try {
            const res = await fetch('/api/providers/linked', { cache: 'no-store' });
            const data = await res.json();
            if (!res.ok) return;
            const linked = new Set(data.providers || []);
            const githubLinked = linked.has('github');
            const gitlabLinked = linked.has('gitlab');
            
            setIsGithubConnected(prev => {
                if (!prev && githubLinked) {
                    loadRepos();
                }
                return githubLinked;
            });
            
            setIsGitlabConnected(prev => {
                if (!prev && gitlabLinked) {
                    loadGitlabRepos();
                }
                return gitlabLinked;
            });

            if (!githubLinked) setRepos([]);
            if (!gitlabLinked) setGitlabRepos([]);
        } catch (err) {
            console.error('Error refreshing linked providers:', err);
        }
    }, [session, loadRepos, loadGitlabRepos]);

    // Initial load of provider status
    useEffect(() => {
        if (status !== 'authenticated') return;
        refreshLinkedProviders();
    }, [status, refreshLinkedProviders]);

    // Periodic refresh of provider status (with visibility awareness)
    useEffect(() => {
        if (status !== 'authenticated') return;

        let interval;
        const POLL_INTERVAL = 120000; // 2 minutes (reduced from 30s)

        const startPolling = () => {
            interval = setInterval(refreshLinkedProviders, POLL_INTERVAL);
        };

        const stopPolling = () => {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        };

        // Only poll when tab is visible to reduce server load
        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopPolling();
            } else {
                // Refresh immediately when user returns, then resume polling
                refreshLinkedProviders();
                startPolling();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Start initial polling if visible
        if (!document.hidden) {
            startPolling();
        }

        return () => {
            stopPolling();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [status, refreshLinkedProviders]);

    // Disconnect GitHub
    const handleDisconnectGitHub = async () => {
        // Get latest values from refs
        const repo = currentRepoRef.current;
        const clearProjectFn = clearProjectRef.current;
        const closeAllTabsFn = closeAllTabsRef.current;
        const setCodeFn = setCodeRef.current;

        // Check if current project is from GitHub and clear it
        const isCurrentProjectFromGitHub = repo && (!repo.provider || repo.provider === 'github');

        try {
            await fetch('/api/auth/disconnect?provider=github', { method: 'POST' });
        } catch (err) {
            console.error('Error disconnecting GitHub:', err);
        }
        setIsGithubConnected(false);

        // Clear project if it was from GitHub
        if (isCurrentProjectFromGitHub) {
            if (closeAllTabsFn) closeAllTabsFn();
            if (setCodeFn) setCodeFn('');
            if (clearProjectFn) clearProjectFn();
            // Clear code state from localStorage
            try {
                localStorage.removeItem('vulniq_code_state');
            } catch (err) {
                console.error('Error clearing code state from localStorage:', err);
            }
            toast.success("Disconnected from GitHub! Project unloaded.");
        } else {
            toast.success("Disconnected from GitHub!");
        }

        await refreshLinkedProviders();
    };

    // Disconnect GitLab
    const handleDisconnectGitlab = async () => {
        // Get latest values from refs
        const repo = currentRepoRef.current;
        const clearProjectFn = clearProjectRef.current;
        const closeAllTabsFn = closeAllTabsRef.current;
        const setCodeFn = setCodeRef.current;

        // Check if current project is from GitLab and clear it
        const isCurrentProjectFromGitLab = repo && repo.provider === 'gitlab';

        try {
            await fetch('/api/auth/disconnect?provider=gitlab', { method: 'POST' });
        } catch (err) {
            console.error('Error disconnecting GitLab:', err);
        }
        setIsGitlabConnected(false);

        // Clear project if it was from GitLab
        if (isCurrentProjectFromGitLab) {
            if (closeAllTabsFn) closeAllTabsFn();
            if (setCodeFn) setCodeFn('');
            if (clearProjectFn) clearProjectFn();
            // Clear code state from localStorage
            try {
                localStorage.removeItem('vulniq_code_state');
            } catch (err) {
                console.error('Error clearing code state from localStorage:', err);
            }
            toast.success("Disconnected from GitLab! Project unloaded.");
        } else {
            toast.success("Disconnected from GitLab!");
        }

        await refreshLinkedProviders();
    };

    return {
        session,
        status,
        isGithubConnected,
        isGitlabConnected,
        repos,
        gitlabRepos,
        isLoadingRepos,
        loadRepos,
        loadGitlabRepos,
        handleDisconnectGitHub,
        handleDisconnectGitlab,
        refreshLinkedProviders,
    };
}

/**
 * Custom hook for repository import functionality
 * @param {Object} options - Hook options
 * @returns {Object} Import handlers and state
 */
export function useRepoImport({ setProjectStructure, setCurrentRepo, setViewMode }) {
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Listen for open-project-switcher event (from command palette shortcut Ctrl+O)
    useEffect(() => {
        const handleOpenProjectSwitcher = () => {
            setIsImportDialogOpen(true);
        };
        window.addEventListener("open-project-switcher", handleOpenProjectSwitcher);
        return () => window.removeEventListener("open-project-switcher", handleOpenProjectSwitcher);
    }, []);

    // Import repo by search term (owner/repo format)
    const handleImport = async () => {
        if (!searchTerm.trim()) return;
        try {
            const [owner, repo] = searchTerm.split('/');
            if (!owner || !repo) throw new Error("Invalid format");
            const structure = await apiFetchRepoTree(owner, repo);
            setProjectStructure(structure);
            setCurrentRepo({ owner, repo });
            setViewMode('project');
            setIsImportDialogOpen(false);
            setSearchTerm("");
            // Clear any existing code state so the editor starts fresh
            try {
                localStorage.removeItem('vulniq_code_state');
            } catch (err) {
                console.error("Error clearing code state:", err);
            }
            toast.success("Project switched successfully!");
        } catch (error) {
            toast.error("Failed to switch project: " + error.message);
        }
    };

    // Select GitHub repo
    const handleSelectRepo = async (repo) => {
        try {
            const structure = await apiFetchRepoTree(repo.owner.login, repo.name);
            setProjectStructure(structure);
            setCurrentRepo({ owner: repo.owner.login, repo: repo.name });
            setViewMode('project');
            setIsImportDialogOpen(false);
            // Clear any existing code state so the editor starts fresh
            try {
                localStorage.removeItem('vulniq_code_state');
            } catch (err) {
                console.error("Error clearing code state:", err);
            }
            toast.success("Project switched successfully!");
        } catch (error) {
            toast.error("Failed to switch project: " + error.message);
        }
    };

    // Select GitLab repo
    const handleSelectGitlabRepo = async (repo) => {
        try {
            const structure = await apiFetchRepoTree(repo.full_name.split('/')[0], repo.name, 'gitlab');
            setProjectStructure(structure);
            setCurrentRepo({ owner: repo.full_name.split('/')[0], repo: repo.name, provider: 'gitlab' });
            setViewMode('project');
            setIsImportDialogOpen(false);
            // Clear any existing code state so the editor starts fresh
            try {
                localStorage.removeItem('vulniq_code_state');
            } catch (err) {
                console.error("Error clearing code state:", err);
            }
            toast.success("Project switched successfully!");
        } catch (error) {
            toast.error("Failed to switch project: " + error.message);
        }
    };

    return {
        isImportDialogOpen,
        setIsImportDialogOpen,
        searchTerm,
        setSearchTerm,
        handleImport,
        handleSelectRepo,
        handleSelectGitlabRepo,
    };
}

