"use client"

import React from "react"
import dynamic from "next/dynamic"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScanSearch, Wrench, BugPlay, FileText, Database, RefreshCw, Search, ChevronRight, Folder, File } from "lucide-react"
import { toast } from "sonner"

// Custom hook
import { useModelsDialog } from "@/hooks/use-models-dialog"

// Sub-components
import { AgentCard, KnowledgeBaseCard, PromptCard } from "./_components"

// Lazy-load ReactFlow visualization
const AIWorkflowVisualization = dynamic(
    () => import("./ai-workflow-visualization").then(mod => mod.AIWorkflowVisualization),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-[400px] w-full bg-muted/30 rounded-lg">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">Loading workflow...</span>
                </div>
            </div>
        )
    }
)

// Agent configuration
const AGENTS = [
    { id: 'reviewer', title: 'Reviewer agent', icon: ScanSearch, color: 'text-blue-500', description: 'Analyzes code quality, security, and best practices' },
    { id: 'implementation', title: 'Implementation agent', icon: Wrench, color: 'text-green-500', description: 'Implements code changes and improvements' },
    { id: 'tester', title: 'Tester agent', icon: BugPlay, color: 'text-orange-500', description: 'Creates and runs tests for code validation' },
    { id: 'report', title: 'Report agent', icon: FileText, color: 'text-purple-500', description: 'Generates comprehensive reports and documentation' },
]

/**
 * ModelsDialog - Dialog for configuring AI agent workflow.
 * Refactored to use custom hook and extracted sub-components.
 */
export function ModelsDialog({ isOpen, onOpenChange, codeType, onCodeTypeChange }) {
    const dialog = useModelsDialog({ codeType })
    const [selectedGroupIds, setSelectedGroupIds] = React.useState([]);

    const handleSaveConfiguration = () => {
        // Save selected groups to localStorage
        try {
            localStorage.setItem('vulniq_selected_groups', JSON.stringify(selectedGroupIds));
            toast.success('Workflow configuration saved!');
        } catch (err) {
            console.error('Error saving configuration:', err);
            toast.error('Failed to save configuration');
        }
        onOpenChange(false);
    };

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange} modal={false}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-7xl">
                    <DrawerHeader>
                        <DrawerTitle>Configure AI agent workflow</DrawerTitle>
                        <DrawerDescription>
                            Visualize your code workflow and select AI models for each agent.
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4">
                        <Tabs defaultValue="workflow" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4 h-auto">
                                <TabsTrigger value="workflow" className="text-xs sm:text-sm px-2 py-2">
                                    <span className="hidden sm:inline">Workflow visualization</span>
                                    <span className="sm:hidden">Workflow</span>
                                </TabsTrigger>
                                <TabsTrigger value="models" className="text-xs sm:text-sm px-2 py-2">
                                    <span className="hidden sm:inline">Agents configuration</span>
                                    <span className="sm:hidden">Agents</span>
                                </TabsTrigger>
                                <TabsTrigger value="prompts" className="text-xs sm:text-sm px-2 py-2">
                                    <span className="hidden sm:inline">Prompts configuration</span>
                                    <span className="sm:hidden">Prompts</span>
                                </TabsTrigger>
                                <TabsTrigger value="knowledge" className="text-xs sm:text-sm px-2 py-2">
                                    <span className="hidden sm:inline">Knowledge base</span>
                                    <span className="sm:hidden">Knowledge</span>
                                </TabsTrigger>
                            </TabsList>

                            {/* Workflow Tab */}
                            <TabsContent value="workflow" className="mt-0">
                                <WorkflowTab
                                    dialog={dialog}
                                    codeType={codeType}
                                    onCodeTypeChange={onCodeTypeChange}
                                    onOpenChange={handleSaveConfiguration}
                                />
                            </TabsContent>

                            {/* Agents Tab */}
                            <TabsContent value="models" className="mt-0">
                                <AgentsTab dialog={dialog} onOpenChange={handleSaveConfiguration} />
                            </TabsContent>

                            {/* Prompts Tab */}
                            <TabsContent value="prompts" className="mt-0">
                                <PromptsTab dialog={dialog} />
                            </TabsContent>

                            {/* Knowledge Base Tab */}
                            <TabsContent value="knowledge" className="mt-0">
                                <KnowledgeBaseTab 
                                    dialog={dialog} 
                                    codeType={codeType} 
                                    onSaveGroups={setSelectedGroupIds}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}

