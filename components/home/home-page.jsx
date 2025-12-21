"use client"

import React, { useState, useEffect, useRef } from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Github, Eye, RefreshCw, FolderX, FolderOpen, Loader2, CheckCircle2, GitBranch } from "lucide-react"
import { GitlabIcon } from "@/components/icons/gitlab"
import { toast } from "sonner"
import { useSession, signIn } from "next-auth/react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { useProject } from "@/contexts/projectContext"
import { usePrompts } from "@/contexts/promptsContext"
import { useRouter } from "next/navigation"
import { fetchRepoTree } from "@/lib/github-api"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const agents = ["reviewer", "implementation", "tester", "report"]

export function HomePage() {
    const { data: session, status } = useSession()
    const { setProjectStructure, setViewMode, setCurrentRepo, currentRepo, clearProject } = useProject()
    const router = useRouter()

    const {
        prompts,
        addPrompt: addPromptContext,
        editPrompt: editPromptContext,
        deletePrompt: deletePromptContext,
        bulkDeletePrompts,
        refresh: refreshPrompts,
    } = usePrompts()

    const [newPrompt, setNewPrompt] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [currentAgent, setCurrentAgent] = useState("reviewer")
    const [viewFullTextPrompt, setViewFullTextPrompt] = useState(null)

    const [repos, setRepos] = useState([])
    const [isLoadingRepos, setIsLoadingRepos] = useState(false)
    const [isGithubConnected, setIsGithubConnected] = useState(false)
    const [isRefreshingRepos, setIsRefreshingRepos] = useState(false)

    const [isRefreshingPrompts, setIsRefreshingPrompts] = useState(false)

    // Add GitLab states
    const [gitlabRepos, setGitlabRepos] = useState([])
    const [isLoadingGitlabRepos, setIsLoadingGitlabRepos] = useState(false)
    const [isGitlabConnected, setIsGitlabConnected] = useState(false)
    const [isRefreshingGitlabRepos, setIsRefreshingGitlabRepos] = useState(false)

    // Import progress state
    const [importingRepo, setImportingRepo] = useState(null) // { repo, progress, status }

    // Selected prompts for bulk delete
    const [selectedPrompts, setSelectedPrompts] = useState(new Set())

    // New title state
    const [newTitle, setNewTitle] = useState("")

    // Delete confirmation dialog
    const [deleteDialog, setDeleteDialog] = useState(null) // { type: 'single' | 'selected' | 'category', agent?: string, id?: string }

    // Edit prompt dialog
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingPromptData, setEditingPromptData] = useState(null) // { agent, id, title, text }

    // prevents React 18 dev-mode double-fetch
    const fetchOnceRef = useRef(false)

    // ---------------------------
    // Fetch repos only once
    // ---------------------------
    const fetchRepos = async (allowRefresh = false) => {
        if (!allowRefresh && fetchOnceRef.current) return
        if (allowRefresh) fetchOnceRef.current = false // Allow refresh

        setIsLoadingRepos(true)
        try {
            const response = await fetch(`/api/github/repos`)
            const data = await response.json()

            if (response.ok) {
                const dataWithProvider = data.map(r => ({ ...r, provider: 'github' }));
                setRepos(dataWithProvider)
            } else {
                console.warn(`[home] fetch /api/github/repos failed`, data)
                // surface debug info to the user console
                // show server debug message when available
                if (data?.debug?.message) {
                    console.log(`github debug: ${data.debug.message}`)
                } else if (data?.error) {
                    console.log(`github error: ${data.error}`)
                } else {
                    console.log(`Failed to fetch github repositories`)
                }
            }
        } catch (err) {
            console.error("Error fetching repos:", err)
        } finally {
            setIsLoadingRepos(false)
        }
    }

    // ---------------------------
    // Fetch GitLab repos
    // ---------------------------
    const fetchGitlabRepos = async (allowRefresh = false) => {
        if (!allowRefresh && fetchOnceRef.current) return
        if (allowRefresh) fetchOnceRef.current = false // Allow refresh

        setIsLoadingGitlabRepos(true)
        try {
            const response = await fetch(`/api/gitlab/repos`)
            const data = await response.json()

            if (response.ok) {
                const dataWithProvider = data.map(r => ({ ...r, provider: 'gitlab' }));
                setGitlabRepos(dataWithProvider)
            } else {
                console.warn(`[home] fetch /api/gitlab/repos failed`, data)
                // surface debug info to the user console
                // show server debug message when available
                if (data?.debug?.message) {
                    console.log(`gitlab debug: ${data.debug.message}`)
                } else if (data?.error) {
                    console.log(`gitlab error: ${data.error}`)
                } else {
                    console.log(`Failed to fetch gitlab repositories`)
                }
            }
        } catch (err) {
            console.error("Error fetching gitlab repos:", err)
        } finally {
            setIsLoadingGitlabRepos(false)
        }
    }

    // ---------------------------
    // Refresh handlers
    // ---------------------------
    const handleRefreshRepos = async () => {
        setIsRefreshingRepos(true)
        await fetchRepos(true)
        setIsRefreshingRepos(false)
        toast.success("GitHub repositories refreshed!")
    }

    const handleRefreshGitlabRepos = async () => {
        setIsRefreshingGitlabRepos(true)
        await fetchGitlabRepos(true)
        setIsRefreshingGitlabRepos(false)
        toast.success("GitLab repositories refreshed!")
    }

    const handleRefreshPrompts = async () => {
        setIsRefreshingPrompts(true)
        await refreshPrompts()
        setIsRefreshingPrompts(false)
        toast.success("Prompts refreshed!")
    }

    const refreshLinkedProviders = async () => {
        try {
            const res = await fetch('/api/providers/linked', { cache: 'no-store' })
            const data = await res.json()
            if (!res.ok) return

            const linked = new Set(data.providers || [])
            const githubLinked = linked.has('github')
            const gitlabLinked = linked.has('gitlab')

            setIsGithubConnected(githubLinked)
            setIsGitlabConnected(gitlabLinked)

            if (!githubLinked) setRepos([])
            if (!gitlabLinked) setGitlabRepos([])
            return { githubLinked, gitlabLinked }
        } catch (err) {
            console.error('Error refreshing linked providers:', err)
            return null
        }
    }

    // ---------------------------
    // Disconnect GitHub
    // ---------------------------
    const handleDisconnectGitHub = async () => {
        try {
            await fetch('/api/auth/disconnect?provider=github', { method: 'POST' });
        } catch (err) {
            console.error('Error disconnecting GitHub:', err);
        }
        setIsGithubConnected(false);
        setRepos([]);
        toast.success("Disconnected from GitHub!");
        await refreshLinkedProviders()
    }

    const handleDisconnectGitlab = async () => {
        try {
            await fetch('/api/auth/disconnect?provider=gitlab', { method: 'POST' });
        } catch (err) {
            console.error('Error disconnecting GitLab:', err);
        }
        setIsGitlabConnected(false);
        setGitlabRepos([]);
        toast.success("Disconnected from GitLab!");
        await refreshLinkedProviders()
    }

    // ---------------------------
    // Only fetch if authenticated AND repos not loaded
    // ---------------------------
    useEffect(() => {
        console.log('[HomePage] useEffect triggered:', { status, session: !!session, reposLength: repos.length, gitlabReposLength: gitlabRepos.length });
        if (status === "authenticated" && session) {
            ;(async () => {
                const linked = await refreshLinkedProviders()
                if (linked?.githubLinked && repos.length === 0) {
                    console.log('[HomePage] Fetching GitHub repos...')
                    fetchRepos()
                }
                if (linked?.gitlabLinked && gitlabRepos.length === 0) {
                    console.log('[HomePage] Fetching GitLab repos...')
                    fetchGitlabRepos()
                }
            })()
        }
    }, [status, session?.user?.id, repos.length, gitlabRepos.length, isGithubConnected, isGitlabConnected]);

    useEffect(() => {
        if (status !== 'authenticated') return
        const interval = setInterval(() => {
            refreshLinkedProviders()
        }, 30000) // Reduced from 5s to 30s for better performance
        return () => clearInterval(interval)
    }, [status])


    // ---------------------------
    // Clear GitHub state when logged out
    // ---------------------------
    useEffect(() => {
        if (status === "unauthenticated") {
            setIsGithubConnected(false);
            setRepos([]);
            setIsGitlabConnected(false);
            setGitlabRepos([]);
        }
    }, [status]);

    // ---------------------------
    // Prompt CRUD handlers
    // ---------------------------
    const handleAddPrompt = async () => {
        if (!newTitle.trim() || !newPrompt.trim()) {
            toast.error("Please enter both title and prompt")
            return
        }

        const result = await addPromptContext(currentAgent, { title: newTitle.trim(), text: newPrompt.trim() });
        if (result.success) {
            setNewTitle("")
            setNewPrompt("")
            setIsDialogOpen(false)
            toast.success("Prompt added successfully!")
        } else {
            toast.error(result.error || "Failed to add prompt")
        }
    }

    const handleEditPrompt = async (agent, id, newTitle, newText) => {
        const trimmedTitle = newTitle.trim()
        const trimmedText = newText.trim()
        if (!trimmedTitle || !trimmedText) return toast.error("Title and prompt cannot be empty")

        const result = await editPromptContext(agent, id, { title: trimmedTitle, text: trimmedText });
        if (result.success) {
            setEditDialogOpen(false)
            setEditingPromptData(null)
            toast.success("Prompt updated successfully!")
        } else {
            toast.error(result.error || "Failed to update prompt")
        }
    }

    const openEditDialog = (agent, prompt) => {
        setEditingPromptData({
            agent,
            id: prompt.id,
            title: prompt.title || "",
            text: prompt.text
        })
        setEditDialogOpen(true)
    }

    const handleDeletePrompt = async (agent, id) => {
        const result = await deletePromptContext(agent, id);
        if (result.success) {
            toast.success("Prompt deleted successfully!")
        } else {
            toast.error(result.error || "Failed to delete prompt")
        }
    }

    const handleDeleteSelected = async () => {
        if (selectedPrompts.size === 0) return;

        const ids = Array.from(selectedPrompts).map(key => key.split('-')[1]).filter(Boolean)
        const result = await bulkDeletePrompts(ids)

        if (result?.success) {
            toast.success(`${(result.deletedIds || []).length} prompt(s) deleted successfully!`)
        } else {
            const deletedCount = (result?.deletedIds || []).length
            const missingCount = (result?.missingIds || []).length
            const s3FailedCount = (result?.s3Failed || []).length

            const summary = [
                deletedCount ? `${deletedCount} deleted` : null,
                missingCount ? `${missingCount} missing` : null,
                s3FailedCount ? `${s3FailedCount} storage cleanup failed` : null,
            ].filter(Boolean).join(', ')

            toast.error(summary || result?.error || 'Bulk deletion failed')
        }

        setSelectedPrompts(new Set());
    }

    const handleDeleteAllFromCategory = async (agent) => {
        const promptsToDelete = prompts[agent] || [];
        const deletePromises = promptsToDelete.map(prompt => deletePromptContext(agent, prompt.id));
        const results = await Promise.all(deletePromises);
        const successCount = results.filter(r => r.success).length;

        if (successCount === promptsToDelete.length) {
            toast.success(`All ${successCount} prompts from ${agent} deleted successfully!`);
        } else {
            toast.error(`Failed to delete some prompts. ${successCount} deleted.`);
        }
    };

    // ---------------------------
    // Confirm delete
    // ---------------------------
    const confirmDelete = async () => {
        if (!deleteDialog) return;

        if (deleteDialog.type === 'single') {
            await handleDeletePrompt(deleteDialog.agent, deleteDialog.id);
        } else if (deleteDialog.type === 'selected') {
            await handleDeleteSelected();
        } else if (deleteDialog.type === 'category') {
            await handleDeleteAllFromCategory(deleteDialog.agent);
        }

        setDeleteDialog(null);
    };

    // ---------------------------
    // Import repo with smooth experience
    // ---------------------------
    const handleImportRepo = async (repo) => {
        // Start import with initial state
        setImportingRepo({
            repo,
            progress: 0,
            status: 'Initializing...'
        })

        try {
            // Step 1: Initialize (artificial delay for UX)
            await new Promise(resolve => setTimeout(resolve, 300))
            setImportingRepo(prev => ({
                ...prev,
                progress: 15,
                status: 'Connecting to repository...'
            }))

            // Step 2: Parse repo info
            await new Promise(resolve => setTimeout(resolve, 200))
            const [owner, repoName] = repo.full_name.split("/")
            setImportingRepo(prev => ({
                ...prev,
                progress: 30,
                status: 'Fetching repository structure...'
            }))

            // Step 3: Fetch tree structure
            const structure = await fetchRepoTree(owner, repoName, repo.provider)
            setImportingRepo(prev => ({
                ...prev,
                progress: 70,
                status: 'Processing files...'
            }))

            // Step 4: Set up project
            await new Promise(resolve => setTimeout(resolve, 300))
            setProjectStructure(structure)
            setCurrentRepo({ owner, repo: repoName, provider: repo.provider })
            setViewMode("project")
            setImportingRepo(prev => ({
                ...prev,
                progress: 90,
                status: 'Finalizing...'
            }))

            // Step 5: Complete
            await new Promise(resolve => setTimeout(resolve, 300))
            setImportingRepo(prev => ({
                ...prev,
                progress: 100,
                status: 'Complete!'
            }))

            // Brief pause to show completion
            await new Promise(resolve => setTimeout(resolve, 500))

            toast.success(`Repository "${repo.full_name}" imported successfully!`)
            setImportingRepo(null)
            router.push("/dashboard?active=Code%20input")
        } catch (err) {
            setImportingRepo(prev => ({
                ...prev,
                progress: 0,
                status: 'Failed'
            }))
            await new Promise(resolve => setTimeout(resolve, 500))
            setImportingRepo(null)
            toast.error("Failed to import repository: " + err.message)
        }
    }

    // ---------------------------
    // Unload/Clear project
    // ---------------------------
    const handleUnloadProject = () => {
        clearProject()
        toast.success("Project unloaded successfully!")
    }


    // ---------------------------
    // Helper function to truncate prompt text
    // ---------------------------
    const truncateText = (text, maxLength = 50) => {
        if (!text) return "";
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + "...";
    };

    // ---------------------------
    // UI
    // ---------------------------
    return (
        <div className="flex flex-1 flex-col gap-2 p-2 sm:p-3 pt-0 overflow-hidden h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 h-full min-h-0">
                {/* GitHub Card */}
                <Card className="flex flex-col min-h-0 overflow-hidden">
                    <CardHeader className="py-2 px-3 sm:py-3 sm:px-4 flex-shrink-0">
                        {isGithubConnected && (
                            <div className="flex items-center gap-1 mb-1">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs text-green-600">Connected</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                                <Github className="h-4 w-4" />
                                GitHub Repositories
                            </CardTitle>
                            {isGithubConnected && (
                                <div className="flex gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2"
                                        onClick={handleRefreshRepos}
                                        disabled={isRefreshingRepos}
                                        title="Refresh repositories"
                                    >
                                        {isRefreshingRepos ? (
                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-3 w-3" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={handleDisconnectGitHub}
                                        title="Disconnect from GitHub"
                                    >
                                        Disconnect
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 min-h-0 overflow-hidden py-2 px-3 sm:px-4">
                        {status === "loading" ? (
                            <p className="text-xs text-muted-foreground">Loading...</p>
                        ) : !isGithubConnected ? (
                            <div className="space-y-2 p-2 border rounded-md bg-muted/20">
                                <p className="text-xs text-muted-foreground">
                                    Connect to GitHub to import repositories.
                                </p>

                                <Button onClick={() => { signIn("github", { callbackUrl: "/dashboard" }); }}>
                                    <Github className="h-4 w-4 mr-2" />
                                    Connect GitHub
                                </Button>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col min-h-0">
                                <p className="text-xs text-muted-foreground mb-2 flex-shrink-0">
                                    Select a repository to import for analysis.
                                </p>

                                {isLoadingRepos ? (
                                    <div className="flex flex-col gap-2">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center justify-between gap-2 p-2 border rounded-lg animate-pulse">
                                                <div className="flex-1 min-w-0 space-y-2">
                                                    <div className="h-3 bg-muted rounded w-3/4"></div>
                                                    <div className="h-2 bg-muted/60 rounded w-1/2"></div>
                                                </div>
                                                <div className="h-7 w-14 bg-muted rounded"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : repos.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                        <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                                            <Github className="h-4 w-4 text-muted-foreground/50" />
                                        </div>
                                        <p className="text-xs text-muted-foreground">No repositories found</p>
                                    </div>
                                ) : (
                                    <ScrollArea className="flex-1 min-h-0">
                                        <div className="space-y-1.5 pr-2">
                                            {repos.map((repo, index) => {
                                                const isImporting = importingRepo?.repo?.id === repo.id;
                                                return (
                                                <div
                                                    key={repo.id}
                                                    className={`flex items-center justify-between gap-2 p-2 border border-border/50 rounded-lg transition-all duration-200 animate-fadeIn ${
                                                        isImporting 
                                                            ? 'bg-primary/5 border-primary/30' 
                                                            : 'hover:bg-accent/5 hover:border-border'
                                                    }`}
                                                    style={{
                                                        animationDelay: `${index * 50}ms`,
                                                    }}
                                                >
                                                    <div className="flex-1 min-w-0 overflow-hidden">
                                                        <p className="font-medium text-xs sm:text-sm truncate text-foreground/90">{repo.full_name}</p>
                                                        <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
                                                            {repo.shortDescription || "No description"}
                                                        </p>
                                                    </div>

                                                    <Button
                                                        size="sm"
                                                        className="h-7 px-3 text-xs flex-shrink-0 ml-1 min-w-[70px]"
                                                        onClick={() => handleImportRepo(repo)}
                                                        disabled={importingRepo !== null}
                                                    >
                                                        {isImporting ? (
                                                            <>
                                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                                {importingRepo.progress}%
                                                            </>
                                                        ) : (
                                                            'Import'
                                                        )}
                                                    </Button>
                                                </div>
                                            )})}
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Prompts Card */}
                <Card className="flex flex-col min-h-0 overflow-hidden">
                    <CardHeader className="py-2 px-3 sm:py-3 sm:px-4 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm sm:text-base">AI Agent Prompts</CardTitle>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={handleRefreshPrompts}
                                    disabled={isRefreshingPrompts}
                                    title="Refresh prompts"
                                >
                                    {isRefreshingPrompts ? (
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-3 w-3" />
                                    )}
                                </Button>
                                {selectedPrompts.size > 0 && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => setDeleteDialog({ type: 'selected', count: selectedPrompts.size })}
                                    >
                                        Delete ({selectedPrompts.size})
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 min-h-0 overflow-hidden py-2 px-3 sm:px-4">
                        <Tabs value={currentAgent} onValueChange={setCurrentAgent} className="h-full flex flex-col">
                            <TabsList className="grid w-full grid-cols-4 h-8 flex-shrink-0">
                                {agents.map((agent) => (
                                    <TabsTrigger key={agent} value={agent} className="capitalize text-[10px] sm:text-xs px-1">
                                        {agent}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {agents.map((agent) => (
                                <TabsContent key={agent} value={agent} className="flex-1 overflow-hidden mt-2 flex flex-col min-h-0">
                                    <div className="flex justify-between items-center gap-1 mb-2 flex-shrink-0">
                                        <Button size="sm" variant="destructive" className="h-7 px-2 text-[10px]" onClick={() => setDeleteDialog({ type: 'category', agent })}>
                                            Delete All
                                        </Button>

                                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button size="sm" className="h-7 px-2.5 text-[10px] gap-1">
                                                    <Plus className="h-3 w-3" />
                                                    Add
                                                </Button>
                                            </DialogTrigger>

                                            <DialogContent className="max-w-lg border-border/50">
                                                <DialogHeader className="pb-4 border-b border-border/30">
                                                    <DialogTitle className="text-base font-semibold tracking-tight">New Prompt</DialogTitle>
                                                    <DialogDescription className="text-xs text-muted-foreground/70">
                                                        Create a prompt for the {agent} agent
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-medium text-foreground/80">Title</Label>
                                                        <Input
                                                            value={newTitle}
                                                            onChange={(e) => setNewTitle(e.target.value)}
                                                            placeholder="Enter prompt title..."
                                                            className="h-9 text-sm border-border/50 focus:border-primary/50"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-medium text-foreground/80">Prompt Content</Label>
                                                        <Textarea
                                                            placeholder="Enter your prompt here..."
                                                            value={newPrompt}
                                                            onChange={(e) => setNewPrompt(e.target.value)}
                                                            rows={6}
                                                            className="text-sm resize-none border-border/50 focus:border-primary/50"
                                                        />
                                                    </div>
                                                </div>

                                                <DialogFooter className="pt-4 border-t border-border/30">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8"
                                                        onClick={() => setIsDialogOpen(false)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="h-8"
                                                        onClick={handleAddPrompt}
                                                    >
                                                        Create Prompt
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    <ScrollArea className="flex-1 min-h-0">
                                        {(!prompts[agent] || prompts[agent].length === 0) ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                                                    <Plus className="h-5 w-5 text-muted-foreground/50" />
                                                </div>
                                                <p className="text-xs text-muted-foreground">No prompts yet</p>
                                                <p className="text-[10px] text-muted-foreground/60">Click &ldquo;Add&rdquo; to create one</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5 pr-2">
                                                {prompts[agent].map((prompt, index) => (
                                                    <div
                                                        key={prompt.id}
                                                        className="group border border-border/50 rounded-lg p-2.5 hover:bg-accent/5 hover:border-border transition-all duration-200 cursor-pointer"
                                                        style={{ animationDelay: `${index * 50}ms` }}
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                                <Checkbox
                                                                    className="h-3.5 w-3.5 rounded-sm border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                                    checked={selectedPrompts.has(`${agent}-${prompt.id}`)}
                                                                    onCheckedChange={(checked) => {
                                                                        setSelectedPrompts(prev => {
                                                                            const newSet = new Set(prev);
                                                                            if (checked) {
                                                                                newSet.add(`${agent}-${prompt.id}`);
                                                                            } else {
                                                                                newSet.delete(`${agent}-${prompt.id}`);
                                                                            }
                                                                            return newSet;
                                                                        });
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                                <div className="flex-1 min-w-0" onClick={() => setViewFullTextPrompt(prompt)}>
                                                                    <h4 className="font-medium text-xs truncate text-foreground/90">{prompt.title || "Untitled"}</h4>
                                                                    <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">{truncateText(prompt.text, 35)}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 p-0 hover:bg-accent"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        setViewFullTextPrompt(prompt)
                                                                    }}
                                                                >
                                                                    <Eye className="h-3 w-3 text-muted-foreground" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 p-0 hover:bg-accent"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        openEditDialog(agent, prompt)
                                                                    }}
                                                                >
                                                                    <Edit className="h-3 w-3 text-muted-foreground" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        setDeleteDialog({ type: 'single', agent, id: prompt.id })
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>

                {/* GitLab Card */}
                <Card className="flex flex-col min-h-0 overflow-hidden">
                    <CardHeader className="py-2 px-3 sm:py-3 sm:px-4 flex-shrink-0">
                        {isGitlabConnected && (
                            <div className="flex items-center gap-1 mb-1">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs text-green-600">Connected</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                                <GitlabIcon className="h-4 w-4" />
                                GitLab Repositories
                            </CardTitle>
                            {isGitlabConnected && (
                                <div className="flex gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2"
                                        onClick={handleRefreshGitlabRepos}
                                        disabled={isRefreshingGitlabRepos}
                                        title="Refresh repositories"
                                    >
                                        {isRefreshingGitlabRepos ? (
                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-3 w-3" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={handleDisconnectGitlab}
                                        title="Disconnect from GitLab"
                                    >
                                        Disconnect
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 min-h-0 overflow-hidden py-2 px-3 sm:px-4">
                        {status === "loading" ? (
                            <p className="text-xs text-muted-foreground">Loading...</p>
                        ) : status === "unauthenticated" ? (
                            <p className="text-xs text-muted-foreground">Please sign in to connect GitLab.</p>
                        ) : !isGitlabConnected ? (
                            <div className="space-y-2 p-2 border rounded-md bg-muted/20">
                                <p className="text-xs text-muted-foreground">
                                    Connect to GitLab to import repositories.
                                </p>

                                <Button size="sm" className="h-8" onClick={() => { signIn("gitlab", { callbackUrl: "/dashboard" }); }}>
                                    <GitlabIcon className="h-3 w-3 mr-2" />
                                    Connect GitLab
                                </Button>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col min-h-0">
                                <p className="text-xs text-muted-foreground mb-2 flex-shrink-0">
                                    Select a repository to import for analysis.
                                </p>

                                {isLoadingGitlabRepos ? (
                                    <div className="flex flex-col gap-2">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center justify-between gap-2 p-2 border rounded-lg animate-pulse">
                                                <div className="flex-1 min-w-0 space-y-2">
                                                    <div className="h-3 bg-muted rounded w-3/4"></div>
                                                    <div className="h-2 bg-muted/60 rounded w-1/2"></div>
                                                </div>
                                                <div className="h-7 w-14 bg-muted rounded"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : gitlabRepos.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                        <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                                            <GitlabIcon className="h-4 w-4 text-muted-foreground/50" />
                                        </div>
                                        <p className="text-xs text-muted-foreground">No repositories found</p>
                                    </div>
                                ) : (
                                    <ScrollArea className="flex-1 min-h-0">
                                        <div className="space-y-1.5 pr-2">
                                            {gitlabRepos.map((repo, index) => {
                                                const isImporting = importingRepo?.repo?.id === repo.id;
                                                return (
                                                <div
                                                    key={repo.id}
                                                    className={`flex items-center justify-between gap-2 p-2 border border-border/50 rounded-lg transition-all duration-200 animate-fadeIn ${
                                                        isImporting 
                                                            ? 'bg-primary/5 border-primary/30' 
                                                            : 'hover:bg-accent/5 hover:border-border'
                                                    }`}
                                                    style={{
                                                        animationDelay: `${index * 50}ms`,
                                                    }}
                                                >
                                                    <div className="flex-1 min-w-0 overflow-hidden">
                                                        <p className="font-medium text-xs sm:text-sm truncate text-foreground/90">{repo.full_name}</p>
                                                        <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
                                                            {repo.shortDescription || "No description"}
                                                        </p>
                                                    </div>

                                                    <Button
                                                        size="sm"
                                                        className="h-7 px-3 text-xs flex-shrink-0 ml-1 min-w-[70px]"
                                                        onClick={() => handleImportRepo(repo)}
                                                        disabled={importingRepo !== null}
                                                    >
                                                        {isImporting ? (
                                                            <>
                                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                                {importingRepo.progress}%
                                                            </>
                                                        ) : (
                                                            'Import'
                                                        )}
                                                    </Button>
                                                </div>
                                            )})}
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Current Project Card */}
                <Card className="flex flex-col min-h-0 overflow-hidden">
                    <CardHeader className="py-2 px-3 sm:py-3 sm:px-4 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                                <FolderOpen className="h-4 w-4" />
                                Current Project
                            </CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 min-h-0 overflow-hidden py-2 px-3 sm:px-4">
                        {currentRepo ? (
                            <div className="h-full flex flex-col">
                                <div className="flex-1">
                                    <div className="p-3 border rounded-lg bg-muted/20 mb-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            {currentRepo.provider === 'gitlab' ? (
                                                <GitlabIcon className="h-4 w-4" />
                                            ) : (
                                                <Github className="h-4 w-4" />
                                            )}
                                            <span className="text-xs font-medium uppercase text-muted-foreground">
                                                {currentRepo.provider || 'github'}
                                            </span>
                                        </div>
                                        <p className="font-medium text-sm">{currentRepo.owner}/{currentRepo.repo}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Currently loaded project</p>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-8"
                                        onClick={() => router.push("/dashboard?active=Code%20input")}
                                    >
                                        <FolderOpen className="h-3 w-3 mr-2" />
                                        Open in Editor
                                    </Button>
                                </div>

                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full h-8 mt-3"
                                    onClick={handleUnloadProject}
                                >
                                    <FolderX className="h-3 w-3 mr-2" />
                                    Unload Project
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center h-full">
                                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                                    <FolderX className="h-5 w-5 text-muted-foreground/50" />
                                </div>
                                <p className="text-xs text-muted-foreground">No project loaded</p>
                                <p className="text-[10px] text-muted-foreground/60">Import a repository to get started</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Full Text Dialog */}
            <Dialog open={!!viewFullTextPrompt} onOpenChange={() => setViewFullTextPrompt(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] border-border/50">
                    <DialogHeader className="pb-4 border-b border-border/30">
                        <DialogTitle className="text-base font-semibold tracking-tight">
                            {viewFullTextPrompt?.title || "Untitled Prompt"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground/70">
                            Full prompt content
                        </DialogDescription>
                    </DialogHeader>
                    {viewFullTextPrompt && (
                        <div className="py-4">
                            <div className="rounded-lg bg-muted/30 border border-border/30 p-4">
                                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed max-h-80 overflow-y-auto text-foreground/80">
                                    {viewFullTextPrompt.text}
                                </pre>
                            </div>
                            <p className="text-[10px] text-muted-foreground/50 mt-3 text-right">
                                {viewFullTextPrompt.text.length} characters
                            </p>
                        </div>
                    )}
                    <DialogFooter className="pt-4 border-t border-border/30">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => setViewFullTextPrompt(null)}
                        >
                            Close
                        </Button>
                        <Button
                            size="sm"
                            className="h-8"
                            onClick={() => {
                                if (viewFullTextPrompt) {
                                    openEditDialog(currentAgent, viewFullTextPrompt)
                                    setViewFullTextPrompt(null)
                                }
                            }}
                        >
                            <Edit className="h-3 w-3 mr-1.5" />
                            Edit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Prompt Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={(open) => {
                setEditDialogOpen(open)
                if (!open) setEditingPromptData(null)
            }}>
                <DialogContent className="max-w-lg border-border/50">
                    <DialogHeader className="pb-4 border-b border-border/30">
                        <DialogTitle className="text-base font-semibold tracking-tight">Edit Prompt</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground/70">
                            Modify the prompt for the {editingPromptData?.agent} agent
                        </DialogDescription>
                    </DialogHeader>

                    {editingPromptData && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-foreground/80">Title</Label>
                                <Input
                                    value={editingPromptData.title}
                                    onChange={(e) => setEditingPromptData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Enter prompt title..."
                                    className="h-9 text-sm border-border/50 focus:border-primary/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-foreground/80">Prompt Content</Label>
                                <Textarea
                                    value={editingPromptData.text}
                                    onChange={(e) => setEditingPromptData(prev => ({ ...prev, text: e.target.value }))}
                                    placeholder="Enter your prompt here..."
                                    rows={6}
                                    className="text-sm resize-none border-border/50 focus:border-primary/50"
                                />
                                <p className="text-[10px] text-muted-foreground/50 text-right">
                                    {editingPromptData.text?.length || 0} characters
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="pt-4 border-t border-border/30">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => {
                                setEditDialogOpen(false)
                                setEditingPromptData(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="h-8"
                            onClick={() => {
                                if (editingPromptData) {
                                    handleEditPrompt(
                                        editingPromptData.agent,
                                        editingPromptData.id,
                                        editingPromptData.title,
                                        editingPromptData.text
                                    )
                                }
                            }}
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
                <DialogContent className="max-w-sm border-border/50">
                    <DialogHeader className="pb-4">
                        <div className="mx-auto w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                        </div>
                        <DialogTitle className="text-center text-base">Confirm Deletion</DialogTitle>
                        <DialogDescription className="text-center text-xs text-muted-foreground/70">
                            {deleteDialog?.type === 'single' && "This prompt will be permanently deleted."}
                            {deleteDialog?.type === 'selected' && `${deleteDialog.count || 0} prompt(s) will be permanently deleted.`}
                            {deleteDialog?.type === 'category' && `All prompts from "${deleteDialog.agent}" will be permanently deleted.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9"
                            onClick={() => setDeleteDialog(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1 h-9"
                            onClick={confirmDelete}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Import Progress Dialog */}
            <Dialog open={importingRepo !== null} onOpenChange={() => {}}>
                <DialogContent className="sm:max-w-md" showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {importingRepo?.progress === 100 ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                                <GitBranch className="h-5 w-5 text-primary" />
                            )}
                            Importing Repository
                        </DialogTitle>
                        <DialogDescription>
                            {importingRepo?.repo?.full_name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Progress bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{importingRepo?.status}</span>
                                <span className="font-medium">{importingRepo?.progress}%</span>
                            </div>
                            <Progress
                                value={importingRepo?.progress || 0}
                                className="h-2 transition-all duration-300"
                            />
                        </div>

                        {/* Steps indicator */}
                        <div className="space-y-2">
                            {[
                                { threshold: 15, label: 'Connecting to repository' },
                                { threshold: 30, label: 'Fetching structure' },
                                { threshold: 70, label: 'Processing files' },
                                { threshold: 90, label: 'Setting up project' },
                                { threshold: 100, label: 'Complete' },
                            ].map((step, i) => {
                                const progress = importingRepo?.progress || 0;
                                const isComplete = progress >= step.threshold;
                                const isActive = progress > (i === 0 ? 0 : [15, 30, 70, 90, 100][i - 1]) && progress < step.threshold;

                                return (
                                    <div
                                        key={step.label}
                                        className={`flex items-center gap-2 text-xs transition-all duration-200 ${
                                            isComplete 
                                                ? 'text-green-600 dark:text-green-400' 
                                                : isActive 
                                                    ? 'text-primary font-medium' 
                                                    : 'text-muted-foreground/50'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-200 ${
                                            isComplete 
                                                ? 'bg-green-500 border-green-500' 
                                                : isActive 
                                                    ? 'border-primary bg-primary/10' 
                                                    : 'border-muted-foreground/30'
                                        }`}>
                                            {isComplete ? (
                                                <CheckCircle2 className="h-3 w-3 text-white" />
                                            ) : isActive ? (
                                                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                                            )}
                                        </div>
                                        <span>{step.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
