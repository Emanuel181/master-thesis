"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

// Contexts
import { useProject } from "@/contexts/projectContext"
import { useDemo, DEMO_PROJECTS } from "@/contexts/demoContext"

// Custom hooks
import { useGitHubRepos } from "@/hooks/use-github-repos"
import { useGitLabRepos } from "@/hooks/use-gitlab-repos"
import { usePromptManagement } from "@/hooks/use-prompt-management"
import { usePanelLayout } from "@/hooks/use-panel-layout"

// Components
import { GitHubRepoPanel, GitLabRepoPanel } from "./_components/repo-panel"
import { PromptPanel, ViewPromptDialog, EditPromptDialog, DeleteConfirmDialog } from "./_components/prompt-panel"
import { SwapButton, CurrentProjectCard, ImportProgressDialog } from "./_components/panel-layout"

// Utils
import { fetchRepoTree } from "@/lib/github-api"

/**
 * HomePage component - Main dashboard for repository and prompt management.
 * Refactored to use custom hooks and extracted sub-components.
 */
export function HomePage() {
    const router = useRouter()
    const pathname = usePathname()
    const isDemoMode = pathname?.startsWith('/demo')
    
    // Project context
    const { 
        setProjectStructure, 
        setViewMode, 
        setCurrentRepo, 
        currentRepo, 
        clearProject, 
        setProjectUnloaded 
    } = useProject()
    const { switchDemoProject } = useDemo()

    // Custom hooks
    const github = useGitHubRepos()
    const gitlab = useGitLabRepos()
    const prompts = usePromptManagement()
    const layout = usePanelLayout()

    // Import state
    const [importingRepo, setImportingRepo] = useState(null)

    // Import repository handler
    const handleImportRepo = async (repo) => {
        setImportingRepo({ repo, progress: 0, status: 'Initializing...' })

        try {
            await new Promise(resolve => setTimeout(resolve, 300))
            setImportingRepo(prev => ({ ...prev, progress: 15, status: 'Connecting to repository...' }))

            await new Promise(resolve => setTimeout(resolve, 200))
            const [owner, repoName] = repo.full_name.split("/")
            setImportingRepo(prev => ({ ...prev, progress: 30, status: 'Fetching repository structure...' }))

            let structure
            if (isDemoMode) {
                await new Promise(resolve => setTimeout(resolve, 400))
                structure = DEMO_PROJECTS[repo.full_name] || DEMO_PROJECTS["demo-org/vulnerable-express-app"]
                switchDemoProject(repo.full_name)
            } else {
                structure = await fetchRepoTree(owner, repoName, repo.provider)
            }
            setImportingRepo(prev => ({ ...prev, progress: 70, status: 'Processing files...' }))

            await new Promise(resolve => setTimeout(resolve, 300))
            setProjectStructure(structure)
            setCurrentRepo({ owner, repo: repoName, provider: repo.provider })
            setViewMode("project")
            setProjectUnloaded(false)
            
            // Clear code state
            try {
                const codeStateKey = isDemoMode ? 'vulniq_demo_code_state' : 'vulniq_code_state'
                const editorTabsKey = isDemoMode ? 'vulniq_demo_editor_tabs' : 'vulniq_editor_tabs'
                const editorLanguageKey = isDemoMode ? 'vulniq_demo_editor_language' : 'vulniq_editor_language'
                localStorage.removeItem(codeStateKey)
                localStorage.removeItem(editorTabsKey)
                localStorage.removeItem(editorLanguageKey)
            } catch (err) {
                console.error("Error clearing code state:", err)
            }
            setImportingRepo(prev => ({ ...prev, progress: 90, status: 'Finalizing...' }))

            await new Promise(resolve => setTimeout(resolve, 300))
            setImportingRepo(prev => ({ ...prev, progress: 100, status: 'Complete!' }))
            await new Promise(resolve => setTimeout(resolve, 500))

            toast.success(`Repository "${repo.full_name}" imported successfully!`)
            setImportingRepo(null)
            router.push(isDemoMode ? "/demo/code-input" : "/dashboard?active=Code%20input")
        } catch (err) {
            setImportingRepo(prev => ({ ...prev, progress: 0, status: 'Failed' }))
            await new Promise(resolve => setTimeout(resolve, 500))
            setImportingRepo(null)
            toast.error("Failed to import repository: " + err.message)
        }
    }

    const handleUnloadProject = () => {
        clearProject()
        toast.success("Project unloaded successfully!")
    }

    const handleOpenInEditor = () => {
        router.push(isDemoMode ? "/demo/code-input" : "/dashboard?active=Code%20input")
    }

    return (
        <ScrollArea className="flex-1 h-full">
            <div className="flex flex-col gap-2 p-2 sm:p-3 pt-0 pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 auto-rows-min relative">
                    {/* Swap button between columns */}
                    <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <SwapButton 
                            onClick={layout.handleSwapColumns} 
                            title="Swap left and right columns"
                            rotate
                        />
                    </div>

                    {/* Left Column - GitHub & GitLab */}
                    <div className={`flex flex-col gap-2 sm:gap-3 min-h-0 relative ${layout.columnsSwapped ? 'order-2 lg:order-2' : 'order-2 lg:order-1'}`}>
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                            <SwapButton 
                                onClick={layout.handleSwapRepoPanels} 
                                title="Swap GitHub and GitLab positions"
                            />
                        </div>

                        <GitHubRepoPanel
                            repos={github.repos}
                            isLoading={github.isLoading}
                            isConnected={github.isConnected}
                            isRefreshing={github.isRefreshing}
                            searchTerm={github.searchTerm}
                            setSearchTerm={github.setSearchTerm}
                            currentPage={github.currentPage}
                            setCurrentPage={github.setCurrentPage}
                            paginatedRepos={github.paginatedRepos}
                            totalPages={github.totalPages}
                            totalCount={github.totalCount}
                            status={github.status}
                            isDemoMode={github.isDemoMode}
                            connect={github.connect}
                            disconnect={github.disconnect}
                            refresh={github.refresh}
                            importingRepo={importingRepo}
                            onImportRepo={handleImportRepo}
                            className={layout.repoSwapped ? 'order-2' : 'order-1'}
                        />

                        <GitLabRepoPanel
                            repos={gitlab.repos}
                            isLoading={gitlab.isLoading}
                            isConnected={gitlab.isConnected}
                            isRefreshing={gitlab.isRefreshing}
                            searchTerm={gitlab.searchTerm}
                            setSearchTerm={gitlab.setSearchTerm}
                            currentPage={gitlab.currentPage}
                            setCurrentPage={gitlab.setCurrentPage}
                            paginatedRepos={gitlab.paginatedRepos}
                            totalPages={gitlab.totalPages}
                            totalCount={gitlab.totalCount}
                            status={gitlab.status}
                            isDemoMode={gitlab.isDemoMode}
                            connect={gitlab.connect}
                            disconnect={gitlab.disconnect}
                            refresh={gitlab.refresh}
                            importingRepo={importingRepo}
                            onImportRepo={handleImportRepo}
                            className={layout.repoSwapped ? 'order-1' : 'order-2'}
                        />
                    </div>

                    {/* Right Column - Prompts & Current Project */}
                    <div className={`flex flex-col gap-2 sm:gap-3 min-h-0 relative ${layout.columnsSwapped ? 'order-1 lg:order-1' : 'order-1 lg:order-2'}`}>
                        <PromptPanel
                            prompts={prompts.prompts}
                            currentAgent={prompts.currentAgent}
                            setCurrentAgent={prompts.setCurrentAgent}
                            isRefreshing={prompts.isRefreshing}
                            onRefresh={prompts.handleRefresh}
                            isDialogOpen={prompts.isDialogOpen}
                            setIsDialogOpen={prompts.setIsDialogOpen}
                            newTitle={prompts.newTitle}
                            setNewTitle={prompts.setNewTitle}
                            newPrompt={prompts.newPrompt}
                            setNewPrompt={prompts.setNewPrompt}
                            onAddPrompt={prompts.handleAddPrompt}
                            selectedPrompts={prompts.selectedPrompts}
                            setSelectedPrompts={prompts.setSelectedPrompts}
                            setDeleteDialog={prompts.setDeleteDialog}
                            getPaginatedPrompts={prompts.getPaginatedPrompts}
                            setAgentPage={prompts.setAgentPage}
                            activeId={prompts.activeId}
                            activeDragAgent={prompts.activeDragAgent}
                            onDragStart={prompts.handleDragStart}
                            onDragEnd={prompts.handleDragEnd}
                            truncateText={prompts.truncateText}
                            setViewFullTextPrompt={prompts.setViewFullTextPrompt}
                            openEditDialog={prompts.openEditDialog}
                            onMoveUp={prompts.handleMoveUp}
                            onMoveDown={prompts.handleMoveDown}
                            className={layout.rightSwapped ? 'order-2' : 'order-1'}
                        />

                        <div className="relative h-0 flex items-center justify-center z-10">
                            <SwapButton 
                                onClick={layout.handleSwapRightPanels} 
                                title="Swap Prompts and Current Project positions"
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                            />
                        </div>

                        <CurrentProjectCard
                            currentRepo={currentRepo}
                            onOpenInEditor={handleOpenInEditor}
                            onUnload={handleUnloadProject}
                            className={layout.rightSwapped ? 'order-1' : 'order-3'}
                        />
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <ViewPromptDialog
                prompt={prompts.viewFullTextPrompt}
                onClose={() => prompts.setViewFullTextPrompt(null)}
                onEdit={prompts.openEditDialog}
                currentAgent={prompts.currentAgent}
            />

            <EditPromptDialog
                isOpen={prompts.editDialogOpen}
                onOpenChange={prompts.setEditDialogOpen}
                editingData={prompts.editingPromptData}
                setEditingData={prompts.setEditingPromptData}
                onSave={prompts.handleEditPrompt}
            />

            <DeleteConfirmDialog
                deleteDialog={prompts.deleteDialog}
                onClose={() => prompts.setDeleteDialog(null)}
                onConfirm={prompts.confirmDelete}
                selectedCount={prompts.selectedPrompts.size}
            />

            <ImportProgressDialog importingRepo={importingRepo} />
        </ScrollArea>
    )
}