/**
 * WorkflowTab - Workflow visualization tab content
 */
function WorkflowTab({ dialog, codeType, onCodeTypeChange, onOpenChange }) {
    return (
        <ScrollArea className="h-[calc(100vh-280px)] sm:h-[calc(100vh-240px)] bg-muted/30 rounded-lg p-1" data-vaul-no-drag>
            <div className="space-y-4 pr-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Your code flows through a series of AI agents. Each agent can use a different model. Select models directly in the workflow below:
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={dialog.handleRefreshAll}
                        disabled={dialog.isRefreshingAll}
                        className="shrink-0 ml-4 text-foreground"
                    >
                        {dialog.isRefreshingAll ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Refreshing...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh all
                            </>
                        )}
                    </Button>
                </div>
                <AIWorkflowVisualization
                    models={dialog.models}
                    agentModels={dialog.agentModels}
                    onModelChange={dialog.handleModelChange}
                    knowledgeBases={dialog.useCases.map(uc => ({
                        id: uc.id,
                        name: uc.title,
                        description: uc.content,
                        icon: uc.icon
                    }))}
                    selectedKnowledgeBases={dialog.selectedKnowledgeBases}
                    onKnowledgeBaseChange={dialog.toggleKnowledgeBase}
                    codeType={codeType}
                    onCodeTypeChange={onCodeTypeChange}
                    useCases={dialog.useCases}
                    prompts={dialog.prompts}
                    selectedPrompts={dialog.selectedPrompts}
                    selectedSystemPrompts={dialog.selectedSystemPrompts}
                    onPromptChange={dialog.handlePromptChange}
                    isRefreshingAll={dialog.isRefreshingAll}
                    onSave={() => onOpenChange(false)}
                    onCancel={() => onOpenChange(false)}
                />
            </div>
        </ScrollArea>
    )
}

/**
 * AgentsTab - Agents configuration tab content
 */
