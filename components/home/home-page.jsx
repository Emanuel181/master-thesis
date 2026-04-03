"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
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
import { PromptPanel, ViewPromptDialog, EditPromptDialog, DeleteConfirmDialog, ResetConfirmDialog } from "./_components/prompt-panel"
import { CurrentProjectCard, ImportProgressDialog, LayoutCustomizer } from "./_components/panel-layout"
import {
    WelcomeBanner,
    SecurityStatsCards,
    RecentScansCard,
    TopVulnerabilitiesCard,
    useDashboardOverview,
    MAX_SCANS,
} from "./_components/dashboard-overview"
import { NewScanDialog } from "./_components/new-scan-dialog"

// Utils
import { fetchRepoTree } from "@/lib/github-api"

/**
 * HomePage component - Main dashboard for repository and prompt management.
 * Sections are rendered in user-customizable order via the layout hook.
 */
export function HomePage({ onNavigate }) {
    const router = useRouter()
    const pathname = usePathname()
    const isDemoMode = pathname?.startsWith('/demo')
    const { data: session } = useSession()

    // Dashboard overview data
    const overview = useDashboardOverview()

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

    // New scan dialog
    const [newScanOpen, setNewScanOpen] = useState(false)

    const handleOpenNewScan = () => {
        // Enforce 3-scan limit
        if (overview.recentRuns.length >= MAX_SCANS) {
            toast.error(`You can have a maximum of ${MAX_SCANS} scans. Delete an existing scan first.`)
            return
        }
        setNewScanOpen(true)
    }

    const handleStartScan = async (scanConfig) => {
        if (scanConfig.type === "repository") {
            // Import repo then navigate to code input
            await handleImportRepo({
                ...scanConfig.repo,
                scanName: scanConfig.name,
                scanBranch: scanConfig.branch,
            })
        } else if (scanConfig.type === "upload") {
            // For ZIP upload - store the file info and navigate to code input
            toast.success(`Project "${scanConfig.name}" ready for scanning`)
            onNavigate({ title: "Code inspection" })
        } else if (scanConfig.type === "oss") {
            // URL already validated & sanitized by the dialog (SSRF-safe)
            await handleImportRepo({
                full_name: `${scanConfig.owner}/${scanConfig.repo}`,
                name: scanConfig.repo,
                provider: scanConfig.provider,
                id: `oss-${Date.now()}`,
                scanName: scanConfig.name,
            })
        }
    }

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
                // Mark the provider as connected so the code-input page doesn't clear the project
                const provider = repo.provider || 'github'
                try {
                    if (provider === 'gitlab') {
                        localStorage.setItem('vulniq_demo_gitlab_connected', 'true')
                    } else {
                        localStorage.setItem('vulniq_demo_github_connected', 'true')
                    }
                } catch { /* quota exceeded */ }
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
            router.push(isDemoMode ? "/demo/code-input" : "/dashboard?active=Code%20inspection")
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
        router.push(isDemoMode ? "/demo/code-input" : "/dashboard?active=Code%20inspection")
    }

    // ── Section renderers ───────────────────────────────────────────────────

    const renderWelcome = () => {
        if (!onNavigate) return null
        return (
            <WelcomeBanner
                key="welcome"
                userName={isDemoMode ? "Demo User" : session?.user?.name}
                onNavigate={onNavigate}
                onNewScan={handleOpenNewScan}
            />
        )
    }

    const renderStats = () => (
        <SecurityStatsCards key="stats" stats={overview.stats} isLoading={overview.isLoading} />
    )

    const renderActivity = () => {
        if (!onNavigate) return null
        return (
            <div key="activity" className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
                <RecentScansCard
                    runs={overview.recentRuns}
                    isLoading={overview.isLoading}
                    onNavigate={onNavigate}
                    onRefresh={overview.refresh}
                />
                <TopVulnerabilitiesCard
                    vulnerabilities={overview.topVulnerabilities}
                    isLoading={overview.isLoading}
                    onNavigate={onNavigate}
                />
            </div>
        )
    }

    const renderGitHubPanel = () => (
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
        />
    )

    const renderGitLabPanel = () => (
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
        />
    )

    const renderPromptPanel = () => (
        <PromptPanel
            prompts={prompts.prompts}
            currentAgent={prompts.currentAgent}
            setCurrentAgent={prompts.setCurrentAgent}
            isRefreshing={prompts.isRefreshing}
            onRefresh={prompts.handleRefresh}
            isResetting={prompts.isResetting}
            onResetToDefaults={prompts.handleResetToDefaults}
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
        />
    )

    const renderRepos = () => (
        <div key="repos" className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 auto-rows-min">
            {/* Left Column - GitHub & GitLab */}
            <div className={`flex flex-col gap-2 sm:gap-3 min-h-0 ${layout.columnsSwapped ? 'order-2 lg:order-2' : 'order-2 lg:order-1'}`}>
                {layout.repoSwapped ? (
                    <>
                        {renderGitLabPanel()}
                        {renderGitHubPanel()}
                    </>
                ) : (
                    <>
                        {renderGitHubPanel()}
                        {renderGitLabPanel()}
                    </>
                )}
            </div>

            {/* Right Column - Prompts & Current Project */}
            <div className={`flex flex-col gap-2 sm:gap-3 min-h-0 ${layout.columnsSwapped ? 'order-1 lg:order-1' : 'order-1 lg:order-2'}`}>
                {layout.rightSwapped ? (
                    <>
                        <CurrentProjectCard
                            currentRepo={currentRepo}
                            onOpenInEditor={handleOpenInEditor}
                            onUnload={handleUnloadProject}
                        />
                        {renderPromptPanel()}
                    </>
                ) : (
                    <>
                        {renderPromptPanel()}
                        <CurrentProjectCard
                            currentRepo={currentRepo}
                            onOpenInEditor={handleOpenInEditor}
                            onUnload={handleUnloadProject}
                        />
                    </>
                )}
            </div>
        </div>
    )

    // Map section ids to renderers
    const sectionRenderers = {
        welcome: renderWelcome,
        stats: renderStats,
        activity: renderActivity,
        repos: renderRepos,
    }

    return (
        <ScrollArea className="flex-1 h-full">
            <div className="flex flex-col gap-2 p-2 sm:p-3 pt-0 pb-6">
                {/* Layout customizer — top right */}
                {onNavigate && (
                    <div className="flex justify-end -mb-1">
                        <LayoutCustomizer
                            sectionOrder={layout.sectionOrder}
                            onMoveUp={layout.moveSectionUp}
                            onMoveDown={layout.moveSectionDown}
                            onReset={layout.resetLayout}
                            repoSwapped={layout.repoSwapped}
                            rightSwapped={layout.rightSwapped}
                            columnsSwapped={layout.columnsSwapped}
                            onSwapRepos={layout.handleSwapRepoPanels}
                            onSwapRight={layout.handleSwapRightPanels}
                            onSwapColumns={layout.handleSwapColumns}
                        />
                    </div>
                )}

                {/* Render sections in user-defined order */}
                {layout.sectionOrder.map(id => {
                    const renderer = sectionRenderers[id]
                    return renderer ? renderer() : null
                })}
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

            <ResetConfirmDialog
                isOpen={prompts.resetConfirmOpen}
                onClose={() => prompts.setResetConfirmOpen(false)}
                onConfirm={prompts.confirmResetToDefaults}
            />

            <ImportProgressDialog importingRepo={importingRepo} />

            <NewScanDialog
                open={newScanOpen}
                onOpenChange={setNewScanOpen}
                githubRepos={github.repos}
                gitlabRepos={gitlab.repos}
                isGithubConnected={github.isConnected}
                isGitlabConnected={gitlab.isConnected}
                onStartScan={handleStartScan}
            />
        </ScrollArea>
    )
}
