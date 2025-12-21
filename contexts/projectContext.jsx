import React, { createContext, useContext, useState, useEffect } from "react";

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
});

const STORAGE_KEY = "vulniq_project_state";

export function ProjectProvider({ children }) {
    const [projectStructure, setProjectStructureState] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [viewMode, setViewMode] = useState("project");
    const [currentRepo, setCurrentRepoState] = useState(null);
    const [isHydrated, setIsHydrated] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.projectStructure) setProjectStructureState(parsed.projectStructure);
                if (parsed.currentRepo) setCurrentRepoState(parsed.currentRepo);
                if (parsed.viewMode) setViewMode(parsed.viewMode);
            }
        } catch (err) {
            console.error("Error loading project state from localStorage:", err);
        }
        setIsHydrated(true);
    }, []);

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
    }, [projectStructure, currentRepo, viewMode, isHydrated]);

    // Wrapper functions to update state
    const setProjectStructure = (structure) => {
        setProjectStructureState(structure);
    };

    const setCurrentRepo = (repo) => {
        setCurrentRepoState(repo);
    };

    // Clear project and reset state
    const clearProject = () => {
        setProjectStructureState(null);
        setCurrentRepoState(null);
        setSelectedFile(null);
        setViewMode("project");
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (err) {
            console.error("Error clearing project state from localStorage:", err);
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
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    return useContext(ProjectContext);
}