function AgentsTab({ dialog, onOpenChange }) {
    const handleSaveConfiguration = () => {
        // Save agent configurations to localStorage
        try {
            const agentConfigurations = {
                reviewer: {
                    enabled: true, // Always enabled
                    modelId: dialog.agentModels['reviewer'] || 'anthropic.claude-3-sonnet-20240229-v1:0',
                    customPrompt: dialog.selectedSystemPrompts['reviewer'] || '',
                },
                implementer: {
                    enabled: !!dialog.agentModels['implementation'],
                    modelId: dialog.agentModels['implementation'] || 'anthropic.claude-3-sonnet-20240229-v1:0',
                    customPrompt: dialog.selectedSystemPrompts['implementation'] || '',
                },
                tester: {
                    enabled: !!dialog.agentModels['tester'],
                    modelId: dialog.agentModels['tester'] || 'anthropic.claude-3-sonnet-20240229-v1:0',
                    customPrompt: dialog.selectedSystemPrompts['tester'] || '',
                },
                reporter: {
                    enabled: true, // Always enabled
                    modelId: dialog.agentModels['report'] || 'anthropic.claude-3-sonnet-20240229-v1:0',
                    customPrompt: dialog.selectedSystemPrompts['report'] || '',
                },
            };
            
            localStorage.setItem('vulniq_agent_configurations', JSON.stringify(agentConfigurations));
            toast.success('Agent configuration saved!');
            onOpenChange(false);
        } catch (err) {
            console.error('Error saving agent configuration:', err);
            toast.error('Failed to save configuration');
        }
    };

    return (
        <ScrollArea className="h-[calc(100vh-280px)] sm:h-[calc(100vh-240px)] bg-muted/30 rounded-lg p-1" data-vaul-no-drag>
            <div className="pr-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <div>
                        <h3 className="text-lg font-semibold">Agent configuration</h3>
                        <p className="text-sm text-muted-foreground">Select AI models for each agent in the workflow</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        title="Refresh all agent configurations"
                        onClick={dialog.handleRefreshAllAgents}
                        disabled={dialog.isRefreshingModels}
                        className="shrink-0 text-foreground"
                    >
                        {dialog.isRefreshingModels ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Refreshing...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh all
                            </>
                        )}
                    </Button>
                </div>
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                    {AGENTS.map(agent => (
                        <AgentCard
                            key={agent.id}
                            agentId={agent.id}
                            title={agent.title}
                            description={agent.description}
                            icon={agent.icon}
                            iconColor={agent.color}
                            selectedModel={dialog.agentModels[agent.id]}
                            onModelChange={(model) => dialog.handleModelChange(agent.id, model)}
                            models={dialog.getPaginatedModels(agent.id)}
                            modelSearchTerm={dialog.modelSearchTerm[agent.id]}
                            onModelSearchChange={(value) => {
                                dialog.setModelSearchTerm(p => ({ ...p, [agent.id]: value }))
                                dialog.setModelDropdownPage(p => ({ ...p, [agent.id]: 0 }))
                            }}
                            modelPage={dialog.modelDropdownPage[agent.id]}
                            onModelPageChange={(page) => dialog.setModelDropdownPage(p => ({ ...p, [agent.id]: page }))}
                            totalModelPages={dialog.getTotalModelPages(agent.id)}
                            selectedPrompt={dialog.selectedSystemPrompts[agent.id]}
                            onPromptChange={(value) => dialog.setSelectedSystemPrompts(p => ({ ...p, [agent.id]: value }))}
                            prompts={dialog.getPaginatedPrompts(agent.id)}
                            promptSearchTerm={dialog.promptSearchTerm[agent.id]}
                            onPromptSearchChange={(value) => {
                                dialog.setPromptSearchTerm(p => ({ ...p, [agent.id]: value }))
                                dialog.setPromptDropdownPage(p => ({ ...p, [agent.id]: 0 }))
                            }}
                            promptPage={dialog.promptDropdownPage[agent.id]}
                            onPromptPageChange={(page) => dialog.setPromptDropdownPage(p => ({ ...p, [agent.id]: page }))}
                            totalPromptPages={dialog.getTotalPromptPages(agent.id)}
                            isRefreshing={dialog.isRefreshingPrompts[agent.id]}
                            onRefresh={() => dialog.handleRefreshAgentPrompts(agent.id)}
                        />
                    ))}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={handleSaveConfiguration}>Save Configuration</Button>
                    <Button onClick={() => onOpenChange(false)} variant="outline">Cancel</Button>
                </div>
            </div>
        </ScrollArea>
    )
}

/**
 * PromptsTab - Prompts configuration tab content
 */
