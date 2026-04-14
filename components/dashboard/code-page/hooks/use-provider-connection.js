"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from '@/i18n/navigation';
import { toast } from "sonner";
import { DEMO_GITHUB_REPOS, DEMO_GITLAB_REPOS, DEMO_PROJECTS } from '@/contexts/demoContext';
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

    // Provider connection state — always start false for SSR, then hydrate from localStorage
    const [isGithubConnected, setIsGithubConnected] = useState(false);
    const [isGitlabConnected, setIsGitlabConnected] = useState(false);

    // Guard: don't persist demo state until after initial hydration from localStorage
    const demoHydratedRef = useRef(false);

    // Hydrate demo connection state from localStorage after mount
    useEffect(() => {
        if (isDemoMode) {
            setIsGithubConnected(getInitialDemoState(DEMO_GITHUB_KEY));
            setIsGitlabConnected(getInitialDemoState(DEMO_GITLAB_KEY));
            // Mark hydration complete after a tick so persist effects see fresh values
            requestAnimationFrame(() => { demoHydratedRef.current = true; });
        }
        return () => { demoHydratedRef.current = false; };
    }, [isDemoMode]);

    // Persist demo connection state (only after initial hydration)
    useEffect(() => {
        if (!isDemoMode) return;
        if (!demoHydratedRef.current) return;
        try {
            localStorage.setItem(DEMO_GITHUB_KEY, String(isGithubConnected));
        } catch {}
    }, [isDemoMode, isGithubConnected]);

    useEffect(() => {
        if (!isDemoMode) return;
        if (!demoHydratedRef.current) return;
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
    // Separate loading states per provider to avoid race conditions
    const [isLoadingGithubRepos, setIsLoadingGithubRepos] = useState(false);
    const [isLoadingGitlabRepos, setIsLoadingGitlabRepos] = useState(false);
    // Combined loading state for backward compatibility (used by UI components)
    const isLoadingRepos = isLoadingGithubRepos || isLoadingGitlabRepos;

    // Load GitHub repos
    const loadRepos = useCallback(async () => {
        if (isDemoMode) {
            setIsLoadingGithubRepos(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            setRepos(DEMO_GITHUB_REPOS);
            setIsLoadingGithubRepos(false);
            return;
        }
        setIsLoadingGithubRepos(true);
        try {
            const response = await fetch('/api/github/repos');
            if (response.ok) {
                const jsonResponse = await response.json();

                // Handle wrapped response from createApiHandler
                const reposData = jsonResponse.data || jsonResponse;

                if (!Array.isArray(reposData)) {
                    toast.error('Invalid response format from GitHub API');
                    return;
                }

                setRepos(reposData);
            } else {
                const error = await response.json().catch(() => ({ error: 'Failed to load repositories' }));
                toast.error(error.error || 'Failed to load GitHub repositories');
            }
        } catch (error) {
            toast.error('Failed to connect to GitHub API');
        } finally {
            setIsLoadingGithubRepos(false);
        }
    }, [isDemoMode]);

    // Load GitLab repos
    const loadGitlabRepos = useCallback(async () => {
        if (isDemoMode) {
            setIsLoadingGitlabRepos(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            setGitlabRepos(DEMO_GITLAB_REPOS);
            setIsLoadingGitlabRepos(false);
            return;
        }
        setIsLoadingGitlabRepos(true);
        try {
            const response = await fetch('/api/gitlab/repos');
            if (response.ok) {
                const jsonResponse = await response.json();
                
                // Handle wrapped response from createApiHandler
                const reposData = jsonResponse.data || jsonResponse;
                
                if (!Array.isArray(reposData)) {
                    toast.error('Invalid response format from GitLab API');
                    return;
                }

                setGitlabRepos(reposData);
            } else {
                const error = await response.json().catch(() => ({ error: 'Failed to load repositories' }));
                toast.error(error.error || 'Failed to load GitLab repositories');
            }
        } catch (error) {
            toast.error('Failed to connect to GitLab API');
        } finally {
            setIsLoadingGitlabRepos(false);
        }
    }, [isDemoMode]);

    // Use a ref for session to avoid recreating refreshLinkedProviders on every session object change
    const sessionRef = useRef(session);
    useEffect(() => { sessionRef.current = session; }, [session]);

    // Refresh linked providers from API and update connection state only
    // Repo loading is handled separately by dedicated effects below
    const refreshLinkedProviders = useCallback(async () => {
        if (isDemoMode) return;
        if (!sessionRef.current) return;

        try {
            const res = await fetch('/api/providers/linked', {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!res.ok) {
                return;
            }
            
            const response = await res.json();

            // Handle wrapped response from createApiHandler
            let providers = [];

            if (response.success && response.data && Array.isArray(response.data.providers)) {
                providers = response.data.providers;
            } else if (Array.isArray(response.providers)) {
                providers = response.providers;
            } else if (response.data && Array.isArray(response.data)) {
                providers = response.data;
            } else {
                // could not find providers array
            }
            
            const linked = new Set(providers);
            const githubLinked = linked.has('github');
            const gitlabLinked = linked.has('gitlab');

            // Update connection state (repo loading is triggered reactively by effects below)
            setIsGithubConnected(githubLinked);
            setIsGitlabConnected(gitlabLinked);

            if (!githubLinked) setRepos([]);
            if (!gitlabLinked) setGitlabRepos([]);
        } catch (err) {
            // silently fail — UI already reflects disconnected state
        }
    }, [isDemoMode]);

    // Reactive repo loading: whenever a provider is connected and repos are empty, load them.
    // This is the ONLY place repos get loaded (single responsibility), eliminating all race conditions.
    // Uses refs to prevent duplicate concurrent loads.
    const githubLoadingRef = useRef(false);
    const gitlabLoadingRef = useRef(false);

    useEffect(() => {
        if (isDemoMode) return;
        if (status !== 'authenticated') return;
        if (!isGithubConnected) return;
        if (repos.length > 0) return;
        if (githubLoadingRef.current) return;

        githubLoadingRef.current = true;
        loadRepos().finally(() => { githubLoadingRef.current = false; });
    }, [isDemoMode, status, isGithubConnected, repos.length, loadRepos]);

    useEffect(() => {
        if (isDemoMode) return;
        if (status !== 'authenticated') return;
        if (!isGitlabConnected) return;
        if (gitlabRepos.length > 0) return;
        if (gitlabLoadingRef.current) return;

        gitlabLoadingRef.current = true;
        loadGitlabRepos().finally(() => { gitlabLoadingRef.current = false; });
    }, [isDemoMode, status, isGitlabConnected, gitlabRepos.length, loadGitlabRepos]);

    // Initial load of provider status
    useEffect(() => {
        if (isDemoMode) return;
        if (status !== 'authenticated') return;
        refreshLinkedProviders();
        // Also refresh after a short delay to catch post-OAuth redirects
        const timeout = setTimeout(refreshLinkedProviders, 1500);
        return () => clearTimeout(timeout);
    }, [isDemoMode, status, refreshLinkedProviders]);

    // Periodic refresh of provider status (with visibility awareness) - skip in demo mode
    useEffect(() => {
        if (isDemoMode) return;
        if (status !== 'authenticated') return;

        let interval;
        const POLL_INTERVAL = 120000; // 2 minutes

        const startPolling = () => {
            interval = setInterval(refreshLinkedProviders, POLL_INTERVAL);
        };

        const stopPolling = () => {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopPolling();
            } else {
                refreshLinkedProviders();
                startPolling();
            }
        };

        const handleFocus = () => {
            refreshLinkedProviders();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        if (!document.hidden) {
            startPolling();
        }

        return () => {
            stopPolling();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
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
                // ignore disconnect errors
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
                // ignore storage errors
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
                // ignore disconnect errors
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
                // ignore storage errors
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
    const pathname = usePathname();
    const isDemoMode = pathname?.startsWith('/demo');

    // Listen for open-project-switcher event (from command palette shortcut Ctrl+O)
    useEffect(() => {
        const handleOpenProjectSwitcher = () => {
            setIsImportDialogOpen(true);
        };
        window.addEventListener("open-project-switcher", handleOpenProjectSwitcher);
        return () => window.removeEventListener("open-project-switcher", handleOpenProjectSwitcher);
    }, []);

    /**
     * In demo mode, resolve a project structure from DEMO_PROJECTS by full_name.
     * Falls back to null if not found.
     */
    const resolveDemoProject = (fullName) => {
        const structure = DEMO_PROJECTS[fullName];
        if (!structure) return null;
        return structure;
    };

    // Import repo by search term (owner/repo format)
    const handleImport = async () => {
        if (!searchTerm.trim()) return;
        try {
            const [owner, repo] = searchTerm.split('/');
            if (!owner || !repo) throw new Error("Invalid format");

            let structure;
            if (isDemoMode) {
                structure = resolveDemoProject(searchTerm.trim());
                if (!structure) throw new Error("Demo project not found");
            } else {
                structure = await apiFetchRepoTree(owner, repo);
            }

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
                // ignore storage errors
            }
            toast.success("Project switched successfully!");
        } catch (error) {
            toast.error("Failed to switch project: " + error.message);
        }
    };

    // Select GitHub repo
    const handleSelectRepo = async (repo) => {
        try {
            const owner = repo.owner?.login || repo.full_name?.split('/')[0];
            const repoName = repo.name;
            if (!owner || !repoName) throw new Error("Invalid repo data");
            const fullName = repo.full_name || `${owner}/${repoName}`;

            let structure;
            if (isDemoMode) {
                structure = resolveDemoProject(fullName);
                if (!structure) throw new Error("Demo project not found");
            } else {
                structure = await apiFetchRepoTree(owner, repoName, 'github');
            }

            setProjectStructure(structure);
            setCurrentRepo({ owner, repo: repoName, provider: 'github' });
            setViewMode('project');
            setIsImportDialogOpen(false);
            // Clear any existing code state and editor tabs so the editor starts fresh
            try {
                localStorage.removeItem('vulniq_code_state');
                localStorage.removeItem('vulniq_editor_tabs');
                localStorage.removeItem('vulniq_editor_language');
            } catch (err) {
                // ignore storage errors
            }
            toast.success("Project switched successfully!");
        } catch (error) {
            toast.error("Failed to switch project: " + error.message);
        }
    };

    // Select GitLab repo
    const handleSelectGitlabRepo = async (repo) => {
        try {
            const owner = repo.full_name?.split('/')[0];
            const repoName = repo.name;
            if (!owner || !repoName) throw new Error("Invalid repo data");
            const fullName = repo.full_name || `${owner}/${repoName}`;

            let structure;
            if (isDemoMode) {
                structure = resolveDemoProject(fullName);
                if (!structure) throw new Error("Demo project not found");
            } else {
                structure = await apiFetchRepoTree(owner, repoName, 'gitlab');
            }

            setProjectStructure(structure);
            setCurrentRepo({ owner, repo: repoName, provider: 'gitlab' });
            setViewMode('project');
            setIsImportDialogOpen(false);
            // Clear any existing code state and editor tabs so the editor starts fresh
            try {
                localStorage.removeItem('vulniq_code_state');
                localStorage.removeItem('vulniq_editor_tabs');
                localStorage.removeItem('vulniq_editor_language');
            } catch (err) {
                // ignore storage errors
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

