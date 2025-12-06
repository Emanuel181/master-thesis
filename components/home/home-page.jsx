"use client"

import React, { useState, useEffect } from "react"
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
import { Plus, Edit, Trash2, Github } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { ScrollArea } from "@/components/ui/scroll-area"

const agents = ["reviewer", "implementation", "tester", "report"]

export function HomePage() {
    const { status } = useSession()

    // ---------------------------
    // PROMPTS STATE
    // ---------------------------
    const [prompts, setPrompts] = useState(() => {
        const initial = {}
        agents.forEach((agent) => {
            initial[agent] = []
        })
        return initial
    })

    // Load saved prompts from localStorage once on mount
    useEffect(() => {
        try {
            if (typeof window === "undefined") return
            const saved = localStorage.getItem("aiPrompts")
            if (!saved) return

            const parsed = JSON.parse(saved)
            const restored = {}

            agents.forEach((agent) => {
                if (Array.isArray(parsed?.[agent])) {
                    restored[agent] = parsed[agent]
                } else {
                    restored[agent] = []
                }
            })

            setPrompts(restored)
        } catch (error) {
            console.error("Error loading prompts from localStorage:", error)
        }
    }, [])

    // ---------------------------
    // OTHER UI STATE
    // ---------------------------
    const [newPrompt, setNewPrompt] = useState("")
    const [editingPrompt, setEditingPrompt] = useState(null)
    const [editingText, setEditingText] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [currentAgent, setCurrentAgent] = useState("reviewer")

    // ---------------------------
    // GITHUB STATE
    // ---------------------------
    const [repos, setRepos] = useState([])
    const [isLoadingRepos, setIsLoadingRepos] = useState(false)
    const [isGithubConnected, setIsGithubConnected] = useState(false)

    // ---------------------------
    // GITHUB FETCH LOGIC
    // ---------------------------
    const fetchRepos = async () => {
        setIsLoadingRepos(true)
        try {
            const response = await fetch("/api/github/repos")
            if (response.ok) {
                const data = await response.json()
                setRepos(data.repos)
                setIsGithubConnected(true)
            } else {
                setIsGithubConnected(false)
            }
        } catch (err) {
            console.error("Error fetching repos:", err)
            setIsGithubConnected(false)
        } finally {
            setIsLoadingRepos(false)
        }
    }

    // Fetch repos when user becomes authenticated
    useEffect(() => {
        if (status !== "authenticated") return
        fetchRepos()
    }, [status])

    // ---------------------------
    // PROMPTS HELPERS
    // ---------------------------
    const handleAddPrompt = () => {
        if (!newPrompt.trim()) {
            toast.error("Please enter a prompt")
            return
        }

        const item = {
            id: Date.now(),
            text: newPrompt.trim(),
        }

        setPrompts((prev) => {
            const next = {
                ...prev,
                [currentAgent]: [...(prev[currentAgent] || []), item],
            }
            if (typeof window !== "undefined") {
                localStorage.setItem("aiPrompts", JSON.stringify(next))
            }
            return next
        })

        setNewPrompt("")
        setIsDialogOpen(false)
        toast.success("Prompt added successfully!")
    }

    const handleEditPrompt = (agent, id, newText) => {
        const trimmed = newText.trim()
        if (!trimmed) {
            toast.error("Prompt cannot be empty")
            return
        }

        setPrompts((prev) => {
            const next = {
                ...prev,
                [agent]: prev[agent].map((p) =>
                    p.id === id ? { ...p, text: trimmed } : p
                ),
            }
            if (typeof window !== "undefined") {
                localStorage.setItem("aiPrompts", JSON.stringify(next))
            }
            return next
        })

        setEditingPrompt(null)
        toast.success("Prompt updated successfully!")
    }

    const handleDeletePrompt = (agent, id) => {
        setPrompts((prev) => {
            const next = {
                ...prev,
                [agent]: prev[agent].filter((p) => p.id !== id),
            }
            if (typeof window !== "undefined") {
                localStorage.setItem("aiPrompts", JSON.stringify(next))
            }
            return next
        })
        toast.success("Prompt deleted successfully!")
    }

    // ---------------------------
    // GITHUB IMPORT PLACEHOLDER
    // ---------------------------
    const handleImportRepo = (repo) => {
        toast.success(`Repository ${repo.full_name} imported successfully!`)
        // TODO: Implement actual repo import logic here
    }

    // ---------------------------
    // RENDER
    // ---------------------------
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="grid md:grid-cols-2 gap-6">
                {/* GitHub Integration Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Github className="h-5 w-5" />
                            GitHub Repositories
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {status === "loading" ? (
                            <p className="text-sm text-muted-foreground">Loading...</p>
                        ) : !isGithubConnected ? (
                            <div className="space-y-4 p-3 border rounded-md bg-muted/20">
                                <p className="text-sm text-muted-foreground">
                                    GitHub integration is disabled because your account is not linked with GitHub.
                                </p>

                                <p className="text-xs text-red-500">
                                    You may have signed in using Google. For security reasons, accounts
                                    using the same email across different providers cannot be linked
                                    automatically unless safe email linking is enabled by the administrator.
                                </p>

                                <Button className="w-full" disabled>
                                    <Github className="h-4 w-4 mr-2" />
                                    Connect GitHub (Disabled)
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Select a repository to import for analysis.
                                </p>

                                {isLoadingRepos ? (
                                    <p className="text-sm text-muted-foreground">
                                        Loading repositories...
                                    </p>
                                ) : repos.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No repositories found.
                                    </p>
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

                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleImportRepo(repo)}
                                                    >
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

                {/* AI Prompts Management */}
                <Card>
                    <CardHeader>
                        <CardTitle>AI Agent Prompts</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <Tabs value={currentAgent} onValueChange={setCurrentAgent}>
                            <TabsList className="grid w-full grid-cols-4">
                                {agents.map((agent) => (
                                    <TabsTrigger
                                        key={agent}
                                        value={agent}
                                        className="capitalize"
                                    >
                                        {agent}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {agents.map((agent) => (
                                <TabsContent
                                    key={agent}
                                    value={agent}
                                    className="space-y-4"
                                >
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-medium capitalize">
                                            {agent} Prompts
                                        </h3>

                                        {/* Add Prompt Dialog */}
                                        <Dialog
                                            open={isDialogOpen}
                                            onOpenChange={setIsDialogOpen}
                                        >
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
                                                    onChange={(e) =>
                                                        setNewPrompt(e.target.value)
                                                    }
                                                    rows={4}
                                                />

                                                <DialogFooter>
                                                    <Button onClick={handleAddPrompt}>
                                                        Add Prompt
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    {/* Prompt List */}
                                    <div className="space-y-2">
                                        {prompts[agent]?.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">
                                                No prompts saved yet.
                                            </p>
                                        ) : (
                                            prompts[agent].map((prompt) => (
                                                <div
                                                    key={prompt.id}
                                                    className="border rounded-lg p-3 space-y-2"
                                                >
                                                    {editingPrompt === prompt.id ? (
                                                        <div className="space-y-2">
                                                            <Textarea
                                                                value={editingText}
                                                                onChange={(e) =>
                                                                    setEditingText(
                                                                        e.target.value
                                                                    )
                                                                }
                                                                rows={3}
                                                            />

                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleEditPrompt(
                                                                            agent,
                                                                            prompt.id,
                                                                            editingText
                                                                        )
                                                                    }
                                                                >
                                                                    Save
                                                                </Button>

                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        setEditingPrompt(
                                                                            null
                                                                        )
                                                                    }
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <p className="text-sm">
                                                                {prompt.text}
                                                            </p>

                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setEditingPrompt(
                                                                            prompt.id
                                                                        )
                                                                        setEditingText(
                                                                            prompt.text
                                                                        )
                                                                    }}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>

                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        handleDeletePrompt(
                                                                            agent,
                                                                            prompt.id
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}