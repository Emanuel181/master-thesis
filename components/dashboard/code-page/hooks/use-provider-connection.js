"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { toast } from "sonner";
import { DEMO_GITHUB_REPOS, DEMO_GITLAB_REPOS } from '@/contexts/demoContext';
import { fetchRepoTree as apiFetchRepoTree } from '@/lib/github-api';

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
    const pathname = usePathname();
    const isDemoMode = pathname?.startsWith('/demo');

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

    // Demo mode connected state - persisted in localStorage
    const DEMO_GITHUB_KEY = 'vulniq_demo_github_connected';
    const DEMO_GITLAB_KEY = 'vulniq_demo_gitlab_connected';

    const getInitialDemoState = (key) => {
        if (typeof window === 'undefined') return false;
        try {
            return localStorage.getItem(key) === 'true';
        } catch {
            return false;
        }
    };

    // Provider connection state
    const [isGithubConnected, setIsGithubConnected] = useState(() => 
        isDemoMode ? getInitialDemoState(DEMO_GITHUB_KEY) : false
    );
    const [isGitlabConnected, setIsGitlabConnected] = useState(() => 
        isDemoMode ? getInitialDemoState(DEMO_GITLAB_KEY) : false
    );

    // Persist demo connection state
    useEffect(() => {
        if (!isDemoMode) return;
        try {
            localStorage.setItem(DEMO_GITHUB_KEY, String(isGithubConnected));
        } catch {}
    }, [isDemoMode, isGithubConnected]);

    useEffect(() => {
        if (!isDemoMode) return;
        try {
            localStorage.setItem(DEMO_GITLAB_KEY, String(isGitlabConnected));
        } catch {}
    }, [isDemoMode, isGitlabConnected]);

    // Repository state - use demo data when in demo mode and connected
    const [repos, setRepos] = useState(() => 
        isDemoMode && getInitialDemoState(DEMO_GITHUB_KEY) ? DEMO_GITHUB_REPOS : []
    );
    const [gitlabRepos, setGitlabRepos] = useState(() => 
        isDemoMode && getInitialDemoState(DEMO_GITLAB_KEY) ? DEMO_GITLAB_REPOS : []
    );
    const [isLoadingRepos, setIsLoadingRepos] = useState(false);

    // Load GitHub repos
    const loadRepos = useCallback(async () => {
        if (isDemoMode) {
            // Simulate loading delay for demo
            setIsLoadingRepos(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            setRepos(DEMO_GITHUB_REPOS);
            setIsLoadingRepos(false);
            return;
        }
        console.log('[GitHub] Loading repositories...');
        setIsLoadingRepos(true);
        try {
            const response = await fetch('/api/github/repos');
            console.log('[GitHub] API response status:', response.status);
            if (response.ok) {
                const jsonResponse = await response.json();
                console.log('[GitHub] Raw response:', jsonResponse);
                
                // Handle wrapped response from createApiHandler
                const reposData = jsonResponse.data || jsonResponse;
                console.log('[GitHub] Extracted repos data:', reposData);
                
                if (!Array.isArray(reposData)) {
                    console.error('[GitHub] Repos data is not an array:', reposData);
                    toast.error('Invalid response format from GitHub API');
                    return;
                }
                
                console.log('[GitHub] Loaded', reposData.length, 'repositories');
                setRepos(reposData);
                toast.success(`Loaded ${reposData.length} repositories`);
            } else {
                const error = await response.json().catch(() => ({ error: 'Failed to load repositories' }));
                console.error('[GitHub] Failed to load repos:', error);
                toast.error(error.error || 'Failed to load GitHub repositories');
            }
        } catch (error) {
            console.error('[GitHub] Error loading repos:', error);
            toast.error('Failed to connect to GitHub API');
        } finally {
            setIsLoadingRepos(false);
        }
    }, [isDemoMode]);

    // Load GitLab repos
    const loadGitlabRepos = useCallback(async () => {
        if (isDemoMode) {
            // Simulate loading delay for demo
            setIsLoadingRepos(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            setGitlabRepos(DEMO_GITLAB_REPOS);
            setIsLoadingRepos(false);
            return;
        }
        setIsLoadingRepos(true);
        try {
            const response = await fetch('/api/gitlab/repos');
            if (response.ok) {
                const jsonResponse = await response.json();
                
                // Handle wrapped response from createApiHandler
                const reposData = jsonResponse.data || jsonResponse;
                
                if (!Array.isArray(reposData)) {
                    console.error('[GitLab] Repos data is not an array:', reposData);
                    toast.error('Invalid response format from GitLab API');
                    return;
                }
                
                setGitlabRepos(reposData);
            } else {
                const error = await response.json().catch(() => ({ error: 'Failed to load repositories' }));
                console.error('Failed to load GitLab repos:', error);
                toast.error(error.error || 'Failed to load GitLab repositories');
            }
        } catch (error) {
            console.error('Error loading GitLab repos:', error);
            toast.error('Failed to connect to GitLab API');
        } finally {
            setIsLoadingRepos(false);
        }
    }, [isDemoMode]);

    // Refresh linked providers from API (skip in demo mode)
    const refreshLinkedProviders = useCallback(async () => {
        if (isDemoMode) return; // Demo mode manages its own state
        if (!session) return;
        console.log('[Providers] Refreshing linked providers...');
        try {
            const res = await fetch('/api/providers/linked', { 
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!res.ok) {
                console.log('[Providers] Response not OK');
                return;
            }
            
            const response = await res.json();
            console.log('[Providers] Full response object:', JSON.stringify(response, null, 2));
            
            // Handle wrapped response from createApiHandler
            // The response could be: { success: true, data: { providers: [...] } }
            // Or just: { providers: [...] }
            let providers = []
            
            if (response.success && response.data && Array.isArray(response.data.providers)) {
                providers = response.data.providers
                console.log('[Providers] Extracted providers from response.data.providers:', providers)
            } else if (Array.isArray(response.providers)) {
                providers = response.providers
                console.log('[Providers] Extracted providers from response.providers:', providers)
            } else if (response.data && Array.isArray(response.data)) {
                providers = response.data
                console.log('[Providers] Extracted providers from response.data (array):', providers)
            } else {
                console.error('[Providers] Could not find providers array in response:', response)
            }
            
            const linked = new Set(providers);
            const githubLinked = linked.has('github');
            const gitlabLinked = linked.has('gitlab');
            
            console.log('[Providers] GitHub linked:', githubLinked, 'GitLab linked:', gitlabLinked);
            
            // Update GitHub connection state and load repos if newly connected
            setIsGithubConnected(prev => {
                if (!prev && githubLinked) {
                    console.log('[Providers] GitHub newly connected, loading repos...');
                    // Use setTimeout to ensure state is updated before loading
                    setTimeout(() => loadRepos(), 0);
                }
                return githubLinked;
            });
            
            // Update GitLab connection state and load repos if newly connected
            setIsGitlabConnected(prev => {
                if (!prev && gitlabLinked) {
                    console.log('[Providers] GitLab newly connected, loading repos...');
                    // Use setTimeout to ensure state is updated before loading
                    setTimeout(() => loadGitlabRepos(), 0);
                }
                return gitlabLinked;
            });

            if (!githubLinked) setRepos([]);
            if (!gitlabLinked) setGitlabRepos([]);
        } catch (err) {
            console.error('[Providers] Error refreshing linked providers:', err);
        }
    }, [isDemoMode, session, loadRepos, loadGitlabRepos]);

    // Initial load of provider status
    useEffect(() => {
        if (isDemoMode) return; // Demo mode uses localStorage state
        if (status !== 'authenticated') return;
        refreshLinkedProviders();
    }, [isDemoMode, status, refreshLinkedProviders]);

    // Periodic refresh of provider status (with visibility awareness) - skip in demo mode
    useEffect(() => {
        if (isDemoMode) return;
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
    }, [isDemoMode, status, refreshLinkedProviders]);

    // Disconnect GitHub
    const handleDisconnectGitHub = async () => {
        // Get latest values from refs
        const repo = currentRepoRef.current;
        const clearProjectFn = clearProjectRef.current;
        const closeAllTabsFn = closeAllTabsRef.current;
        const setCodeFn = setCodeRef.current;

        // Check if current project is from GitHub and clear it
        const isCurrentProjectFromGitHub = repo && (!repo.provider || repo.provider === 'github');

        if (!isDemoMode) {
            try {
                await fetch('/api/auth/disconnect?provider=github', { method: 'POST' });
            } catch (err) {
                console.error('Error disconnecting GitHub:', err);
            }
        }
        
        setIsGithubConnected(false);
        setRepos([]);

        // Clear project if it was from GitHub
        if (isCurrentProjectFromGitHub) {
            if (closeAllTabsFn) closeAllTabsFn();
            if (setCodeFn) setCodeFn('');
            if (clearProjectFn) clearProjectFn();
            // Clear code state from localStorage
            try {
                const prefix = isDemoMode ? 'vulniq_demo_' : 'vulniq_';
                localStorage.removeItem(`${prefix}code_state`);
            } catch (err) {
                console.error('Error clearing code state from localStorage:', err);
            }
            toast.success("Disconnected from GitHub! Project unloaded.");
        } else {
            toast.success("Disconnected from GitHub!");
        }

        if (!isDemoMode) {
            await refreshLinkedProviders();
        }
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

        if (!isDemoMode) {
            try {
                await fetch('/api/auth/disconnect?provider=gitlab', { method: 'POST' });
            } catch (err) {
                console.error('Error disconnecting GitLab:', err);
            }
        }
        
        setIsGitlabConnected(false);
        setGitlabRepos([]);

        // Clear project if it was from GitLab
        if (isCurrentProjectFromGitLab) {
            if (closeAllTabsFn) closeAllTabsFn();
            if (setCodeFn) setCodeFn('');
            if (clearProjectFn) clearProjectFn();
            // Clear code state from localStorage
            try {
                const prefix = isDemoMode ? 'vulniq_demo_' : 'vulniq_';
                localStorage.removeItem(`${prefix}code_state`);
            } catch (err) {
                console.error('Error clearing code state from localStorage:', err);
            }
            toast.success("Disconnected from GitLab! Project unloaded.");
        } else {
            toast.success("Disconnected from GitLab!");
        }

        if (!isDemoMode) {
            await refreshLinkedProviders();
        }
    };

    // Demo mode: Connect to GitHub (simulated)
    const handleConnectGitHub = useCallback(() => {
        if (!isDemoMode) return;
        setIsGithubConnected(true);
        setRepos(DEMO_GITHUB_REPOS);
        toast.success("Connected to GitHub!");
    }, [isDemoMode]);

    // Demo mode: Connect to GitLab (simulated)
    const handleConnectGitlab = useCallback(() => {
        if (!isDemoMode) return;
        setIsGitlabConnected(true);
        setGitlabRepos(DEMO_GITLAB_REPOS);
        toast.success("Connected to GitLab!");
    }, [isDemoMode]);

    return {
        session,
        status,
        isDemoMode,
        isGithubConnected,
        isGitlabConnected,
        repos,
        gitlabRepos,
        isLoadingRepos,
        loadRepos,
        loadGitlabRepos,
        handleDisconnectGitHub,
        handleDisconnectGitlab,
        handleConnectGitHub,
        handleConnectGitlab,
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
            // Clear any existing code state and editor tabs so the editor starts fresh
            try {
                localStorage.removeItem('vulniq_code_state');
                localStorage.removeItem('vulniq_editor_tabs');
                localStorage.removeItem('vulniq_editor_language');
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
            // Clear any existing code state and editor tabs so the editor starts fresh
            try {
                localStorage.removeItem('vulniq_code_state');
                localStorage.removeItem('vulniq_editor_tabs');
                localStorage.removeItem('vulniq_editor_language');
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
            // Clear any existing code state and editor tabs so the editor starts fresh
            try {
                localStorage.removeItem('vulniq_code_state');
                localStorage.removeItem('vulniq_editor_tabs');
                localStorage.removeItem('vulniq_editor_language');
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

