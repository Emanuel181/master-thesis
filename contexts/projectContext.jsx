import React, { createContext, useContext, useState } from "react";

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
    const [projectStructure, setProjectStructure] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [viewMode, setViewMode] = useState("project");

    // ✅ ADD THESE TWO
    const [currentRepo, setCurrentRepo] = useState(null);
    // Example shape: { owner: "octocat", repo: "my-app" }

    return (
        <ProjectContext.Provider
            value={{
                projectStructure,
                setProjectStructure,
                selectedFile,
                setSelectedFile,
                viewMode,
                setViewMode,

                // ✅ MAKE THEM AVAILABLE
                currentRepo,
                setCurrentRepo,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    return useContext(ProjectContext);
}
