"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    ChevronRight,
    ChevronDown,
    ChevronLeft,
    Folder,
    FileText,
    ScanSearch,
    Wrench,
    BugPlay,
    FileText as FileTextIcon,
    AlertTriangle,
    CheckCircle,
    Info,
    Loader2,
    RefreshCw,
    ArrowRight,
    Database,
} from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { useUseCases } from "@/contexts/useCasesContext"
import { usePrompts } from "@/contexts/promptsContext"

// Agent definitions with their constraints
const AGENTS = [
    {
        id: 'reviewer',
        title: 'Security Reviewer',
        icon: ScanSearch,
        color: 'text-agent-reviewer',
        bgColor: 'bg-agent-reviewer/10',
        description: 'Analyzes code for security vulnerabilities, risks, and misconfigurations',
        required: true,
        constraints: [
            'Only analyzes the submitted source code',
            'Only references selected PDF documents',
            'Only uses the assigned predefined prompt',
            'Does not infer or assume external knowledge',
        ]
    },
    {
        id: 'implementation',
        title: 'Fix Implementer',
        icon: Wrench,
        color: 'text-agent-implementation',
        bgColor: 'bg-agent-implementation/10',
        description: 'Proposes code fixes for identified vulnerabilities',
        required: false,
    },
    {
        id: 'tester',
        title: 'Security Tester',
        icon: BugPlay,
        color: 'text-agent-tester',
        bgColor: 'bg-agent-tester/10',
        description: 'Validates proposed fixes and tests for regressions',
        required: false,
    },
    {
        id: 'report',
        title: 'Report Generator',
        icon: FileTextIcon,
        color: 'text-agent-report',
        bgColor: 'bg-agent-report/10',
        description: 'Generates comprehensive security analysis reports',
        required: false,
    },
]

