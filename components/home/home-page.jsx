"use client"

import React, { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Github, Eye, RefreshCw, FolderX, FolderOpen, Loader2, CheckCircle2, GitBranch, GripVertical, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { GitlabIcon } from "@/components/icons/gitlab"
import { toast } from "sonner"
import { useSession, signIn } from "next-auth/react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { useProject } from "@/contexts/projectContext"
import { usePrompts } from "@/contexts/promptsContext"
import { useDemo, DEMO_GITHUB_REPOS, DEMO_GITLAB_REPOS, DEMO_PROJECTS } from "@/contexts/demoContext"
import { useRouter } from "next/navigation"
import { fetchRepoTree } from "@/lib/github-api"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PromptCardSkeleton, RepoCardSkeleton } from "@/components/ui/loading-skeletons"
import { NoPromptsEmptyState, NoReposEmptyState } from "@/components/ui/empty-states"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable Prompt Item Component
function SortablePromptItem({ prompt, agent, selectedPrompts, setSelectedPrompts, truncateText, setViewFullTextPrompt, openEditDialog, setDeleteDialog, onMoveUp, onMoveDown, isFirst, isLast }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: prompt.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 200ms ease',
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1000 : 'auto',
        scale: isDragging ? 1.02 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group border border-border/50 rounded-lg p-2.5 hover:bg-accent/10 hover:border-primary/30 hover:shadow-sm transition-colors duration-200 cursor-pointer ${isDragging ? 'shadow-xl bg-background border-primary/50 ring-2 ring-primary/20' : ''}`}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1.5 -ml-1 hover:bg-accent/50 rounded-md touch-none select-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground/60" />
                    </div>
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
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
                    {!isFirst && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-accent"
                            onClick={(e) => {
                                e.stopPropagation()
                                onMoveUp(prompt.id)
                            }}
                            title="Move up"
                        >
                            <ChevronUp className="h-3 w-3 text-muted-foreground" />
                        </Button>
                    )}
                    {!isLast && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-accent"
                            onClick={(e) => {
                                e.stopPropagation()
                                onMoveDown(prompt.id)
                            }}
                            title="Move down"
                        >
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-accent"
                        onClick={(e) => {
                            e.stopPropagation()
                            setViewFullTextPrompt(prompt)
                        }}
                        title="View"
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
                        title="Edit"
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
                        title="Delete"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

const agents = ["reviewer", "implementation", "tester", "report"]

export function HomePage() {
    const { data: session, status } = useSession()
    const { setProjectStructure, setViewMode, setCurrentRepo, currentRepo, clearProject, setProjectUnloaded } = useProject()
    const router = useRouter()
    const pathname = usePathname()
    
    // Demo mode detection
    const isDemoMode = pathname?.startsWith('/demo')
    const { switchDemoProject } = useDemo()

    const {
        prompts,
        addPrompt: addPromptContext,
        editPrompt: editPromptContext,
        deletePrompt: deletePromptContext,
        bulkDeletePrompts,
        reorderPrompts,
        refresh: refreshPrompts,
    } = usePrompts()

    const [newPrompt, setNewPrompt] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [currentAgent, setCurrentAgent] = useState("reviewer")
    const [viewFullTextPrompt, setViewFullTextPrompt] = useState(null)

    // Demo mode localStorage keys (shared with use-provider-connection.js)
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

    const [repos, setRepos] = useState([])
    const [isLoadingRepos, setIsLoadingRepos] = useState(false)
    const [isGithubConnected, setIsGithubConnected] = useState(() => 
        isDemoMode ? getInitialDemoState(DEMO_GITHUB_KEY) : false
    )
    const [isRefreshingRepos, setIsRefreshingRepos] = useState(false)
    const [githubSearchTerm, setGithubSearchTerm] = useState("")

    const [isRefreshingPrompts, setIsRefreshingPrompts] = useState(false)

    // Add GitLab states
    const [gitlabRepos, setGitlabRepos] = useState([])
    const [isLoadingGitlabRepos, setIsLoadingGitlabRepos] = useState(false)
    const [isGitlabConnected, setIsGitlabConnected] = useState(() => 
        isDemoMode ? getInitialDemoState(DEMO_GITLAB_KEY) : false
    )
    const [isRefreshingGitlabRepos, setIsRefreshingGitlabRepos] = useState(false)
    const [gitlabSearchTerm, setGitlabSearchTerm] = useState("")

    // Persist demo connection state to localStorage
    useEffect(() => {
        if (!isDemoMode) return;
        try {
            localStorage.setItem(DEMO_GITHUB_KEY, String(isGithubConnected));
        } catch {}
    }, [isDemoMode, isGithubConnected]);

    useEffect(() => {
        if (!isDemoMode) return;
        try {
            localStorage.setItem(DEMO_GITLAB_KEY, String(isGitlabConnected));
        } catch {}
    }, [isDemoMode, isGitlabConnected]);

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

    // Pagination state for prompts (per agent)
    const [promptPages, setPromptPages] = useState({
        reviewer: 1,
        implementation: 1,
        tester: 1,
        report: 1,
    })
    const PROMPTS_PER_PAGE = 5

    // Pagination state for repositories
    const [githubRepoPage, setGithubRepoPage] = useState(1)
    const [gitlabRepoPage, setGitlabRepoPage] = useState(1)
    const REPOS_PER_PAGE = 4

    // Active dragging prompt for DragOverlay
    const [activeId, setActiveId] = useState(null)
    const [activeDragAgent, setActiveDragAgent] = useState(null)

    // prevents React 18 dev-mode double-fetch - separate refs for each provider
    const githubFetchOnceRef = useRef(false)
    const gitlabFetchOnceRef = useRef(false)

    // ---------------------------
    // DnD Kit sensors for prompt reordering
    // ---------------------------
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event, agent) => {
        setActiveId(event.active.id);
        setActiveDragAgent(agent);
    };

    const handleDragEnd = async (event, agent) => {
        const { active, over } = event;

        setActiveId(null);
        setActiveDragAgent(null);

        if (over && active.id !== over.id) {
            const oldIndex = prompts[agent].findIndex(p => p.id === active.id);
            const newIndex = prompts[agent].findIndex(p => p.id === over.id);

            const newOrder = arrayMove(prompts[agent], oldIndex, newIndex);
            const orderedIds = newOrder.map(p => p.id);

            const result = await reorderPrompts(agent, orderedIds);
            if (!result.success) {
                toast.error("Failed to reorder prompts");
            }
        }
    };

    const handleMoveUp = async (agent, promptId) => {
        const currentPrompts = prompts[agent] || [];
        const currentIndex = currentPrompts.findIndex(p => p.id === promptId);
        if (currentIndex <= 0) return; // Already at top

        const newOrder = arrayMove(currentPrompts, currentIndex, currentIndex - 1);
        const orderedIds = newOrder.map(p => p.id);

        const result = await reorderPrompts(agent, orderedIds);
        if (!result.success) {
            toast.error("Failed to move prompt up");
        }
    };

    const handleMoveDown = async (agent, promptId) => {
        const currentPrompts = prompts[agent] || [];
        const currentIndex = currentPrompts.findIndex(p => p.id === promptId);
        if (currentIndex < 0 || currentIndex === currentPrompts.length - 1) return; // Already at bottom

        const newOrder = arrayMove(currentPrompts, currentIndex, currentIndex + 1);
        const orderedIds = newOrder.map(p => p.id);

        const result = await reorderPrompts(agent, orderedIds);
        if (!result.success) {
            toast.error("Failed to move prompt down");
        }
    };

    // ---------------------------
    // Fetch repos only once
    // ---------------------------
    const fetchRepos = async (allowRefresh = false) => {
        if (!allowRefresh && githubFetchOnceRef.current) return
        if (allowRefresh) githubFetchOnceRef.current = false // Allow refresh

        githubFetchOnceRef.current = true // Mark as fetching/fetched
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
                githubFetchOnceRef.current = false // Reset on failure to allow retry
            }
        } catch (err) {
            console.error("Error fetching repos:", err)
            githubFetchOnceRef.current = false // Reset on error to allow retry
        } finally {
            setIsLoadingRepos(false)
        }
    }

    // ---------------------------
    // Fetch GitLab repos
    // ---------------------------
    const fetchGitlabRepos = async (allowRefresh = false) => {
        if (!allowRefresh && gitlabFetchOnceRef.current) return
        if (allowRefresh) gitlabFetchOnceRef.current = false // Allow refresh

        gitlabFetchOnceRef.current = true // Mark as fetching/fetched
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
                gitlabFetchOnceRef.current = false // Reset on failure to allow retry
            }
        } catch (err) {
            console.error("Error fetching gitlab repos:", err)
            gitlabFetchOnceRef.current = false // Reset on error to allow retry
        } finally {
            setIsLoadingGitlabRepos(false)
        }
    }

    // ---------------------------
    // Refresh handlers
    // ---------------------------
    const handleRefreshRepos = async () => {
        setIsRefreshingRepos(true)
        if (isDemoMode) {
            // Fake refresh for demo mode
            await new Promise(resolve => setTimeout(resolve, 800))
            setRepos([...DEMO_GITHUB_REPOS]) // Trigger re-render
        } else {
            await fetchRepos(true)
        }
        setIsRefreshingRepos(false)
        toast.success("GitHub repositories refreshed!")
    }

    const handleRefreshGitlabRepos = async () => {
        setIsRefreshingGitlabRepos(true)
        if (isDemoMode) {
            // Fake refresh for demo mode
            await new Promise(resolve => setTimeout(resolve, 800))
            setGitlabRepos([...DEMO_GITLAB_REPOS]) // Trigger re-render
        } else {
            await fetchGitlabRepos(true)
        }
        setIsRefreshingGitlabRepos(false)
        toast.success("GitLab repositories refreshed!")
    }

    const handleRefreshPrompts = async () => {
        setIsRefreshingPrompts(true)
        if (isDemoMode) {
            // Fake delay for demo mode, then reset to original prompts
            await new Promise(resolve => setTimeout(resolve, 600))
            await refreshPrompts() // This resets to DEMO_PROMPTS in demo mode
        } else {
            await refreshPrompts()
        }
        setIsRefreshingPrompts(false)
        toast.success("Prompts refreshed successfully!")
    }

    const refreshLinkedProviders = async () => {
        if (isDemoMode) {
            // In demo mode, always show as connected
            return { githubLinked: true, gitlabLinked: true }
        }
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
        // Check if current project is from GitHub
        const isCurrentProjectFromGitHub = currentRepo && currentRepo.provider === 'github';
        
        if (isDemoMode) {
            // Demo mode: clear state locally and clear project if it was from GitHub
            setIsGithubConnected(false);
            setRepos([]);
            if (isCurrentProjectFromGitHub) {
                clearProject();
                toast.success("Disconnected from GitHub! Project unloaded.");
            } else {
                toast.success("Disconnected from GitHub!");
            }
            return;
        }
        try {
            await fetch('/api/auth/disconnect?provider=github', { method: 'POST' });
        } catch (err) {
            console.error('Error disconnecting GitHub:', err);
        }
        setIsGithubConnected(false);
        setRepos([]);
        if (isCurrentProjectFromGitHub) {
            clearProject();
            toast.success("Disconnected from GitHub! Project unloaded.");
        } else {
            toast.success("Disconnected from GitHub!");
        }
        await refreshLinkedProviders()
    }

    const handleDisconnectGitlab = async () => {
        // Check if current project is from GitLab
        const isCurrentProjectFromGitLab = currentRepo && currentRepo.provider === 'gitlab';
        
        if (isDemoMode) {
            // Demo mode: clear state locally and clear project if it was from GitLab
            setIsGitlabConnected(false);
            setGitlabRepos([]);
            if (isCurrentProjectFromGitLab) {
                clearProject();
                toast.success("Disconnected from GitLab! Project unloaded.");
            } else {
                toast.success("Disconnected from GitLab!");
            }
            return;
        }
        try {
            await fetch('/api/auth/disconnect?provider=gitlab', { method: 'POST' });
        } catch (err) {
            console.error('Error disconnecting GitLab:', err);
        }
        setIsGitlabConnected(false);
        setGitlabRepos([]);
        if (isCurrentProjectFromGitLab) {
            clearProject();
            toast.success("Disconnected from GitLab! Project unloaded.");
        } else {
            toast.success("Disconnected from GitLab!");
        }
        await refreshLinkedProviders()
    }

    // ---------------------------
    // Demo mode: Connect handlers (fake sign-in)
    // ---------------------------
    const handleDemoConnectGithub = async () => {
        setIsLoadingRepos(true);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
        setRepos(DEMO_GITHUB_REPOS);
        setIsGithubConnected(true);
        setIsLoadingRepos(false);
        toast.success("Connected to GitHub!");
    }

    const handleDemoConnectGitlab = async () => {
        setIsLoadingGitlabRepos(true);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
        setGitlabRepos(DEMO_GITLAB_REPOS);
        setIsGitlabConnected(true);
        setIsLoadingGitlabRepos(false);
        toast.success("Connected to GitLab!");
    }

    // ---------------------------
    // Demo mode: Load mock repos based on connection state
    // ---------------------------
    useEffect(() => {
        if (isDemoMode) {
            // Load repos for already connected providers (from localStorage)
            if (isGithubConnected) {
                setRepos(DEMO_GITHUB_REPOS);
            }
            if (isGitlabConnected) {
                setGitlabRepos(DEMO_GITLAB_REPOS);
            }
            setIsLoadingRepos(false);
            setIsLoadingGitlabRepos(false);
        }
    }, [isDemoMode, isGithubConnected, isGitlabConnected]);

    // ---------------------------
    // Only fetch if authenticated AND repos not loaded (skip in demo mode)
    // ---------------------------
    useEffect(() => {
        if (isDemoMode) return; // Skip in demo mode
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
    }, [isDemoMode, status, session, session?.user?.id, repos.length, gitlabRepos.length, isGithubConnected, isGitlabConnected]);

    useEffect(() => {
        if (isDemoMode) return; // Skip in demo mode
        if (status !== 'authenticated') return
        const interval = setInterval(() => {
            refreshLinkedProviders()
        }, 30000) // Reduced from 5s to 30s for better performance
        return () => clearInterval(interval)
    }, [isDemoMode, status])


    // ---------------------------
    // Clear GitHub state when logged out (skip in demo mode)
    // ---------------------------
    useEffect(() => {
        if (isDemoMode) return; // Skip in demo mode
        if (status === "unauthenticated") {
            setIsGithubConnected(false);
            setRepos([]);
            setIsGitlabConnected(false);
            setGitlabRepos([]);
        }
    }, [isDemoMode, status]);

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

            // Step 3: Fetch tree structure (use demo data in demo mode)
            let structure;
            if (isDemoMode) {
                // Use demo project structure
                await new Promise(resolve => setTimeout(resolve, 400))
                structure = DEMO_PROJECTS[repo.full_name] || DEMO_PROJECTS["demo-org/vulnerable-express-app"];
                // Also update demo context
                switchDemoProject(repo.full_name);
            } else {
                structure = await fetchRepoTree(owner, repoName, repo.provider)
            }
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
            setProjectUnloaded(false) // Reset unloaded flag when importing a new project
            // Clear any existing code state and editor tabs so the editor starts fresh (mode-specific)
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
            
            // Navigate to code input (use demo route in demo mode)
            if (isDemoMode) {
                router.push("/demo/code-input")
            } else {
                router.push("/dashboard?active=Code%20input")
            }
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
    // Filtered repos for search
    // ---------------------------
    const filteredGithubRepos = repos.filter(repo => {
        if (!githubSearchTerm.trim()) return true;
        const searchLower = githubSearchTerm.toLowerCase();
        return (
            repo.full_name?.toLowerCase().includes(searchLower) ||
            repo.shortDescription?.toLowerCase().includes(searchLower)
        );
    });

    const filteredGitlabRepos = gitlabRepos.filter(repo => {
        if (!gitlabSearchTerm.trim()) return true;
        const searchLower = gitlabSearchTerm.toLowerCase();
        return (
            repo.full_name?.toLowerCase().includes(searchLower) ||
            repo.shortDescription?.toLowerCase().includes(searchLower)
        );
    });

    // Paginated repos
    const githubTotalPages = Math.ceil(filteredGithubRepos.length / REPOS_PER_PAGE);
    const paginatedGithubRepos = filteredGithubRepos.slice(
        (githubRepoPage - 1) * REPOS_PER_PAGE,
        githubRepoPage * REPOS_PER_PAGE
    );

    const gitlabTotalPages = Math.ceil(filteredGitlabRepos.length / REPOS_PER_PAGE);
    const paginatedGitlabRepos = filteredGitlabRepos.slice(
        (gitlabRepoPage - 1) * REPOS_PER_PAGE,
        gitlabRepoPage * REPOS_PER_PAGE
    );

    // Reset page when search changes
    /* eslint-disable react-hooks/exhaustive-deps -- intentional: only reset on search term change */
    useEffect(() => {
        setGithubRepoPage(1);
    }, [githubSearchTerm]);

    useEffect(() => {
        setGitlabRepoPage(1);
    }, [gitlabSearchTerm]);
    /* eslint-enable react-hooks/exhaustive-deps */

    // ---------------------------
    // UI
    // ---------------------------
    return (
        <ScrollArea className="flex-1 h-full">
            <div className="flex flex-col gap-2 p-2 sm:p-3 pt-0 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 auto-rows-min">
                {/* Left Column - GitHub & GitLab */}
                <div className="flex flex-col gap-2 sm:gap-3 min-h-0 order-2 lg:order-1">
                {/* GitHub Card */}
                <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-md min-h-[420px]">
                    <CardHeader className="py-2 px-2.5 sm:py-3 sm:px-4 flex-shrink-0">
                        {isGithubConnected && (
                            <div className="flex items-center gap-1 mb-1">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] sm:text-xs text-green-600">Connected</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base">
                                <Github className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">GitHub Repositories</span>
                            </CardTitle>
                            {isGithubConnected && (
                                <div className="flex gap-1 flex-shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 w-6 sm:h-7 sm:w-7 p-0"
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
                                        className="h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs"
                                        onClick={handleDisconnectGitHub}
                                        title="Disconnect from GitHub"
                                    >
                                        <span className="hidden xs:inline">Disconnect</span>
                                        <span className="xs:hidden">×</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 min-h-0 overflow-hidden pt-2 pb-6 px-2.5 sm:px-4">
                        {status === "loading" && !isDemoMode ? (
                            <p className="text-[10px] sm:text-xs text-muted-foreground">Loading...</p>
                        ) : !isGithubConnected ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-3 sm:p-4">
                                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-muted/30 flex items-center justify-center mb-3 sm:mb-4 border border-border/50">
                                    <Github className="h-5 w-5 sm:h-7 sm:w-7 text-muted-foreground/60" />
                                </div>
                                <h3 className="text-sm font-medium mb-1">Connect GitHub</h3>
                                <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">
                                    Import your repositories for security analysis
                                </p>
                                <Button onClick={() => { isDemoMode ? handleDemoConnectGithub() : signIn("github", { callbackUrl: "/dashboard" }); }} className="gap-2">
                                    <Github className="h-4 w-4" />
                                    Connect GitHub
                                </Button>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col min-h-0">
                                {/* Search input */}
                                <div className="relative mb-2 flex-shrink-0">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                                    <Input
                                        placeholder="Search repositories..."
                                        value={githubSearchTerm}
                                        onChange={(e) => setGithubSearchTerm(e.target.value)}
                                        className="h-8 pl-8 text-xs"
                                    />
                                </div>

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
                                    <div className="h-full flex flex-col items-center justify-center py-8 text-center">
                                        <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3 border border-border/50">
                                            <Github className="h-5 w-5 text-muted-foreground/50" />
                                        </div>
                                        <h3 className="text-sm font-medium mb-1">No Repositories</h3>
                                        <p className="text-xs text-muted-foreground max-w-[180px]">No repositories found in your GitHub account</p>
                                    </div>
                                ) : filteredGithubRepos.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center py-8 text-center">
                                        <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3 border border-border/50">
                                            <Search className="h-5 w-5 text-muted-foreground/50" />
                                        </div>
                                        <h3 className="text-sm font-medium mb-1">No Results</h3>
                                        <p className="text-xs text-muted-foreground max-w-[180px]">No repositories match &quot;{githubSearchTerm}&quot;</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col flex-1 min-h-0">
                                        <div className="space-y-1.5 flex-1">
                                            {paginatedGithubRepos.map((repo, index) => {
                                                const isImporting = importingRepo?.repo?.id === repo.id;
                                                return (
                                                <div
                                                    key={repo.id}
                                                    className={`flex items-center justify-between gap-2 p-2 border border-border/50 rounded-lg transition-all duration-200 ${
                                                        isImporting 
                                                            ? 'bg-primary/5 border-primary/30 shadow-sm' 
                                                            : 'hover:bg-accent/10 hover:border-primary/30 hover:shadow-sm'
                                                    }`}
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
                                        {/* Pagination - Always visible */}
                                        <div className="flex items-center justify-between pt-3 mt-3 pb-1 border-t border-border/50">
                                            <span className="text-xs text-muted-foreground">
                                                {filteredGithubRepos.length} repos
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => setGithubRepoPage(p => Math.max(1, p - 1))}
                                                    disabled={githubRepoPage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <span className="text-xs text-muted-foreground min-w-[45px] text-center font-medium">
                                                    {githubRepoPage}/{githubTotalPages || 1}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => setGithubRepoPage(p => Math.min(githubTotalPages, p + 1))}
                                                    disabled={githubRepoPage >= githubTotalPages}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* GitLab Card */}
                <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-md min-h-[420px]">
                    <CardHeader className="py-2 px-2.5 sm:py-3 sm:px-4 flex-shrink-0">
                        {isGitlabConnected && (
                            <div className="flex items-center gap-1 mb-1">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] sm:text-xs text-green-600">Connected</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base">
                                <GitlabIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">GitLab Repositories</span>
                            </CardTitle>
                            {isGitlabConnected && (
                                <div className="flex gap-1 flex-shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 w-6 sm:h-7 sm:w-7 p-0"
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
                                        className="h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs"
                                        onClick={handleDisconnectGitlab}
                                        title="Disconnect from GitLab"
                                    >
                                        <span className="hidden xs:inline">Disconnect</span>
                                        <span className="xs:hidden">×</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 min-h-0 overflow-hidden pt-2 pb-6 px-2.5 sm:px-4">
                        {status === "loading" && !isDemoMode ? (
                            <p className="text-[10px] sm:text-xs text-muted-foreground">Loading...</p>
                        ) : status === "unauthenticated" && !isDemoMode ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-3 sm:p-4">
                                <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center mb-4 border border-border/50">
                                    <GitlabIcon className="h-7 w-7 text-muted-foreground/60" />
                                </div>
                                <h3 className="text-sm font-medium mb-1">Sign In Required</h3>
                                <p className="text-xs text-muted-foreground max-w-[200px]">
                                    Please sign in to connect GitLab
                                </p>
                            </div>
                        ) : !isGitlabConnected ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center mb-4 border border-border/50">
                                    <GitlabIcon className="h-7 w-7 text-muted-foreground/60" />
                                </div>
                                <h3 className="text-sm font-medium mb-1">Connect GitLab</h3>
                                <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">
                                    Import your repositories for security analysis
                                </p>
                                <Button onClick={() => { isDemoMode ? handleDemoConnectGitlab() : signIn("gitlab", { callbackUrl: "/dashboard" }); }} className="gap-2">
                                    <GitlabIcon className="h-4 w-4" />
                                    Connect GitLab
                                </Button>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col min-h-0">
                                {/* Search input */}
                                <div className="relative mb-2 flex-shrink-0">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                                    <Input
                                        placeholder="Search repositories..."
                                        value={gitlabSearchTerm}
                                        onChange={(e) => setGitlabSearchTerm(e.target.value)}
                                        className="h-8 pl-8 text-xs"
                                    />
                                </div>

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
                                    <div className="h-full flex flex-col items-center justify-center py-8 text-center">
                                        <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3 border border-border/50">
                                            <GitlabIcon className="h-5 w-5 text-muted-foreground/50" />
                                        </div>
                                        <h3 className="text-sm font-medium mb-1">No Repositories</h3>
                                        <p className="text-xs text-muted-foreground max-w-[180px]">No repositories found in your GitLab account</p>
                                    </div>
                                ) : filteredGitlabRepos.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center py-8 text-center">
                                        <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3 border border-border/50">
                                            <Search className="h-5 w-5 text-muted-foreground/50" />
                                        </div>
                                        <h3 className="text-sm font-medium mb-1">No Results</h3>
                                        <p className="text-xs text-muted-foreground max-w-[180px]">No repositories match &quot;{gitlabSearchTerm}&quot;</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col flex-1 min-h-0">
                                        <div className="space-y-1.5 flex-1">
                                            {paginatedGitlabRepos.map((repo, index) => {
                                                const isImporting = importingRepo?.repo?.id === repo.id;
                                                return (
                                                <div
                                                    key={repo.id}
                                                    className={`flex items-center justify-between gap-2 p-2 border border-border/50 rounded-lg transition-all duration-200 ${
                                                        isImporting 
                                                            ? 'bg-primary/5 border-primary/30 shadow-sm' 
                                                            : 'hover:bg-accent/10 hover:border-primary/30 hover:shadow-sm'
                                                    }`}
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
                                        {/* Pagination - Always visible */}
                                        <div className="flex items-center justify-between pt-3 mt-3 pb-1 border-t border-border/50">
                                            <span className="text-xs text-muted-foreground">
                                                {filteredGitlabRepos.length} repos
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => setGitlabRepoPage(p => Math.max(1, p - 1))}
                                                    disabled={gitlabRepoPage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <span className="text-xs text-muted-foreground min-w-[45px] text-center font-medium">
                                                    {gitlabRepoPage}/{gitlabTotalPages || 1}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => setGitlabRepoPage(p => Math.min(gitlabTotalPages, p + 1))}
                                                    disabled={gitlabRepoPage >= gitlabTotalPages}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
                </div>

                {/* Right Column - Prompts & Current Project */}
                <div className="flex flex-col gap-2 sm:gap-3 min-h-0 order-1 lg:order-2">
                {/* Prompts Card */}
                <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-md flex-1 min-h-0">
                    <CardHeader className="py-2 px-2.5 sm:py-3 sm:px-4 flex-shrink-0">
                        <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-xs sm:text-sm md:text-base truncate">AI Agent Prompts</CardTitle>
                            <div className="flex gap-1 flex-shrink-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 w-6 sm:h-7 sm:w-7 p-0"
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
                                        className="h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs"
                                        onClick={() => setDeleteDialog({ type: 'selected', count: selectedPrompts.size })}
                                    >
                                        <span className="hidden xs:inline">Delete ({selectedPrompts.size})</span>
                                        <span className="xs:hidden">×{selectedPrompts.size}</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 min-h-0 overflow-hidden py-2 px-2.5 sm:px-4">
                        <Tabs value={currentAgent} onValueChange={setCurrentAgent} className="h-full flex flex-col">
                            <TabsList className="grid w-full grid-cols-4 h-7 sm:h-8 flex-shrink-0">
                                {agents.map((agent) => (
                                    <TabsTrigger key={agent} value={agent} className="capitalize text-[9px] sm:text-[10px] md:text-xs px-0.5 sm:px-1 truncate">
                                        <span className="truncate">{agent}</span>
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

                                            <DialogContent className="sm:max-w-lg">
                                                <DialogHeader>
                                                    <DialogTitle>New Prompt</DialogTitle>
                                                    <DialogDescription>
                                                        Create a prompt for the {agent} agent
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <div className="grid gap-4 py-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="title">Title</Label>
                                                        <Input
                                                            id="title"
                                                            value={newTitle}
                                                            onChange={(e) => setNewTitle(e.target.value)}
                                                            placeholder="Enter prompt title..."
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="prompt-content">Prompt Content</Label>
                                                        <Textarea
                                                            id="prompt-content"
                                                            placeholder="Enter your prompt here..."
                                                            value={newPrompt}
                                                            onChange={(e) => setNewPrompt(e.target.value)}
                                                            rows={6}
                                                        />
                                                    </div>
                                                </div>

                                                <DialogFooter>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setIsDialogOpen(false)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button onClick={handleAddPrompt}>
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
                                        ) : (() => {
                                            const totalPrompts = prompts[agent].length;
                                            const totalPages = Math.ceil(totalPrompts / PROMPTS_PER_PAGE);
                                            const currentPage = promptPages[agent] || 1;
                                            const startIndex = (currentPage - 1) * PROMPTS_PER_PAGE;
                                            const endIndex = startIndex + PROMPTS_PER_PAGE;
                                            const paginatedPrompts = prompts[agent].slice(startIndex, endIndex);

                                            return (
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragStart={(event) => handleDragStart(event, agent)}
                                                    onDragEnd={(event) => handleDragEnd(event, agent)}
                                                >
                                                    <SortableContext
                                                        items={paginatedPrompts.map(p => p.id)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        <div className="space-y-1.5 pr-2">
                                                            {paginatedPrompts.map((prompt, index) => (
                                                                <SortablePromptItem
                                                                    key={prompt.id}
                                                                    prompt={prompt}
                                                                    agent={agent}
                                                                    selectedPrompts={selectedPrompts}
                                                                    setSelectedPrompts={setSelectedPrompts}
                                                                    truncateText={truncateText}
                                                                    setViewFullTextPrompt={setViewFullTextPrompt}
                                                                    openEditDialog={openEditDialog}
                                                                    setDeleteDialog={setDeleteDialog}
                                                                    onMoveUp={(promptId) => handleMoveUp(agent, promptId)}
                                                                    onMoveDown={(promptId) => handleMoveDown(agent, promptId)}
                                                                    isFirst={startIndex + index === 0}
                                                                    isLast={startIndex + index === totalPrompts - 1}
                                                                />
                                                            ))}
                                                        </div>
                                                    </SortableContext>
                                                    <DragOverlay>
                                                        {activeId && activeDragAgent === agent ? (
                                                            <div className="border border-primary/50 rounded-lg p-2.5 bg-background shadow-xl ring-2 ring-primary/20">
                                                                <div className="flex items-center gap-2">
                                                                    <GripVertical className="h-4 w-4 text-muted-foreground/60" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="font-medium text-xs truncate text-foreground/90">
                                                                            {prompts[agent]?.find(p => p.id === activeId)?.title || "Untitled"}
                                                                        </h4>
                                                                        <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
                                                                            {truncateText(prompts[agent]?.find(p => p.id === activeId)?.text || "", 35)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </DragOverlay>
                                                </DndContext>
                                            );
                                        })()}
                                    </ScrollArea>

                                    {/* Pagination Controls - Always rendered outside ScrollArea to maintain consistent height */}
                                    {(() => {
                                        const totalPrompts = prompts[agent]?.length || 0;
                                        const totalPages = Math.ceil(totalPrompts / PROMPTS_PER_PAGE);
                                        const currentPage = promptPages[agent] || 1;
                                        const showPagination = totalPages > 1;

                                        return (
                                            <div className={`flex items-center justify-center gap-2 mt-3 pt-2 border-t flex-shrink-0 ${showPagination ? '' : 'invisible'}`}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => setPromptPages(prev => ({ ...prev, [agent]: Math.max(1, currentPage - 1) }))}
                                                    disabled={currentPage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <span className="text-xs text-muted-foreground min-w-[60px] text-center">
                                                    {currentPage} / {totalPages || 1}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => setPromptPages(prev => ({ ...prev, [agent]: Math.min(totalPages, currentPage + 1) }))}
                                                    disabled={currentPage === totalPages}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    })()}
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Current Project Card - Now in right column under Prompts */}
                <Card className="flex flex-col transition-shadow hover:shadow-md shrink-0">
                    <CardHeader className="py-2 px-2.5 sm:py-3 sm:px-4 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base">
                                <FolderOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">Current Project</span>
                            </CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-2 pb-2 px-2.5 sm:px-4">
                        {currentRepo ? (
                            <div className="flex flex-col gap-2">
                                <div className="p-2.5 border rounded-lg bg-muted/20 transition-colors hover:bg-muted/30">
                                    <div className="flex items-center gap-2 mb-1.5">
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
                                    <p className="text-xs text-muted-foreground mt-0.5">Currently loaded project</p>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-8 transition-colors"
                                        onClick={() => router.push(isDemoMode ? "/demo/code-input" : "/dashboard?active=Code%20input")}
                                    >
                                        <FolderOpen className="h-3 w-3 mr-2" />
                                        Open in Editor
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="flex-1 h-8"
                                        onClick={handleUnloadProject}
                                    >
                                        <FolderX className="h-3 w-3 mr-2" />
                                        Unload
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-2 text-center">
                                <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center mb-1.5 border border-border/50">
                                    <FolderX className="h-4 w-4 text-muted-foreground/60" />
                                </div>
                                <h3 className="text-xs font-medium mb-0.5">No Project Loaded</h3>
                                <p className="text-[10px] text-muted-foreground max-w-[180px]">Import a repository from GitHub or GitLab to get started</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                </div>
            </div>
            </div>


            {/* Full Text Dialog */}
            <Dialog open={!!viewFullTextPrompt} onOpenChange={() => setViewFullTextPrompt(null)}>
                <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">
                            {viewFullTextPrompt?.title || "Untitled Prompt"}
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                            Full prompt content
                        </DialogDescription>
                    </DialogHeader>
                    {viewFullTextPrompt && (
                        <div className="py-2 sm:py-4">
                            <ScrollArea className="h-60 sm:h-80 rounded-md border p-3 sm:p-4">
                                <pre className="whitespace-pre-wrap text-xs sm:text-sm font-mono leading-relaxed">
                                    {viewFullTextPrompt.text}
                                </pre>
                            </ScrollArea>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 text-right">
                                {viewFullTextPrompt.text.length} characters
                            </p>
                        </div>
                    )}
                    <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setViewFullTextPrompt(null)}
                            className="w-full sm:w-auto order-2 sm:order-1"
                        >
                            Close
                        </Button>
                        <Button
                            onClick={() => {
                                if (viewFullTextPrompt) {
                                    openEditDialog(currentAgent, viewFullTextPrompt)
                                    setViewFullTextPrompt(null)
                                }
                            }}
                            className="w-full sm:w-auto order-1 sm:order-2"
                        >
                            <Edit className="h-4 w-4 mr-2" />
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
                <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">Edit Prompt</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                            Modify the prompt for the {editingPromptData?.agent} agent
                        </DialogDescription>
                    </DialogHeader>

                    {editingPromptData && (
                        <div className="grid gap-3 sm:gap-4 py-2 sm:py-4">
                            <div className="grid gap-1.5 sm:gap-2">
                                <Label htmlFor="edit-title" className="text-xs sm:text-sm">Title</Label>
                                <Input
                                    id="edit-title"
                                    value={editingPromptData.title}
                                    onChange={(e) => setEditingPromptData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Enter prompt title..."
                                    className="h-9 sm:h-10 text-sm"
                                />
                            </div>
                            <div className="grid gap-1.5 sm:gap-2">
                                <Label htmlFor="edit-content" className="text-xs sm:text-sm">Prompt Content</Label>
                                <Textarea
                                    id="edit-content"
                                    value={editingPromptData.text}
                                    onChange={(e) => setEditingPromptData(prev => ({ ...prev, text: e.target.value }))}
                                    placeholder="Enter your prompt here..."
                                    rows={5}
                                    className="text-sm min-h-[120px] sm:min-h-[150px]"
                                />
                                <p className="text-[10px] sm:text-xs text-muted-foreground text-right">
                                    {editingPromptData.text?.length || 0} characters
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setEditDialogOpen(false)
                                setEditingPromptData(null)
                            }}
                            className="w-full sm:w-auto order-2 sm:order-1"
                        >
                            Cancel
                        </Button>
                        <Button
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

            {/* Delete Confirmation AlertDialog */}
            <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteDialog?.type === 'single' && "This action cannot be undone. This prompt will be permanently deleted."}
                            {deleteDialog?.type === 'selected' && `This action cannot be undone. ${deleteDialog.count || selectedPrompts.size} prompt(s) will be permanently deleted.`}
                            {deleteDialog?.type === 'category' && `This action cannot be undone. All prompts from "${deleteDialog.agent}" will be permanently deleted.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Import Progress Dialog */}
            <Dialog open={importingRepo !== null} onOpenChange={() => {}}>
                <DialogContent className="w-[90vw] max-w-md p-4 sm:p-6" showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                            {importingRepo?.progress === 100 ? (
                                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                            ) : (
                                <GitBranch className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            )}
                            <span className="truncate">Importing Repository</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm truncate">
                            {importingRepo?.repo?.full_name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                        {/* Progress bar */}
                        <div className="space-y-1.5 sm:space-y-2">
                            <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-muted-foreground truncate">{importingRepo?.status}</span>
                                <span className="font-medium flex-shrink-0">{importingRepo?.progress}%</span>
                            </div>
                            <Progress
                                value={importingRepo?.progress || 0}
                                className="h-1.5 sm:h-2 transition-all duration-300"
                            />
                        </div>

                        {/* Steps indicator */}
                        <div className="space-y-1.5 sm:space-y-2">
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
        </ScrollArea>
    )
}
