import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { isDemoPath, getStorageKey, DEMO_STORAGE_PREFIX } from "@/lib/demo-mode";

const ProjectContext = createContext({
    projectStructure: null,
    setProjectStructure: () => {},
    selectedFile: null,
    setSelectedFile: () => {},
    viewMode: "project",
    setViewMode: () => {},
    currentRepo: null,
    setCurrentRepo: () => {},
    clearProject: () => {},
    clearCodeState: () => {},
    projectClearCounter: 0,
    isDemoMode: false,
});

// SECURITY: Separate storage keys for demo and production modes
const PROD_STORAGE_KEY = "vulniq_project_state";
const DEMO_STORAGE_KEY = "vulniq_demo_project_state";

export function ProjectProvider({ children }) {
    const pathname = usePathname();
    const isDemoMode = isDemoPath(pathname);
    
    // Get the appropriate storage key based on mode
    const STORAGE_KEY = isDemoMode ? DEMO_STORAGE_KEY : PROD_STORAGE_KEY;
    
    // Initialize with null to avoid hydration mismatch - will load from localStorage in useEffect
    const [projectStructure, setProjectStructureState] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [viewMode, setViewMode] = useState("project");
    const [currentRepo, setCurrentRepoState] = useState(null);
    const [isHydrated, setIsHydrated] = useState(false);
    const [projectClearCounter, setProjectClearCounter] = useState(0);
    
    // Track current mode to detect mode changes
    const [prevIsDemoMode, setPrevIsDemoMode] = useState(isDemoMode);

    // Clear state when switching between demo and production modes
    useEffect(() => {
        if (isHydrated && prevIsDemoMode !== isDemoMode) {
            // Mode changed - clear current state to prevent cross-contamination
            setProjectStructureState(null);
            setCurrentRepoState(null);
            setSelectedFile(null);
            setViewMode("project");
            setProjectClearCounter(prev => prev + 1);
            setPrevIsDemoMode(isDemoMode);
        }
    }, [isDemoMode, prevIsDemoMode, isHydrated]);

    // Load state from localStorage after hydration (this pattern is intentional to avoid hydration mismatch)
    useEffect(() => {
        let savedState = null;
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                savedState = JSON.parse(saved);
            }
        } catch (err) {
            console.error("Error loading project state from localStorage:", err);
        }

        // Batch all state updates together (necessary for hydration)
        if (savedState) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setProjectStructureState(savedState.projectStructure || null);
            setCurrentRepoState(savedState.currentRepo || null);
            setViewMode(savedState.viewMode || "project");
        }
        setIsHydrated(true);
    }, [STORAGE_KEY]);


    // Save to localStorage when state changes
    useEffect(() => {
        if (!isHydrated) return;
        try {
            const state = {
                projectStructure,
                currentRepo,
                viewMode,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (err) {
            console.error("Error saving project state to localStorage:", err);
        }
    }, [projectStructure, currentRepo, viewMode, isHydrated, STORAGE_KEY]);

    // Wrapper functions to update state
    const setProjectStructure = (structure) => {
        setProjectStructureState(structure);
    };

    const setCurrentRepo = (repo) => {
        setCurrentRepoState(repo);
    };

    // SECURITY: Get mode-specific storage keys for clearing
    const getCodeStateKey = () => isDemoMode ? 'vulniq_demo_code_state' : 'vulniq_code_state';
    const getEditorTabsKey = () => isDemoMode ? 'vulniq_demo_editor_tabs' : 'vulniq_editor_tabs';
    const getEditorLanguageKey = () => isDemoMode ? 'vulniq_demo_editor_language' : 'vulniq_editor_language';

    // Clear project and reset state
    const clearProject = () => {
        setProjectStructureState(null);
        setCurrentRepoState(null);
        setSelectedFile(null);
        setViewMode("project");
        setProjectClearCounter(prev => prev + 1); // Notify listeners that project was cleared
        try {
            localStorage.removeItem(STORAGE_KEY);
            // Also clear code state when project is unloaded (mode-specific)
            localStorage.removeItem(getCodeStateKey());
            // Clear editor tabs (mode-specific)
            localStorage.removeItem(getEditorTabsKey());
            // Clear language selection (mode-specific)
            localStorage.removeItem(getEditorLanguageKey());
        } catch (err) {
            console.error("Error clearing project state from localStorage:", err);
        }
    };

    // Clear code state only (used when importing a new project)
    const clearCodeState = () => {
        setSelectedFile(null);
        setProjectClearCounter(prev => prev + 1); // Notify listeners to clear code state
        try {
            localStorage.removeItem(getCodeStateKey());
            // Clear editor tabs (mode-specific)
            localStorage.removeItem(getEditorTabsKey());
            // Clear language selection (mode-specific)
            localStorage.removeItem(getEditorLanguageKey());
        } catch (err) {
            console.error("Error clearing code state from localStorage:", err);
        }
    };

    return (
        <ProjectContext.Provider
            value={{
                projectStructure,
                setProjectStructure,
                selectedFile,
                setSelectedFile,
                viewMode,
                setViewMode,
                currentRepo,
                setCurrentRepo,
                clearProject,
                clearCodeState,
                projectClearCounter,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    return useContext(ProjectContext);
}