// Demo models for when Bedrock is not configured
const DEMO_MODELS = [
    { id: 'anthropic.claude-3-5-sonnet-20241022-v2:0', name: 'Claude 3.5 Sonnet v2', provider: 'Anthropic', description: 'State-of-the-art for software engineering and agentic tasks' },
    { id: 'anthropic.claude-3-5-haiku-20241022-v1:0', name: 'Claude 3.5 Haiku', provider: 'Anthropic', description: 'Fastest and most cost-effective model' },
    { id: 'anthropic.claude-3-sonnet-20240229-v1:0', name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Balanced intelligence and speed for enterprise workloads' },
    { id: 'anthropic.claude-3-haiku-20240307-v1:0', name: 'Claude 3 Haiku', provider: 'Anthropic', description: 'Fast, compact model for near-instant responses' },
]

/**
 * SecurityReviewConfig - Comprehensive security review configuration component
 *
 * Features:
 * - PDF document selection from knowledge base
 * - AI model selection per agent
 * - Predefined prompt selection per agent
 * - Strict constraint enforcement for reviewer agent
 */
export function SecurityReviewConfig({
    isOpen,
    onOpenChange,
    onStartReview,
    code,
    codeType,
}) {
    const { data: session } = useSession()
    const pathname = usePathname()
    const isDemoMode = pathname?.startsWith('/demo')

    // State for document selection
    const [useCaseGroups, setUseCaseGroups] = useState([])
    const [expandedGroups, setExpandedGroups] = useState(new Set())
    const [expandedUseCases, setExpandedUseCases] = useState(new Set())
    const [useCasePdfs, setUseCasePdfs] = useState({})
    const [loadingPdfs, setLoadingPdfs] = useState(new Set())
    const [selectedDocuments, setSelectedDocuments] = useState(new Set())

    // State for agent configuration
    const [agentConfigs, setAgentConfigs] = useState({
        reviewer: { enabled: true, modelId: '', promptId: '' },
        implementation: { enabled: false, modelId: '', promptId: '' },
        tester: { enabled: false, modelId: '', promptId: '' },
        report: { enabled: false, modelId: '', promptId: '' },
    })

    // State for models
    const [models, setModels] = useState(DEMO_MODELS)
    const [isLoadingModels, setIsLoadingModels] = useState(false)

    // Context hooks
    const { useCases } = useUseCases()
    const { prompts } = usePrompts()

    // Load groups and models on mount - intentional: only run on mount
    useEffect(() => {
        fetchGroups()
        fetchModels()
        loadSavedConfiguration()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Load saved configuration from localStorage
    const loadSavedConfiguration = () => {
        try {
            // Load selected documents
            const savedDocs = localStorage.getItem('vulniq_selected_documents')
            if (savedDocs) {
                setSelectedDocuments(new Set(JSON.parse(savedDocs)))
            }

            // Load agent configurations
            const savedConfig = localStorage.getItem('vulniq_agent_configurations')
            if (savedConfig) {
                const config = JSON.parse(savedConfig)
                setAgentConfigs(prev => ({
                    reviewer: { ...prev.reviewer, ...config.reviewer, enabled: true },
                    implementation: { ...prev.implementation, ...config.implementer },
                    tester: { ...prev.tester, ...config.tester },
                    report: { ...prev.report, ...config.reporter },
                }))
            }
        } catch (err) {
            console.error('Error loading saved configuration:', err)
        }
    }

    // Fetch use case groups
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

    // Fetch available models
    const fetchModels = async () => {
        if (isDemoMode) {
            setModels(DEMO_MODELS)
            return
        }

        setIsLoadingModels(true)
        try {
            const response = await fetch('/api/bedrock')
            if (response.ok) {
                const data = await response.json()
                if (data.models && data.models.length > 0) {
                    setModels(data.models.map(m => ({
                        id: m.id,
                        name: m.name || m.id,
                        provider: m.provider || 'Unknown',
                    })))
                }
            }
        } catch (error) {
            console.error('Error fetching models:', error)
            // Keep demo models as fallback
        } finally {
            setIsLoadingModels(false)
        }
    }

    // Fetch PDFs for a use case
    const fetchUseCasePdfs = async (useCaseId) => {
        if (useCasePdfs[useCaseId]) return

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
                            pdfs.push({
                                id: item.id,
                                name: item.name || item.title,
                                size: item.size,
                                s3Key: item.s3Key,
                                vectorized: item.vectorized || false,
                                embeddingStatus: item.embeddingStatus || 'pending',
                            })
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

    // Group use cases by groupId
    const groupedUseCases = useMemo(() => {
        const grouped = {}
        useCaseGroups.forEach(group => {
            grouped[group.id] = {
                ...group,
                useCases: useCases.filter(uc => uc.groupId === group.id)
            }
        })
        // Add ungrouped use cases
        const ungrouped = useCases.filter(uc => !uc.groupId)
        if (ungrouped.length > 0) {
            grouped['ungrouped'] = {
                id: 'ungrouped',
                name: 'Ungrouped',
                useCases: ungrouped
            }
        }
        return grouped
    }, [useCaseGroups, useCases])

    // Toggle group expansion
    const toggleGroup = (groupId) => {
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

    // Toggle document selection
    const toggleDocument = (docId) => {
        setSelectedDocuments(prev => {
            const next = new Set(prev)
            if (next.has(docId)) {
                next.delete(docId)
            } else {
                next.add(docId)
            }
            return next
        })
    }

    // Select all documents in a use case
    const selectAllInUseCase = (useCaseId) => {
        const pdfs = useCasePdfs[useCaseId] || []
        setSelectedDocuments(prev => {
            const next = new Set(prev)
            pdfs.forEach(pdf => next.add(pdf.id))
            return next
        })
    }

    // Deselect all documents in a use case
    const deselectAllInUseCase = (useCaseId) => {
        const pdfs = useCasePdfs[useCaseId] || []
        setSelectedDocuments(prev => {
            const next = new Set(prev)
            pdfs.forEach(pdf => next.delete(pdf.id))
            return next
        })
    }

    // Update agent configuration
    const updateAgentConfig = (agentId, field, value) => {
        setAgentConfigs(prev => ({
            ...prev,
            [agentId]: {
                ...prev[agentId],
                [field]: value,
            }
        }))
    }

    // Get prompts for a specific agent
    const getAgentPrompts = (agentId) => {
        return prompts[agentId] || []
    }

    // Validate configuration
    const validateConfiguration = () => {
        const errors = []

        // Must have at least one document selected
        if (selectedDocuments.size === 0) {
            errors.push('Please select at least one PDF document from the knowledge base')
        }

        // Reviewer agent must have a model selected
        if (!agentConfigs.reviewer.modelId) {
            errors.push('Please select an AI model for the Security Reviewer agent')
        }

        // Reviewer agent must have a prompt selected
        if (!agentConfigs.reviewer.promptId) {
            errors.push('Please select a predefined prompt for the Security Reviewer agent')
        }

        return errors
    }

    // Save configuration and start review
    const handleStartReview = () => {
        const errors = validateConfiguration()
        if (errors.length > 0) {
            errors.forEach(error => toast.error(error))
            return
        }

        // Save configuration to localStorage
        try {
            localStorage.setItem('vulniq_selected_documents', JSON.stringify(Array.from(selectedDocuments)))

            const agentConfigsForSave = {
                reviewer: {
                    enabled: true,
                    modelId: agentConfigs.reviewer.modelId,
                    customPrompt: getPromptTextById('reviewer', agentConfigs.reviewer.promptId),
                    promptId: agentConfigs.reviewer.promptId,
                },
                implementer: {
                    enabled: agentConfigs.implementation.enabled,
                    modelId: agentConfigs.implementation.modelId,
                    customPrompt: agentConfigs.implementation.promptId
                        ? getPromptTextById('implementation', agentConfigs.implementation.promptId)
                        : '',
                    promptId: agentConfigs.implementation.promptId,
                },
                tester: {
                    enabled: agentConfigs.tester.enabled,
                    modelId: agentConfigs.tester.modelId,
                    customPrompt: agentConfigs.tester.promptId
                        ? getPromptTextById('tester', agentConfigs.tester.promptId)
                        : '',
                    promptId: agentConfigs.tester.promptId,
                },
                reporter: {
                    enabled: agentConfigs.report.enabled,
                    modelId: agentConfigs.report.modelId,
                    customPrompt: agentConfigs.report.promptId
                        ? getPromptTextById('report', agentConfigs.report.promptId)
                        : '',
                    promptId: agentConfigs.report.promptId,
                },
            }

            localStorage.setItem('vulniq_agent_configurations', JSON.stringify(agentConfigsForSave))
        } catch (err) {
            console.error('Error saving configuration:', err)
        }

        // Close dialog and trigger review
        onOpenChange(false)
        if (onStartReview) {
            onStartReview(code, codeType)
        }
    }

    // Get prompt text by ID
    const getPromptTextById = (agentId, promptId) => {
        const agentPrompts = prompts[agentId] || []
        const prompt = agentPrompts.find(p => p.id === promptId)
        return prompt?.text || ''
    }

    // Get prompt title by ID
    const getPromptTitleById = (agentId, promptId) => {
        const agentPrompts = prompts[agentId] || []
        const prompt = agentPrompts.find(p => p.id === promptId)
        return prompt?.title || 'Untitled'
    }

    // Count selected documents per use case
    const getSelectedCountForUseCase = (useCaseId) => {
        const pdfs = useCasePdfs[useCaseId] || []
        return pdfs.filter(pdf => selectedDocuments.has(pdf.id)).length
    }

    // Step state for guided navigation
    const [activeTab, setActiveTab] = useState("documents")
    const tabs = ["documents", "agents", "review"]
    const currentStepIndex = tabs.indexOf(activeTab)

    // Step completion states
    const isStep1Complete = selectedDocuments.size > 0
    const isStep2Complete = !!agentConfigs.reviewer.modelId && !!agentConfigs.reviewer.promptId
    const isStep3Complete = isStep1Complete && isStep2Complete
    const overallProgress = Math.round(
        ([isStep1Complete, isStep2Complete, isStep3Complete].filter(Boolean).length / 3) * 100
    )

    const goNext = () => {
        const nextIndex = Math.min(currentStepIndex + 1, tabs.length - 1)
        setActiveTab(tabs[nextIndex])
    }
    const goBack = () => {
        const prevIndex = Math.max(currentStepIndex - 1, 0)
        setActiveTab(tabs[prevIndex])
    }

    const stepConfig = [
        { value: "documents", label: "Documents", icon: FileText, complete: isStep1Complete },
        { value: "agents", label: "Agents", icon: ScanSearch, complete: isStep2Complete },
        { value: "review", label: "Review", icon: CheckCircle, complete: isStep3Complete },
    ]

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ScanSearch className="h-5 w-5 text-primary" />
                        Configure Security Review
                    </DialogTitle>
                    <DialogDescription>
                        Select PDF documents and configure AI agents for your security analysis.
                    </DialogDescription>
                    {/* Progress bar */}
                    <div className="pt-2">
                        <Progress value={overallProgress} className="h-1.5" />
                    </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    {/* Step indicators */}
                    <TabsList className="grid w-full grid-cols-3">
                        {stepConfig.map((step, idx) => {
                            const StepIcon = step.icon
                            return (
                                <TabsTrigger key={step.value} value={step.value} className="flex items-center gap-2">
                                    <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold shrink-0 transition-colors duration-200 ${
                                        step.complete
                                            ? 'bg-emerald-500/20 text-emerald-600'
                                            : activeTab === step.value
                                            ? 'bg-primary/20 text-primary'
                                            : 'bg-muted text-muted-foreground'
                                    }`}>
                                        {step.complete ? '✓' : idx + 1}
                                    </span>
                                    <span className="hidden sm:inline">{step.label}</span>
                                    {step.value === "documents" && selectedDocuments.size > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">
                                            {selectedDocuments.size}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            )
                        })}
                    </TabsList>

                    {/* Documents Tab */}
                    <TabsContent value="documents" className="flex-1 overflow-hidden mt-4">
                        <DocumentSelectionTab
                            groupedUseCases={groupedUseCases}
                            expandedGroups={expandedGroups}
                            toggleGroup={toggleGroup}
                            expandedUseCases={expandedUseCases}
                            toggleUseCase={toggleUseCase}
                            useCasePdfs={useCasePdfs}
                            loadingPdfs={loadingPdfs}
                            selectedDocuments={selectedDocuments}
                            toggleDocument={toggleDocument}
                            selectAllInUseCase={selectAllInUseCase}
                            deselectAllInUseCase={deselectAllInUseCase}
                            getSelectedCountForUseCase={getSelectedCountForUseCase}
                        />
                    </TabsContent>

                    {/* Agents Tab */}
                    <TabsContent value="agents" className="flex-1 overflow-hidden mt-4">
                        <AgentConfigurationTab
                            agents={AGENTS}
                            agentConfigs={agentConfigs}
                            updateAgentConfig={updateAgentConfig}
                            models={models}
                            isLoadingModels={isLoadingModels}
                            fetchModels={fetchModels}
                            getAgentPrompts={getAgentPrompts}
                        />
                    </TabsContent>

                    {/* Review Tab */}
                    <TabsContent value="review" className="flex-1 overflow-hidden mt-4">
                        <ReviewSummaryTab
                            selectedDocuments={selectedDocuments}
                            agentConfigs={agentConfigs}
                            models={models}
                            getPromptTitleById={getPromptTitleById}
                            validateConfiguration={validateConfiguration}
                        />
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-4 flex items-center justify-between sm:justify-between">
                    <div className="flex items-center gap-2">
                        {currentStepIndex > 0 && (
                            <Button variant="outline" onClick={goBack} className="gap-1">
                                <ChevronLeft className="h-4 w-4" />
                                Back
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        {currentStepIndex < tabs.length - 1 ? (
                            <Button onClick={goNext} className="gap-1">
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button onClick={handleStartReview} className="gap-2">
                                <ScanSearch className="h-4 w-4" />
                                Start Security Review
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/**
 * Document Selection Tab Component
 */
function DocumentSelectionTab({
    groupedUseCases,
    expandedGroups,
    toggleGroup,
    expandedUseCases,
    toggleUseCase,
    useCasePdfs,
    loadingPdfs,
    selectedDocuments,
    toggleDocument,
    selectAllInUseCase,
    deselectAllInUseCase,
    getSelectedCountForUseCase,
}) {
    return (
        <div className="space-y-4 h-full flex flex-col">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Knowledge Base Selection</AlertTitle>
                <AlertDescription>
                    Select the PDF documents that should be used as the only external knowledge source
                    for the security analysis. The AI will not reference any other documents.
                </AlertDescription>
            </Alert>

            <ScrollArea className="flex-1 border rounded-lg">
                <div className="p-4 space-y-2">
                    {Object.entries(groupedUseCases).map(([groupId, group]) => {
                        const isExpanded = expandedGroups.has(groupId)
                        const totalDocs = group.useCases.reduce((sum, uc) => {
                            return sum + (useCasePdfs[uc.id]?.length || 0)
                        }, 0)

                        return (
                            <Collapsible
                                key={groupId}
                                open={isExpanded}
                                onOpenChange={() => toggleGroup(groupId)}
                            >
                                <CollapsibleTrigger asChild>
                                    <div className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted/50 hover:border-primary/20 cursor-pointer transition-all duration-150 select-none">
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                        <Folder className="h-4 w-4 text-primary" />
                                        <span className="font-medium flex-1">{group.name}</span>
                                        <Badge variant="outline">
                                            {group.useCases.length} use cases
                                        </Badge>
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="ml-6 space-y-1 border-l pl-4 mt-2">
                                        {group.useCases.map(useCase => {
                                            const isUseCaseExpanded = expandedUseCases.has(useCase.id)
                                            const pdfs = useCasePdfs[useCase.id] || []
                                            const isLoading = loadingPdfs.has(useCase.id)
                                            const selectedCount = getSelectedCountForUseCase(useCase.id)
                                            const allSelected = pdfs.length > 0 && selectedCount === pdfs.length

                                            return (
                                                <Collapsible
                                                    key={useCase.id}
                                                    open={isUseCaseExpanded}
                                                    onOpenChange={() => toggleUseCase(useCase.id)}
                                                >
                                                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                                                        <CollapsibleTrigger asChild>
                                                            <button className="flex items-center gap-2 flex-1">
                                                                {isUseCaseExpanded ? (
                                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                                ) : (
                                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                                )}
                                                                <FileText className="h-3.5 w-3.5 text-severity-high" />
                                                                <span className="text-sm flex-1 text-left">{useCase.title}</span>
                                                            </button>
                                                        </CollapsibleTrigger>
                                                        {isLoading ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                                        ) : pdfs.length > 0 ? (
                                                            <>
                                                                <Badge variant={selectedCount > 0 ? "default" : "secondary"} className="text-xs">
                                                                    {selectedCount}/{pdfs.length}
                                                                </Badge>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 text-xs"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        if (allSelected) {
                                                                            deselectAllInUseCase(useCase.id)
                                                                        } else {
                                                                            selectAllInUseCase(useCase.id)
                                                                        }
                                                                    }}
                                                                >
                                                                    {allSelected ? 'Deselect All' : 'Select All'}
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">No documents</span>
                                                        )}
                                                    </div>
                                                    <CollapsibleContent>
                                                        <div className="ml-6 space-y-1 border-l pl-4 mt-1">
                                                            {isLoading ? (
                                                                <div className="p-2 text-sm text-muted-foreground">
                                                                    Loading documents...
                                                                </div>
                                                            ) : pdfs.length === 0 ? (
                                                                <div className="p-2 text-sm text-muted-foreground">
                                                                    No documents uploaded
                                                                </div>
                                                            ) : (
                                                                pdfs.map(pdf => {
                                                                    const isVectorized = pdf.vectorized && pdf.embeddingStatus === 'completed';
                                                                    const isProcessing = pdf.embeddingStatus === 'processing';
                                                                    const isFailed = pdf.embeddingStatus === 'failed';

                                                                    return (
                                                                    <label
                                                                        key={pdf.id}
                                                                        className="flex items-center gap-2 p-2 rounded hover:bg-muted/30 cursor-pointer transition-colors"
                                                                    >
                                                                        <Checkbox
                                                                            checked={selectedDocuments.has(pdf.id)}
                                                                            onCheckedChange={() => toggleDocument(pdf.id)}
                                                                        />
                                                                        <FileText className="h-3.5 w-3.5 text-destructive" />
                                                                        <span className="text-sm flex-1 truncate">{pdf.name}</span>
                                                                        {/* Vectorization status */}
                                                                        {isVectorized && (
                                                                            <span className="text-[10px] text-emerald-600 flex items-center gap-0.5" title="Vectorized — ready for RAG">
                                                                                <CheckCircle className="h-3 w-3" /> Ready
                                                                            </span>
                                                                        )}
                                                                        {isProcessing && (
                                                                            <span className="text-[10px] text-amber-600 flex items-center gap-0.5" title="Vectorizing...">
                                                                                <Loader2 className="h-3 w-3 animate-spin" /> Vectorizing
                                                                            </span>
                                                                        )}
                                                                        {isFailed && (
                                                                            <span className="text-[10px] text-destructive flex items-center gap-0.5" title="Vectorization failed">
                                                                                <AlertTriangle className="h-3 w-3" /> Failed
                                                                            </span>
                                                                        )}
                                                                        {!isVectorized && !isProcessing && !isFailed && (
                                                                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5" title="Pending vectorization">
                                                                                <Info className="h-3 w-3" /> Pending
                                                                            </span>
                                                                        )}
                                                                        {pdf.size && (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {typeof pdf.size === 'number'
                                                                                    ? `${Math.round(pdf.size / 1024)} KB`
                                                                                    : pdf.size}
                                                                            </span>
                                                                        )}
                                                                    </label>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            )
                                        })}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        )
                    })}

                    {Object.keys(groupedUseCases).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <Folder className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No knowledge base groups found</p>
                            <p className="text-sm">Create groups in the Knowledge Base section</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}

/**
 * Agent Configuration Tab Component
 */
function AgentConfigurationTab({
    agents,
    agentConfigs,
    updateAgentConfig,
    models,
    isLoadingModels,
    fetchModels,
    getAgentPrompts,
}) {
    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <Alert className="flex-1">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Agent Configuration</AlertTitle>
                    <AlertDescription>
                        Configure AI models and prompts for each agent. The Security Reviewer is required
                        and must have a model and prompt selected.
                    </AlertDescription>
                </Alert>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchModels}
                    disabled={isLoadingModels}
                    className="ml-4"
                >
                    {isLoadingModels ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="space-y-4 pr-4">
                    {agents.map(agent => {
                        const config = agentConfigs[agent.id]
                        const agentPrompts = getAgentPrompts(agent.id)
                        const Icon = agent.icon
                        const isFullyConfigured = config.enabled && !!config.modelId && !!config.promptId
                        const isPartial = config.enabled && (!!config.modelId || !!config.promptId)

                        return (
                            <Card key={agent.id} className={`transition-all duration-200 ${
                                !config.enabled ? 'opacity-60' : 
                                isFullyConfigured ? 'border-emerald-500/30 shadow-sm' :
                                isPartial ? 'border-yellow-500/20' : ''
                            }`}>
                                <CardHeader className={`pb-3 rounded-t-lg transition-colors ${
                                    isFullyConfigured ? 'bg-gradient-to-r from-emerald-500/5 to-transparent' : ''
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${agent.bgColor} relative`}>
                                                <Icon className={`h-5 w-5 ${agent.color}`} />
                                                {isFullyConfigured && (
                                                    <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 border border-background">
                                                        <CheckCircle className="h-2 w-2 text-white" />
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    {agent.title}
                                                    {agent.required && (
                                                        <Badge variant="destructive" className="text-xs">Required</Badge>
                                                    )}
                                                    {isFullyConfigured && (
                                                        <Badge variant="default" className="text-[9px] h-4 bg-emerald-500">Ready</Badge>
                                                    )}
                                                </CardTitle>
                                                <CardDescription className="text-xs mt-1">
                                                    {agent.description}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        {!agent.required && (
                                            <Checkbox
                                                checked={config.enabled}
                                                onCheckedChange={(checked) =>
                                                    updateAgentConfig(agent.id, 'enabled', checked)
                                                }
                                            />
                                        )}
                                    </div>
                                </CardHeader>
                                {(config.enabled || agent.required) && (
                                    <CardContent className="space-y-4">
                                        {/* Agent constraints for reviewer */}
                                        {agent.constraints && (
                                            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                    Constraints
                                                </div>
                                                <ul className="space-y-1">
                                                    {agent.constraints.map((constraint, idx) => (
                                                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                                            <CheckCircle className="h-3 w-3 text-success mt-0.5 shrink-0" />
                                                            {constraint}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Model Selection */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">AI Model</label>
                                            <Select
                                                value={config.modelId}
                                                onValueChange={(value) => updateAgentConfig(agent.id, 'modelId', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a model..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {models.map(model => (
                                                        <SelectItem key={model.id} value={model.id}>
                                                            <div className="flex items-center gap-2">
                                                                <span>{model.name}</span>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {model.provider}
                                                                </Badge>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Prompt Selection */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Predefined Prompt</label>
                                            <Select
                                                value={config.promptId}
                                                onValueChange={(value) => updateAgentConfig(agent.id, 'promptId', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a prompt..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {agentPrompts.length === 0 ? (
                                                        <SelectItem value="none" disabled>
                                                            No prompts available
                                                        </SelectItem>
                                                    ) : (
                                                        agentPrompts.map(prompt => (
                                                            <SelectItem key={prompt.id} value={prompt.id}>
                                                                {prompt.title || 'Untitled'}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {agentPrompts.length === 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    Create prompts in the Prompts Configuration section
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        )
                    })}
                </div>
            </ScrollArea>
        </div>
    )
}

/**
 * Review Summary Tab Component - Enhanced with pipeline visualization
 */
function ReviewSummaryTab({
    selectedDocuments,
    agentConfigs,
    models,
    getPromptTitleById,
    validateConfiguration,
}) {
    const errors = validateConfiguration()
    const isValid = errors.length === 0

    // Get model name by ID
    const getModelName = (modelId) => {
        const model = models.find(m => m.id === modelId)
        return model?.name || modelId || 'Not selected'
    }

    // Get enabled agents
    const enabledAgents = Object.entries(agentConfigs).filter(([_, config]) => config.enabled)

    // Pipeline nodes for visual diagram
    const pipelineNodes = [
        { id: 'docs', label: 'Knowledge Base', icon: Database, configured: selectedDocuments.size > 0, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', count: selectedDocuments.size },
        ...AGENTS.filter(a => agentConfigs[a.id]?.enabled || a.required).map(a => ({
            id: a.id,
            label: a.title.replace('Security ', ''),
            icon: a.icon,
            configured: !!agentConfigs[a.id]?.modelId,
            color: a.color,
            bgColor: a.bgColor,
        }))
    ]

    return (
        <div className="space-y-4 h-full flex flex-col">
            {/* Pipeline Flow Diagram */}
            <Card className="border-dashed">
                <CardContent className="p-4">
                    <div className="flex items-center justify-center gap-1 overflow-x-auto py-2">
                        {pipelineNodes.map((node, idx) => {
                            const NodeIcon = node.icon
                            return (
                                <React.Fragment key={node.id}>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.08, duration: 0.3 }}
                                        className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border transition-all duration-200 ${
                                            node.configured
                                                ? 'border-emerald-500/40 bg-emerald-500/5'
                                                : 'border-border bg-muted/30 opacity-50'
                                        }`}
                                    >
                                        <div className={`p-1.5 rounded-md ${node.configured ? node.bgColor : 'bg-muted'}`}>
                                            <NodeIcon className={`h-3.5 w-3.5 ${node.configured ? node.color : 'text-muted-foreground'}`} />
                                        </div>
                                        <span className="text-[9px] font-medium text-center leading-tight max-w-[60px] truncate">
                                            {node.label}
                                        </span>
                                        {node.configured && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        )}
                                    </motion.div>
                                    {idx < pipelineNodes.length - 1 && (
                                        <ArrowRight className={`h-3 w-3 shrink-0 ${
                                            node.configured ? 'text-emerald-500/60' : 'text-muted-foreground/30'
                                        }`} />
                                    )}
                                </React.Fragment>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Status Alert */}
            <AnimatePresence mode="wait">
                {!isValid ? (
                    <motion.div
                        key="incomplete"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                    >
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Configuration Incomplete</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc ml-4 mt-2 space-y-1">
                                    {errors.map((error, idx) => (
                                        <li key={idx}>{error}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    </motion.div>
                ) : (
                    <motion.div
                        key="ready"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                    >
                        <Alert className="border-success/50 bg-success/10">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <AlertTitle className="text-success">Ready to Start</AlertTitle>
                            <AlertDescription className="text-success/80">
                                Your security review configuration is complete. Click &quot;Start Security Review&quot; to begin.
                            </AlertDescription>
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            <ScrollArea className="flex-1">
                <div className="space-y-4 pr-4">
                    {/* Documents Summary */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Database className="h-4 w-4 text-cyan-500" />
                                    Selected Documents
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Badge variant={selectedDocuments.size > 0 ? "default" : "destructive"} className={selectedDocuments.size > 0 ? 'bg-cyan-500' : ''}>
                                        {selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        will be used as knowledge sources
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Agents Summary */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <ScanSearch className="h-4 w-4 text-success" />
                                    Configured Agents
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                        {enabledAgents.length} active
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {enabledAgents.map(([agentId, config], idx) => {
                                    const agentDef = AGENTS.find(a => a.id === agentId)
                                    const Icon = agentDef?.icon || ScanSearch
                                    const hasModel = !!config.modelId
                                    const hasPrompt = !!config.promptId

                                    return (
                                        <motion.div
                                            key={agentId}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.25 + idx * 0.05 }}
                                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                                hasModel && hasPrompt
                                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                                    : hasModel || hasPrompt
                                                    ? 'bg-yellow-500/5 border-yellow-500/20'
                                                    : 'bg-muted/50 border-border'
                                            }`}
                                        >
                                            <div className={`p-1.5 rounded ${agentDef?.bgColor || 'bg-muted'}`}>
                                                <Icon className={`h-4 w-4 ${agentDef?.color || 'text-muted-foreground'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm flex items-center gap-2">
                                                    {agentDef?.title || agentId}
                                                    {hasModel && hasPrompt && (
                                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                                    <div className="flex items-center gap-1">
                                                        {hasModel ? (
                                                            <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                                                        ) : (
                                                            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                                        )}
                                                        <span className="font-medium">Model:</span>{' '}
                                                        {getModelName(config.modelId)}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {hasPrompt ? (
                                                            <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                                                        ) : (
                                                            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                                        )}
                                                        <span className="font-medium">Prompt:</span>{' '}
                                                        {config.promptId
                                                            ? getPromptTitleById(agentId, config.promptId)
                                                            : 'Not selected'}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Constraints Reminder */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-severity-medium" />
                                    Analysis Constraints
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                                        <span>Analysis limited to submitted source code only</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                                        <span>Only {selectedDocuments.size} selected PDF document{selectedDocuments.size !== 1 ? 's' : ''} will be referenced</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                                        <span>Using predefined prompts only - no external knowledge</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                                        <span>Findings will reference specific code and documents</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </ScrollArea>
        </div>
    )
}