function PromptsTab({ dialog }) {
    const agentEntries = Object.entries(dialog.prompts)
    const agentsPerPage = 2
    const totalAgentPages = Math.ceil(agentEntries.length / agentsPerPage)
    const visibleAgents = agentEntries.slice(dialog.agentPage * agentsPerPage, (dialog.agentPage + 1) * agentsPerPage)

    return (
        <div className="space-y-4 bg-muted/30 rounded-lg p-3" data-vaul-no-drag>
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Configure the prompts used by each AI agent. Select one prompt per agent.
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={dialog.handleRefreshAllPrompts}
                    disabled={dialog.isRefreshingAllPrompts}
                    className="shrink-0 ml-4 text-foreground"
                >
                    {dialog.isRefreshingAllPrompts ? (
                        <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Refreshing...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh all
                        </>
                    )}
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {visibleAgents.map(([agent, agentPrompts]) => (
                    <PromptCard
                        key={agent}
                        agent={agent}
                        agentPrompts={agentPrompts}
                        selectedPrompts={dialog.selectedPrompts}
                        currentPage={dialog.currentPage[agent] || 0}
                        isRefreshing={dialog.isRefreshingPrompts[agent]}
                        onPromptSelect={dialog.handlePromptChange}
                        onViewPrompt={dialog.setViewPrompt}
                        onRefresh={() => dialog.handleRefreshAgentPrompts(agent)}
                        onPageChange={(page) => dialog.setCurrentPage(prev => ({ ...prev, [agent]: page }))}
                        truncateText={dialog.truncateText}
                    />
                ))}
            </div>

            {totalAgentPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-4 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dialog.setAgentPage(prev => Math.max(0, prev - 1))}
                        disabled={dialog.agentPage === 0}
                    >
                        ← Previous agents page
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Agents {dialog.agentPage * agentsPerPage + 1}-{Math.min((dialog.agentPage + 1) * agentsPerPage, agentEntries.length)} of {agentEntries.length}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dialog.setAgentPage(prev => Math.min(totalAgentPages - 1, prev + 1))}
                        disabled={dialog.agentPage >= totalAgentPages - 1}
                    >
                        Next agents page →
                    </Button>
                </div>
            )}

            {/* View Prompt Dialog */}
            <Dialog open={!!dialog.viewPrompt} onOpenChange={() => dialog.setViewPrompt(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{dialog.viewPrompt?.title || "Untitled Prompt"}</DialogTitle>
                        <DialogDescription>Complete text of the selected prompt.</DialogDescription>
                    </DialogHeader>
                    {dialog.viewPrompt && (
                        <Textarea value={dialog.viewPrompt.text} readOnly rows={10} className="resize-none" />
                    )}
                    <DialogFooter>
                        <Button onClick={() => dialog.setViewPrompt(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

/**
/**
 * KnowledgeBaseTab - Knowledge base selection tab content with hierarchical group/use case/file selection
 */
function KnowledgeBaseTab({ dialog, codeType, onSaveGroups }) {
    const [expandedGroups, setExpandedGroups] = React.useState(new Set())
    const [expandedUseCases, setExpandedUseCases] = React.useState(new Set())
    const [selectedFiles, setSelectedFiles] = React.useState(new Set())
    const [selectedGroups, setSelectedGroups] = React.useState(new Set()) // Track selected groups
    const [useCaseGroups, setUseCaseGroups] = React.useState([])
    const [useCasePdfs, setUseCasePdfs] = React.useState({}) // { useCaseId: [pdfs] }
    const [loadingPdfs, setLoadingPdfs] = React.useState(new Set())

    // Load saved groups from localStorage on mount
    React.useEffect(() => {
        try {
            const saved = localStorage.getItem('vulniq_selected_groups');
            if (saved) {
                const groupIds = JSON.parse(saved);
                setSelectedGroups(new Set(groupIds));
            }
        } catch (err) {
            console.error('Error loading selected groups:', err);
        }
    }, []);

    // Save selected groups whenever they change
    React.useEffect(() => {
        if (onSaveGroups) {
            onSaveGroups(Array.from(selectedGroups));
        }
    }, [selectedGroups, onSaveGroups]);

    // Save selected files to localStorage whenever they change
    React.useEffect(() => {
        try {
            localStorage.setItem('vulniq_selected_documents', JSON.stringify(Array.from(selectedFiles)));
        } catch (err) {
            console.error('Error saving selected documents:', err);
        }
    }, [selectedFiles]);

    // Fetch groups on mount
    React.useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await fetch('/api/use-case-groups')
                if (response.ok) {
                    const data = await response.json()
                    const groups = data.data?.groups || data.groups || []
                    setUseCaseGroups(groups)
                }
            } catch (error) {
                console.error('Error fetching groups:', error)
            }
        }
        fetchGroups()
    }, [])

    // Fetch PDFs for a use case
    const fetchUseCasePdfs = async (useCaseId) => {
        if (useCasePdfs[useCaseId]) return // Already loaded
        
        setLoadingPdfs(prev => new Set(prev).add(useCaseId))
        try {
            const response = await fetch(`/api/folders?useCaseId=${useCaseId}`)
            if (response.ok) {
                const data = await response.json()
                const folders = data.data?.folders || data.folders || []
                
                // Flatten the folder tree to get all PDFs
                const extractPdfs = (items) => {
                    let pdfs = []
                    items.forEach(item => {
                        if (item.type === 'pdf') {
                            pdfs.push(item)
                        }
                        if (item.children) {
                            pdfs = pdfs.concat(extractPdfs(item.children))
                        }
                    })
                    return pdfs
                }
                
                const allPdfs = extractPdfs(folders)
                setUseCasePdfs(prev => ({ ...prev, [useCaseId]: allPdfs }))
            }
        } catch (error) {
            console.error('Error fetching PDFs:', error)
        } finally {
            setLoadingPdfs(prev => {
                const next = new Set(prev)
                next.delete(useCaseId)
                return next
            })
        }
    }

    // Toggle use case expansion and fetch PDFs
    const toggleUseCase = (useCaseId) => {
        setExpandedUseCases(prev => {
            const next = new Set(prev)
            if (next.has(useCaseId)) {
                next.delete(useCaseId)
            } else {
                next.add(useCaseId)
                fetchUseCasePdfs(useCaseId)
            }
            return next
        })
    }

    // Toggle file selection
    const toggleFile = (fileId) => {
        setSelectedFiles(prev => {
            const next = new Set(prev)
            if (next.has(fileId)) {
                next.delete(fileId)
            } else {
                next.add(fileId)
            }
            return next
        })
    }

    // Toggle group selection - selects/deselects all PDFs in the group
    const toggleGroup = (groupId) => {
        const isCurrentlySelected = selectedGroups.has(groupId)
        
        if (isCurrentlySelected) {
            // Deselect group and all its files
            setSelectedGroups(prev => {
                const next = new Set(prev)
                next.delete(groupId)
                return next
            })
            // Remove all files from this group
            const group = groupedUseCases[groupId]
            if (group) {
                const allFileIds = new Set()
                group.useCases.forEach(uc => {
                    const pdfs = useCasePdfs[uc.id] || []
                    pdfs.forEach(pdf => allFileIds.add(pdf.id))
                })
                setSelectedFiles(prev => {
                    const next = new Set(prev)
                    allFileIds.forEach(id => next.delete(id))
                    return next
                })
            }
        } else {
            // Select group and all its files
            setSelectedGroups(prev => new Set(prev).add(groupId))
            // Add all files from this group
            const group = groupedUseCases[groupId]
            if (group) {
                const allFileIds = new Set()
                group.useCases.forEach(uc => {
                    const pdfs = useCasePdfs[uc.id] || []
                    pdfs.forEach(pdf => allFileIds.add(pdf.id))
                })
                setSelectedFiles(prev => {
                    const next = new Set(prev)
                    allFileIds.forEach(id => next.add(id))
                    return next
                })
            }
        }
    }

    // Toggle group expansion
    const toggleGroupExpansion = (groupId) => {
        setExpandedGroups(prev => {
            const next = new Set(prev)
            if (next.has(groupId)) {
                next.delete(groupId)
            } else {
                next.add(groupId)
            }
            return next
        })
    }

    // Group use cases by groupId
    const groupedUseCases = React.useMemo(() => {
        const grouped = {}
        useCaseGroups.forEach(group => {
            grouped[group.id] = {
                ...group,
                useCases: dialog.useCases.filter(uc => uc.groupId === group.id)
            }
        })
        // Add ungrouped use cases
        grouped['ungrouped'] = {
            id: 'ungrouped',
            name: 'Ungrouped',
            useCases: dialog.useCases.filter(uc => !uc.groupId)
        }
        return grouped
    }, [useCaseGroups, dialog.useCases])

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Hierarchical Knowledge Base Selection</p>
                    <p>Select specific PDF files from use cases to provide context to AI agents.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                        {selectedGroups.size} group{selectedGroups.size !== 1 ? 's' : ''}, {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
                    </span>
                    {(selectedFiles.size > 0 || selectedGroups.size > 0) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSelectedFiles(new Set())
                                setSelectedGroups(new Set())
                            }}
                            className="h-8"
                        >
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            <ScrollArea className="h-[400px] bg-muted/30 rounded-lg p-3" data-vaul-no-drag>
                <div className="space-y-2">
                    {Object.entries(groupedUseCases).map(([groupId, group]) => {
                        const isExpanded = expandedGroups.has(groupId)
                        const isGroupSelected = selectedGroups.has(groupId)
                        
                        return (
                            <div key={groupId} className="border rounded-lg bg-background">
                                {/* Group Header */}
                                <div className="flex items-center gap-2 p-3 hover:bg-accent/50 transition-colors rounded-t-lg">
                                    <Checkbox
                                        checked={isGroupSelected}
                                        onCheckedChange={() => toggleGroup(groupId)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-4 w-4"
                                        title="Select all files in this group"
                                    />
                                    <button
                                        onClick={() => toggleGroupExpansion(groupId)}
                                        className="flex items-center gap-2 flex-1"
                                    >
                                        <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        <Folder className="h-4 w-4 text-blue-500" />
                                        <span className="font-medium flex-1 text-left">{group.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {group.useCases.length} use case{group.useCases.length !== 1 ? 's' : ''}
                                        </span>
                                    </button>
                                </div>

                                {/* Use Cases */}
                                {isExpanded && (
                                    <div className="border-t">
                                        {group.useCases.length === 0 ? (
                                            <div className="p-4 text-xs text-muted-foreground text-center">
                                                No use cases in this group
                                            </div>
                                        ) : (
                                            group.useCases.map(useCase => {
                                            const isUseCaseExpanded = expandedUseCases.has(useCase.id)
                                            const pdfs = useCasePdfs[useCase.id] || []
                                            const isLoadingPdfs = loadingPdfs.has(useCase.id)
                                            
                                            return (
                                                <div key={useCase.id} className="border-b last:border-b-0">
                                                    {/* Use Case Header */}
                                                    <button
                                                        onClick={() => toggleUseCase(useCase.id)}
                                                        className="w-full flex items-center gap-2 p-2 pl-8 hover:bg-accent/30 transition-colors"
                                                    >
                                                        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isUseCaseExpanded ? 'rotate-90' : ''}`} />
                                                        <File className="h-3.5 w-3.5 text-orange-500" />
                                                        <span className="text-sm flex-1 text-left">{useCase.title}</span>
                                                        {isLoadingPdfs ? (
                                                            <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">
                                                                {pdfs.length} file{pdfs.length !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </button>

                                                    {/* PDF Files */}
                                                    {isUseCaseExpanded && (
                                                        <div className="bg-muted/50">
                                                            {isLoadingPdfs ? (
                                                                <div className="p-4 pl-16 text-xs text-muted-foreground">
                                                                    Loading files...
                                                                </div>
                                                            ) : pdfs.length === 0 ? (
                                                                <div className="p-4 pl-16 text-xs text-muted-foreground">
                                                                    No files uploaded yet
                                                                </div>
                                                            ) : (
                                                                pdfs.map(pdf => (
                                                                    <label
                                                                        key={pdf.id}
                                                                        className="flex items-center gap-2 p-2 pl-16 hover:bg-accent/20 cursor-pointer transition-colors"
                                                                    >
                                                                        <Checkbox
                                                                            checked={selectedFiles.has(pdf.id)}
                                                                            onCheckedChange={() => toggleFile(pdf.id)}
                                                                            className="h-3.5 w-3.5"
                                                                        />
                                                                        <File className="h-3 w-3 text-red-500" />
                                                                        <span className="text-xs flex-1">{pdf.name || pdf.title}</span>
                                                                        {pdf.size && (
                                                                            <span className="text-[10px] text-muted-foreground">
                                                                                {typeof pdf.size === 'string' ? pdf.size : `${Math.round(pdf.size / 1024)} KB`}
                                                                            </span>
                                                                        )}
                                                                    </label>
                                                                ))
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {Object.keys(groupedUseCases).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Database className="h-12 w-12 text-muted-foreground/50 mb-3" />
                            <p className="text-sm text-muted-foreground">No groups found</p>
                            <p className="text-xs text-muted-foreground mt-1">Create groups in the Knowledge Base page</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}

export { ModelsDialog }
