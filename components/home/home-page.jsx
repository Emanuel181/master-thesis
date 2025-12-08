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
import { Plus, Edit, Trash2, Github, Eye, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useSession, signIn } from "next-auth/react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useProject } from "@/contexts/projectContext"
import { usePrompts } from "@/contexts/promptsContext"
import { useRouter } from "next/navigation"
import { fetchRepoTree } from "@/lib/github-api"

const agents = ["reviewer", "implementation", "tester", "report"]

export function HomePage() {
    const { status } = useSession()
    const { setProjectStructure, setViewMode, setCurrentRepo } = useProject()
    const router = useRouter()

    const {
        prompts,
        addPrompt: addPromptContext,
        editPrompt: editPromptContext,
        deletePrompt: deletePromptContext,
        refresh: refreshPrompts,
    } = usePrompts()

    const [newPrompt, setNewPrompt] = useState("")
    const [editingPrompt, setEditingPrompt] = useState(null)
    const [editingText, setEditingText] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [currentAgent, setCurrentAgent] = useState("reviewer")
    const [currentPage, setCurrentPage] = useState({})
    const [viewFullTextPrompt, setViewFullTextPrompt] = useState(null)

    const [repos, setRepos] = useState([])
    const [isLoadingRepos, setIsLoadingRepos] = useState(false)
    const [isGithubConnected, setIsGithubConnected] = useState(false)
    const [isRefreshingRepos, setIsRefreshingRepos] = useState(false)
    const [isRefreshingPrompts, setIsRefreshingPrompts] = useState(false)

    // prevents React 18 dev-mode double-fetch
    const fetchOnceRef = useRef(false)

    // ---------------------------
    // Load GitHub state from localStorage
    // ---------------------------
    useEffect(() => {
        if (typeof window === "undefined") return

        const savedRepos = localStorage.getItem("githubRepos")
        const savedConnected = localStorage.getItem("isGithubConnected")

        if (savedRepos) setRepos(JSON.parse(savedRepos))
        if (savedConnected === "true") setIsGithubConnected(true)
    }, [])

    // ---------------------------
    // Fetch repos only once
    // ---------------------------
    const fetchRepos = async (allowRefresh = false) => {
        if (!allowRefresh && fetchOnceRef.current) return
        if (allowRefresh) fetchOnceRef.current = false // Allow refresh

        setIsLoadingRepos(true)
        try {
            const response = await fetch("/api/github/repos")
            if (response.ok) {
                const data = await response.json()
                setRepos(data)
                setIsGithubConnected(true)

                localStorage.setItem("githubRepos", JSON.stringify(data))
                localStorage.setItem("isGithubConnected", "true")
            } else {
                setIsGithubConnected(false)
                localStorage.setItem("isGithubConnected", "false")
            }
        } catch (err) {
            console.error("Error fetching repos:", err)
            setIsGithubConnected(false)
            localStorage.setItem("isGithubConnected", "false")
        } finally {
            setIsLoadingRepos(false)
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

    const handleRefreshPrompts = async () => {
        setIsRefreshingPrompts(true)
        await refreshPrompts()
        setIsRefreshingPrompts(false)
        toast.success("Prompts refreshed!")
    }

    // ---------------------------
    // Only fetch if authenticated AND repos not loaded
    // ---------------------------
    useEffect(() => {
        if (status === "authenticated" && repos.length === 0 && !isGithubConnected) {
            fetchRepos()
        }
    }, [status, repos.length, isGithubConnected])

    // ---------------------------
    // Prompt CRUD handlers
    // ---------------------------
    const handleAddPrompt = async () => {
        if (!newPrompt.trim()) {
            toast.error("Please enter a prompt")
            return
        }

        const result = await addPromptContext(currentAgent, newPrompt.trim());
        if (result.success) {
            setNewPrompt("")
            setIsDialogOpen(false)
            toast.success("Prompt added successfully!")
        } else {
            toast.error(result.error || "Failed to add prompt")
        }
    }

    const handleEditPrompt = async (agent, id, newText) => {
        const trimmed = newText.trim()
        if (!trimmed) return toast.error("Prompt cannot be empty")

        const result = await editPromptContext(agent, id, trimmed);
        if (result.success) {
            setEditingPrompt(null)
            toast.success("Prompt updated successfully!")
        } else {
            toast.error(result.error || "Failed to update prompt")
        }
    }

    const handleDeletePrompt = async (agent, id) => {
        const result = await deletePromptContext(agent, id);
        if (result.success) {
            toast.success("Prompt deleted successfully!")
        } else {
            toast.error(result.error || "Failed to delete prompt")
        }
    }

    // ---------------------------
    // Import repo
    // ---------------------------
    const handleImportRepo = async (repo) => {
        try {
            const [owner, repoName] = repo.full_name.split("/")
            const structure = await fetchRepoTree(owner, repoName)

            setProjectStructure(structure)
            setCurrentRepo({ owner, repo: repoName })
            setViewMode("project")

            toast.success(`Repository ${repo.full_name} imported successfully!`)
            router.push("/dashboard?active=Code%20input")
        } catch (err) {
            toast.error("Failed to import repository: " + err.message)
        }
    }

    // ---------------------------
    // UI
    // ---------------------------
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex gap-4">
                {/* GitHub Card */}
                <Card className="flex-1 -ml-4">
                    <CardHeader>
                        {isGithubConnected && (
                            <div className="flex items-center gap-1 mb-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm text-green-600">Connected</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Github className="h-5 w-5" />
                                GitHub Repositories
                            </CardTitle>
                            {isGithubConnected && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRefreshRepos}
                                    disabled={isRefreshingRepos}
                                    title="Refresh repositories"
                                >
                                    {isRefreshingRepos ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4" />
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {status === "loading" ? (
                            <p className="text-sm text-muted-foreground">Loading...</p>
                        ) : !isGithubConnected ? (
                            <div className="space-y-4 p-3 border rounded-md bg-muted/20">
                                <p className="text-sm text-muted-foreground">
                                    GitHub integration is disabled because your account is not linked with GitHub.
                                </p>

                                <Button className="w-full" onClick={() => signIn("github")}>
                                    <Github className="h-4 w-4 mr-2" />
                                    Connect GitHub
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Select a repository to import for analysis.
                                </p>

                                {isLoadingRepos ? (
                                    <p className="text-sm text-muted-foreground">Loading repositories...</p>
                                ) : repos.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No repositories found.</p>
                                ) : (
                                    <ScrollArea className="h-64">
                                        <div className="space-y-2">
                                            {repos.map((repo) => (
                                                <div
                                                    key={repo.id}
                                                    className="flex items-center justify-between p-3 border rounded-lg"
                                                >
                                                    <div className="flex-1">
                                                        <p className="font-medium">{repo.full_name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {repo.description || "No description"}
                                                        </p>
                                                    </div>

                                                    <Button size="sm" onClick={() => handleImportRepo(repo)}>
                                                        Import
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Prompts Card — unchanged except logic cleanup */}
                <Card className="flex-1 -mr-4">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>AI Agent Prompts</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefreshPrompts}
                                disabled={isRefreshingPrompts}
                                title="Refresh prompts"
                            >
                                {isRefreshingPrompts ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <Tabs value={currentAgent} onValueChange={setCurrentAgent}>
                            <TabsList className="grid w-full grid-cols-4">
                                {agents.map((agent) => (
                                    <TabsTrigger key={agent} value={agent} className="capitalize">
                                        {agent}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {agents.map((agent) => (
                                <TabsContent key={agent} value={agent} className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-medium capitalize">{agent} Prompts</h3>

                                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button size="sm">
                                                    <Plus className="h-4 w-4 mr-2" /> Add Prompt
                                                </Button>
                                            </DialogTrigger>

                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Add New Prompt</DialogTitle>
                                                    <DialogDescription>
                                                        Create a new prompt for the {agent} agent.
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <Textarea
                                                    placeholder="Enter your prompt here..."
                                                    value={newPrompt}
                                                    onChange={(e) => setNewPrompt(e.target.value)}
                                                    rows={4}
                                                />

                                                <DialogFooter>
                                                    <Button onClick={handleAddPrompt}>Add Prompt</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    <div className="space-y-4">
                                        {(!prompts[agent] || prompts[agent].length === 0) ? (
                                            <p className="text-sm text-muted-foreground">No prompts saved yet.</p>
                                        ) : (
                                            <>
                                                {(() => {
                                                    const page = currentPage[agent] || 0;
                                                    const promptsPerPage = 3;
                                                    const startIndex = page * promptsPerPage;
                                                    const endIndex = startIndex + promptsPerPage;
                                                    const visiblePrompts = prompts[agent].slice(startIndex, endIndex);
                                                    const totalPages = Math.ceil(prompts[agent].length / promptsPerPage);

                                                    return (
                                                        <>
                                                            <div className="space-y-2">
                                                                {visiblePrompts.map((prompt) => (
                                                                    <div key={prompt.id} className="border rounded-lg p-3">
                                                                        {editingPrompt === prompt.id ? (
                                                                            <div className="space-y-2">
                                                                                <Textarea
                                                                                    value={editingText}
                                                                                    onChange={(e) => setEditingText(e.target.value)}
                                                                                    rows={3}
                                                                                />
                                                                                <div className="flex gap-2">
                                                                                    <Button
                                                                                        size="sm"
                                                                                        onClick={() =>
                                                                                            handleEditPrompt(agent, prompt.id, editingText)
                                                                                        }
                                                                                    >
                                                                                        Save
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        onClick={() => setEditingPrompt(null)}
                                                                                    >
                                                                                        Cancel
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center justify-between">
                                                                                <p className="text-sm flex-1 mr-4 truncate">{prompt.text}</p>
                                                                                <div className="flex gap-2">
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        onClick={() => setViewFullTextPrompt(prompt)}
                                                                                    >
                                                                                        <Eye className="h-4 w-4" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        onClick={() => {
                                                                                            setEditingPrompt(prompt.id)
                                                                                            setEditingText(prompt.text)
                                                                                        }}
                                                                                    >
                                                                                        <Edit className="h-4 w-4" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        onClick={() => handleDeletePrompt(agent, prompt.id)}
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {totalPages > 1 && (
                                                                <div className="flex justify-between items-center mt-4">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => setCurrentPage(prev => ({ ...prev, [agent]: (prev[agent] || 0) - 1 }))}
                                                                        disabled={page === 0}
                                                                    >
                                                                        Previous
                                                                    </Button>
                                                                    <span className="text-sm">
                                                                        Page {page + 1} of {totalPages}
                                                                    </span>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => setCurrentPage(prev => ({ ...prev, [agent]: (prev[agent] || 0) + 1 }))}
                                                                        disabled={page >= totalPages - 1}
                                                                    >
                                                                        Next
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </>
                                        )}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            {/* Full Text Dialog */}
            <Dialog open={!!viewFullTextPrompt} onOpenChange={() => setViewFullTextPrompt(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Full Prompt Text</DialogTitle>
                        <DialogDescription>
                            Complete text of the selected prompt.
                        </DialogDescription>
                    </DialogHeader>
                    {viewFullTextPrompt && (
                        <Textarea
                            value={viewFullTextPrompt.text}
                            readOnly
                            rows={10}
                            className="resize-none"
                        />
                    )}
                    <DialogFooter>
                        <Button onClick={() => setViewFullTextPrompt(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
