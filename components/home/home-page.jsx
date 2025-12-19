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
import { useSession, signIn, signOut } from "next-auth/react"
import { ScrollArea } from "@/components/ui/scroll-area"
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

    // Selected prompts for bulk delete
    const [selectedPrompts, setSelectedPrompts] = useState(new Set())

    // New title state
    const [newTitle, setNewTitle] = useState("")
    const [editingTitle, setEditingTitle] = useState("")

    // Delete confirmation dialog
    const [deleteDialog, setDeleteDialog] = useState(null) // { type: 'single' | 'selected' | 'category', agent?: string, id?: string }

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
            const data = await response.json()

            if (response.ok) {
                setRepos(data)
                setIsGithubConnected(true)

                localStorage.setItem("githubRepos", JSON.stringify(data))
                localStorage.setItem("isGithubConnected", "true")
            } else {
                console.warn('[home] fetch /api/github/repos failed', data)
                // surface debug info to the user console
                setIsGithubConnected(false)
                localStorage.setItem("isGithubConnected", "false")
                // show server debug message when available
                if (data?.debug?.message) {
                    toast.error(`GitHub: ${data.debug.message}`)
                } else if (data?.error) {
                    toast.error(`GitHub: ${data.error}`)
                } else {
                    toast.error('Failed to fetch GitHub repositories')
                }
                // If unauthorized, sign out to force re-login
                if (response.status === 401) {
                    signOut();
                    toast.error('GitHub token expired or invalid. Please login again.');
                }
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
    // Disconnect GitHub
    // ---------------------------
    const handleDisconnectGitHub = () => {
        signOut()
        setIsGithubConnected(false)
        setRepos([])
        localStorage.removeItem("githubRepos")
        localStorage.setItem("isGithubConnected", "false")
        toast.success("Disconnected from GitHub!")
    }

    // ---------------------------
    // Only fetch if authenticated AND repos not loaded
    // ---------------------------
    useEffect(() => {
        if (status === "authenticated" && session && repos.length === 0) {
            fetchRepos();
        }
    }, [status, session, repos.length]);

    // ---------------------------
    // Clear GitHub state when logged out
    // ---------------------------
    useEffect(() => {
        if (status === "unauthenticated") {
            setIsGithubConnected(false);
            setRepos([]);
            localStorage.removeItem("githubRepos");
            localStorage.setItem("isGithubConnected", "false");
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

    const handleDeleteSelected = async () => {
        if (selectedPrompts.size === 0) return;

        const deletePromises = Array.from(selectedPrompts).map(key => {
            const [agent, id] = key.split('-');
            return deletePromptContext(agent, id);
        });

        const results = await Promise.all(deletePromises);
        const successCount = results.filter(r => r.success).length;

        if (successCount === selectedPrompts.size) {
            toast.success(`${successCount} prompt(s) deleted successfully!`);
        } else {
            toast.error(`Failed to delete some prompts. ${successCount} deleted.`);
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
    // Check if both cards are empty
    // ---------------------------
    const isBothEmpty = !isGithubConnected && Object.values(prompts).every(arr => !arr || arr.length === 0);

    // ---------------------------
    // UI
    // ---------------------------
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className={`flex gap-4 ${isBothEmpty ? '' : 'items-start'}`}>
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
                                <div className="flex gap-2">
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
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDisconnectGitHub}
                                        title="Disconnect from GitHub"
                                    >
                                        Disconnect
                                    </Button>
                                </div>
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
                            <div className="flex gap-2">
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
                                {selectedPrompts.size > 0 && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setDeleteDialog({ type: 'selected', count: selectedPrompts.size })}
                                    >
                                        Delete Selected ({selectedPrompts.size})
                                    </Button>
                                )}
                            </div>
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
                                    <div className="flex justify-end items-center">
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="destructive" onClick={() => setDeleteDialog({ type: 'category', agent })}>
                                                Delete All {agent.charAt(0).toUpperCase() + agent.slice(1)} Prompts
                                            </Button>

                                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button size="sm">
                                                        <Plus className="h-4 w-4 mr-2" /> Add {agent.charAt(0).toUpperCase() + agent.slice(1)} Prompt
                                                    </Button>
                                                </DialogTrigger>

                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Add New Prompt</DialogTitle>
                                                        <DialogDescription>
                                                            Create a new prompt for the {agent} agent.
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label>Title</Label>
                                                            <Input
                                                                value={newTitle}
                                                                onChange={(e) => setNewTitle(e.target.value)}
                                                                placeholder="Enter prompt title..."
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Prompt</Label>
                                                            <Textarea
                                                                placeholder="Enter your prompt here..."
                                                                value={newPrompt}
                                                                onChange={(e) => setNewPrompt(e.target.value)}
                                                                rows={4}
                                                            />
                                                        </div>
                                                    </div>

                                                    <DialogFooter>
                                                        <Button onClick={handleAddPrompt}>Add Prompt</Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
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
                                                                                <Input
                                                                                    value={editingTitle}
                                                                                    onChange={(e) => setEditingTitle(e.target.value)}
                                                                                    placeholder="Title"
                                                                                />
                                                                                <Textarea
                                                                                    value={editingText}
                                                                                    onChange={(e) => setEditingText(e.target.value)}
                                                                                    rows={3}
                                                                                />
                                                                                <div className="flex gap-2">
                                                                                    <Button
                                                                                        size="sm"
                                                                                        onClick={() =>
                                                                                            handleEditPrompt(agent, prompt.id, editingTitle, editingText)
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
                                                                                <div className="flex items-center gap-2">
                                                                                    <Checkbox
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
                                                                                    />
                                                                                    <div className="flex-1 mr-4">
                                                                                        <h4 className="font-medium text-sm">{prompt.title || "Untitled"}</h4>
                                                                                        <p className="text-sm text-muted-foreground truncate">{prompt.text}</p>
                                                                                    </div>
                                                                                </div>
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
                                                                                            setEditingTitle(prompt.title || "")
                                                                                        }}
                                                                                    >
                                                                                        <Edit className="h-4 w-4" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        onClick={() => setDeleteDialog({ type: 'single', agent, id: prompt.id })}
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
                        <DialogTitle>{viewFullTextPrompt?.title || "Untitled Prompt"}</DialogTitle>
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            {deleteDialog?.type === 'single' && "Are you sure you want to delete this prompt? This action cannot be undone."}
                            {deleteDialog?.type === 'selected' && `Are you sure you want to delete the selected ${deleteDialog.count || 0} prompt(s)? This action cannot be undone.`}
                            {deleteDialog?.type === 'category' && `Are you sure you want to delete all prompts from the ${deleteDialog.agent} category? This action cannot be undone.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
