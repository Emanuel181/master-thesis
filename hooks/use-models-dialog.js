"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "@/i18n/navigation"
import { useUseCases } from "@/contexts/useCasesContext"
import { usePrompts } from "@/contexts/promptsContext"
import { DEMO_DOCUMENTS, DEMO_WORKFLOW_CONFIGS } from "@/contexts/demoContext"
import { toast } from "sonner"

// Available AWS Bedrock models with human-friendly names
const DEMO_MODELS = [
    { id: "anthropic.claude-3-5-sonnet-20241022-v2:0", name: "Claude 3.5 Sonnet v2", provider: "Anthropic", description: "State-of-the-art for software engineering and agentic tasks" },
    { id: "anthropic.claude-3-5-haiku-20241022-v1:0", name: "Claude 3.5 Haiku", provider: "Anthropic", description: "Fastest and most cost-effective model" },
    { id: "anthropic.claude-3-sonnet-20240229-v1:0", name: "Claude 3 Sonnet", provider: "Anthropic", description: "Balanced intelligence and speed for enterprise workloads" },
    { id: "anthropic.claude-3-haiku-20240307-v1:0", name: "Claude 3 Haiku", provider: "Anthropic", description: "Fast, compact model for near-instant responses" },
]

const MODELS_PER_PAGE = 5
const PROMPTS_PER_PAGE = 5

/**
 * Custom hook for managing ModelsDialog state and logic.
 * Extracts all state management, API calls, and handlers from the component.
 */
export function useModelsDialog({ codeType }) {
    const { status } = useSession()
    const pathname = usePathname()
    const isDemoMode = pathname?.startsWith('/demo')

    // Agent model selections - initialize from localStorage if available
    const [reviewerModel, setReviewerModel] = useState(() => {
        if (typeof window === 'undefined') return ""
        try {
            const saved = localStorage.getItem('vulniq_agent_configurations')
            if (saved) {
                const config = JSON.parse(saved)
                return config.reviewer?.modelId || ""
            }
        } catch {}
        return ""
    })
    const [implementationModel, setImplementationModel] = useState(() => {
        if (typeof window === 'undefined') return ""
        try {
            const saved = localStorage.getItem('vulniq_agent_configurations')
            if (saved) {
                const config = JSON.parse(saved)
                return config.implementer?.modelId || ""
            }
        } catch {}
        return ""
    })
    const [testerModel, setTesterModel] = useState(() => {
        if (typeof window === 'undefined') return ""
        try {
            const saved = localStorage.getItem('vulniq_agent_configurations')
            if (saved) {
                const config = JSON.parse(saved)
                return config.tester?.modelId || ""
            }
        } catch {}
        return ""
    })
    const [reportModel, setReportModel] = useState(() => {
        if (typeof window === 'undefined') return ""
        try {
            const saved = localStorage.getItem('vulniq_agent_configurations')
            if (saved) {
                const config = JSON.parse(saved)
                return config.reporter?.modelId || ""
            }
        } catch {}
        return ""
    })

    // Knowledge base state - initialize from localStorage if available
    const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState(() => {
        if (typeof window === 'undefined') return []
        try {
            const saved = localStorage.getItem('vulniq_selected_groups')
            if (saved) {
                return JSON.parse(saved)
            }
        } catch {}
        return []
    })
    const [kbDocumentCounts, setKbDocumentCounts] = useState({})
    const [expandedKb, setExpandedKb] = useState(null)
    const [kbPage, setKbPage] = useState(0)
    const [kbSearchTerm, setKbSearchTerm] = useState("")

    // Refresh states
    const [isRefreshingModels, setIsRefreshingModels] = useState(false)
    const [isRefreshingUseCases, setIsRefreshingUseCases] = useState(false)
    const [isRefreshingAll, setIsRefreshingAll] = useState(false)
    const [isRefreshingPrompts, setIsRefreshingPrompts] = useState({})
    const [isRefreshingAllPrompts, setIsRefreshingAllPrompts] = useState(false)
    const [isRefreshingKb, setIsRefreshingKb] = useState({})

    // Prompt viewing state
    const [viewPrompt, setViewPrompt] = useState(null)
    const [currentPage, setCurrentPage] = useState({})
    const [agentPage, setAgentPage] = useState(0)

    // Pagination state for dropdowns
    const [modelDropdownPage, setModelDropdownPage] = useState({
        reviewer: 0,
        implementation: 0,
        tester: 0,
        report: 0,
    })
    const [promptDropdownPage, setPromptDropdownPage] = useState({
        reviewer: 0,
        implementation: 0,
        tester: 0,
        report: 0,
    })

    // Search state for dropdowns
    const [modelSearchTerm, setModelSearchTerm] = useState({
        reviewer: "",
        implementation: "",
        tester: "",
        report: "",
    })
    const [promptSearchTerm, setPromptSearchTerm] = useState({
        reviewer: "",
        implementation: "",
        tester: "",
        report: "",
    })

    // System prompts
    const [selectedSystemPrompts, setSelectedSystemPrompts] = useState({
        reviewer: "",
        implementation: "",
        tester: "",
        report: "",
    })

    // Models list
    const [models, setModels] = useState([])

    // Context hooks
    const { useCases, refresh: refreshUseCases } = useUseCases()
    const { prompts, selectedPrompts, handlePromptChange, setPromptForAgent } = usePrompts()

    // Initialize document counts for demo mode
    useEffect(() => {
        if (isDemoMode && useCases.length > 0 && Object.keys(kbDocumentCounts).length === 0) {
            const mockCounts = {}
            useCases.forEach(kb => {
                mockCounts[kb.id] = (DEMO_DOCUMENTS[kb.id] || []).length
            })
            setKbDocumentCounts(mockCounts)
        }
    }, [isDemoMode, useCases, kbDocumentCounts])

    // Auto-persist selectedPrompts to localStorage for cross-tab sync
    useEffect(() => {
        if (selectedPrompts && Object.keys(selectedPrompts).length > 0) {
            try {
                localStorage.setItem('vulniq_selected_prompts', JSON.stringify(selectedPrompts))
            } catch (err) {
                console.error('Error auto-saving selected prompts:', err)
            }
        }
    }, [selectedPrompts])

    // Ref to track if we're syncing to prevent infinite loops
    const isSyncingRef = useRef(false)
    const initialSyncDoneRef = useRef(false)

    // On mount: Sync selectedPrompts (context) -> selectedSystemPrompts (local)
    // This ensures that if workflow tab already has selections, agents tab shows them
    useEffect(() => {
        if (initialSyncDoneRef.current) return

        const agents = ['reviewer', 'implementation', 'tester', 'report']
        const newSystemPrompts = { reviewer: '', implementation: '', tester: '', report: '' }
        let hasSelections = false

        agents.forEach(agent => {
            const contextPromptIds = selectedPrompts[agent] || []
            if (contextPromptIds.length > 0) {
                newSystemPrompts[agent] = contextPromptIds[0]
                hasSelections = true
            }
        })

        if (hasSelections) {
            setSelectedSystemPrompts(newSystemPrompts)
        }
        initialSyncDoneRef.current = true
    }, [selectedPrompts])

    // Create a wrapped setter for selectedSystemPrompts that also syncs to context
    const setSelectedSystemPromptsWithSync = useCallback((newValueOrUpdater) => {
        setSelectedSystemPrompts(prev => {
            const newValue = typeof newValueOrUpdater === 'function'
                ? newValueOrUpdater(prev)
                : newValueOrUpdater

            // Sync changes to context using setPromptForAgent (no toggle behavior)
            if (!isSyncingRef.current) {
                isSyncingRef.current = true
                const agents = ['reviewer', 'implementation', 'tester', 'report']
                agents.forEach(agent => {
                    const newPromptId = newValue[agent]
                    const oldPromptId = prev[agent]
                    const contextPromptIds = selectedPrompts[agent] || []
                    const contextFirstPrompt = contextPromptIds[0] || ''

                    // Only update if there's an actual change and context doesn't match
                    if (newPromptId !== oldPromptId && newPromptId !== contextFirstPrompt) {
                        // Use setPromptForAgent for direct setting without toggle
                        setPromptForAgent(agent, newPromptId || '')
                    }
                })
                // Reset sync flag after a short delay to allow state to settle
                setTimeout(() => { isSyncingRef.current = false }, 100)
            }

            return newValue
        })
    }, [selectedPrompts, setPromptForAgent])

    // Continuous sync: selectedPrompts (context) -> selectedSystemPrompts (local)
    // This ensures changes from Workflow visualization are reflected in Agents tab
    useEffect(() => {
        if (isSyncingRef.current) return // Don't sync while we're already syncing

        const agents = ['reviewer', 'implementation', 'tester', 'report']
        let needsUpdate = false
        const newSystemPrompts = { ...selectedSystemPrompts }

        agents.forEach(agent => {
            const contextPromptIds = selectedPrompts[agent] || []
            const currentSystemPrompt = selectedSystemPrompts[agent]

            // If context has a selection
            if (contextPromptIds.length > 0) {
                const contextFirstPrompt = contextPromptIds[0]
                // Update if local doesn't match context
                if (currentSystemPrompt !== contextFirstPrompt) {
                    newSystemPrompts[agent] = contextFirstPrompt
                    needsUpdate = true
                }
            } else if (currentSystemPrompt && currentSystemPrompt !== 'none' && currentSystemPrompt !== '') {
                // Context is empty but local has a value - clear local
                newSystemPrompts[agent] = ''
                needsUpdate = true
            }
        })

        if (needsUpdate) {
            setSelectedSystemPrompts(newSystemPrompts)
        }
    }, [selectedPrompts]) // Only depend on selectedPrompts to avoid loops

    // Auto-persist selectedKnowledgeBases to localStorage for cross-tab sync
    useEffect(() => {
        if (selectedKnowledgeBases && selectedKnowledgeBases.length > 0) {
            try {
                localStorage.setItem('vulniq_selected_groups', JSON.stringify(selectedKnowledgeBases))
            } catch (err) {
                console.error('Error auto-saving selected knowledge bases:', err)
            }
        }
    }, [selectedKnowledgeBases])

    // Auto-select knowledge base when codeType changes
    useEffect(() => {
        if (codeType && selectedKnowledgeBases.length === 0) {
            setSelectedKnowledgeBases([codeType])
        }
    }, [codeType, selectedKnowledgeBases.length])

    // Set models from Terraform configuration on mount
    useEffect(() => {
        if (status === "loading") return

        // Always use the Terraform-configured models
        setModels(DEMO_MODELS)
    }, [status])

    // In demo mode, pre-populate agent models and KB selections from per-repo configs
    useEffect(() => {
        if (!isDemoMode) return
        // Only apply if no models are configured yet (first load)
        if (reviewerModel && implementationModel && testerModel && reportModel) return

        // Try to determine the current demo project from localStorage or use default
        let currentProject = 'demo-org/vulnerable-express-app'
        try {
            const saved = sessionStorage.getItem('vulniq_demo_current_project')
            if (saved) currentProject = saved
        } catch {}

        const config = DEMO_WORKFLOW_CONFIGS[currentProject] || DEMO_WORKFLOW_CONFIGS['demo-org/vulnerable-express-app']
        if (!config) return

        if (config.agentModels) {
            setReviewerModel(prev => prev || config.agentModels.reviewer || '')
            setImplementationModel(prev => prev || config.agentModels.implementation || '')
            setTesterModel(prev => prev || config.agentModels.tester || '')
            setReportModel(prev => prev || config.agentModels.report || '')
        }
        if (config.selectedKnowledgeBases) {
            setSelectedKnowledgeBases(prev => prev.length > 0 ? prev : config.selectedKnowledgeBases)
        }
    }, [isDemoMode]) // eslint-disable-line react-hooks/exhaustive-deps

    // Helper functions for pagination with search
    const getFilteredModels = useCallback((agent) => {
        const searchTerm = modelSearchTerm[agent] || ""
        if (!searchTerm) return models
        return models.filter(model =>
            model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            model.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (model.provider || "").toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [models, modelSearchTerm])

    const getPaginatedModels = useCallback((agent) => {
        const filtered = getFilteredModels(agent)
        const page = modelDropdownPage[agent] || 0
        const paginated = filtered.slice(page * MODELS_PER_PAGE, (page + 1) * MODELS_PER_PAGE)
        return paginated
    }, [getFilteredModels, modelDropdownPage])

    const getTotalModelPages = useCallback((agent) => {
        return Math.ceil(getFilteredModels(agent).length / MODELS_PER_PAGE)
    }, [getFilteredModels])

    const getFilteredPrompts = useCallback((agent) => {
        const searchTerm = promptSearchTerm[agent] || ""
        const agentPrompts = prompts[agent] || []
        if (!searchTerm) return agentPrompts
        return agentPrompts.filter(p => (p.title || "").toLowerCase().includes(searchTerm.toLowerCase()))
    }, [prompts, promptSearchTerm])

    const getPaginatedPrompts = useCallback((agent) => {
        const filtered = getFilteredPrompts(agent)
        const page = promptDropdownPage[agent] || 0
        return filtered.slice(page * PROMPTS_PER_PAGE, (page + 1) * PROMPTS_PER_PAGE)
    }, [getFilteredPrompts, promptDropdownPage])

    const getTotalPromptPages = useCallback((agent) => {
        return Math.ceil(getFilteredPrompts(agent).length / PROMPTS_PER_PAGE)
    }, [getFilteredPrompts])

    // Agent models object
    const agentModels = {
        reviewer: reviewerModel,
        implementation: implementationModel,
        tester: testerModel,
        report: reportModel,
    }

    // Helper: check if a prompt ID actually exists in the fetched prompts for an agent
    const isValidPromptSelection = (agent, promptId) => {
        if (!promptId) return false
        const agentPrompts = prompts[agent] || []
        return agentPrompts.some(p => p.id === promptId)
    }

    // Configuration readiness status
    const configStatus = {
        agents: {
            reviewer: { hasModel: !!reviewerModel, hasPrompt: isValidPromptSelection('reviewer', selectedSystemPrompts.reviewer) },
            implementation: { hasModel: !!implementationModel, hasPrompt: isValidPromptSelection('implementation', selectedSystemPrompts.implementation) },
            tester: { hasModel: !!testerModel, hasPrompt: isValidPromptSelection('tester', selectedSystemPrompts.tester) },
            report: { hasModel: !!reportModel, hasPrompt: isValidPromptSelection('report', selectedSystemPrompts.report) },
        },
        configuredAgents: [reviewerModel, implementationModel, testerModel, reportModel].filter(Boolean).length,
        promptedAgents: ['reviewer', 'implementation', 'tester', 'report']
            .filter(agent => isValidPromptSelection(agent, selectedSystemPrompts[agent])).length,
        totalAgents: 4,
        selectedKbCount: selectedKnowledgeBases.length,
    }

    // Handlers
    const handleModelChange = useCallback((agentId, model) => {
        switch(agentId) {
            case 'reviewer':
                setReviewerModel(model)
                break
            case 'implementation':
                setImplementationModel(model)
                break
            case 'tester':
                setTesterModel(model)
                break
            case 'report':
                setReportModel(model)
                break
        }
    }, [])

    // Helper to get prompt text by ID
    const getPromptTextById = useCallback((agentId, promptId) => {
        if (!promptId) return '';
        const agentPrompts = prompts[agentId] || [];
        const prompt = agentPrompts.find(p => p.id === promptId);
        return prompt?.text || '';
    }, [prompts]);

    // Auto-persist agent models + prompts whenever they change (single source of truth)
    useEffect(() => {
        try {
            const agentConfigurations = {
                reviewer: {
                    enabled: true,
                    modelId: reviewerModel || 'anthropic.claude-3-sonnet-20240229-v1:0',
                    customPrompt: getPromptTextById('reviewer', selectedSystemPrompts.reviewer),
                    promptId: selectedSystemPrompts.reviewer || '',
                },
                implementer: {
                    enabled: !!implementationModel,
                    modelId: implementationModel || 'anthropic.claude-3-sonnet-20240229-v1:0',
                    customPrompt: getPromptTextById('implementation', selectedSystemPrompts.implementation),
                    promptId: selectedSystemPrompts.implementation || '',
                },
                tester: {
                    enabled: !!testerModel,
                    modelId: testerModel || 'anthropic.claude-3-sonnet-20240229-v1:0',
                    customPrompt: getPromptTextById('tester', selectedSystemPrompts.tester),
                    promptId: selectedSystemPrompts.tester || '',
                },
                reporter: {
                    enabled: true,
                    modelId: reportModel || 'anthropic.claude-3-sonnet-20240229-v1:0',
                    customPrompt: getPromptTextById('report', selectedSystemPrompts.report),
                    promptId: selectedSystemPrompts.report || '',
                },
            }
            localStorage.setItem('vulniq_agent_configurations', JSON.stringify(agentConfigurations))
        } catch (err) {
            console.error('Error auto-saving agent models:', err)
        }
    }, [reviewerModel, implementationModel, testerModel, reportModel, selectedSystemPrompts, getPromptTextById])

    const toggleKnowledgeBase = useCallback((kbId) => {
        setSelectedKnowledgeBases(prev => {
            if (prev.includes(kbId)) {
                if (prev.length === 1) return prev
                return prev.filter(id => id !== kbId)
            }
            return [...prev, kbId]
        })
    }, [])

    const truncateText = useCallback((text, maxLength = 100) => {
        if (text.length <= maxLength) return text
        return text.substring(0, maxLength) + '...'
    }, [])

    // Refresh handlers
    const handleRefreshModels = useCallback(async () => {
        setIsRefreshingModels(true)
        
        // Always use Terraform-configured models
        await new Promise(resolve => setTimeout(resolve, 500))
        setModels(DEMO_MODELS)
        toast.success("Models refreshed successfully!")
        setIsRefreshingModels(false)
    }, [])

    const handleRefreshUseCases = useCallback(async () => {
        setIsRefreshingUseCases(true)
        
        if (isDemoMode) {
            await new Promise(resolve => setTimeout(resolve, 800))
            toast.success("Knowledge bases refreshed successfully!")
            setIsRefreshingUseCases(false)
            return
        }
        
        try {
            await refreshUseCases()
            toast.success("Knowledge bases refreshed successfully!")
        } catch (error) {
            toast.error("Failed to refresh knowledge bases")
        } finally {
            setIsRefreshingUseCases(false)
        }
    }, [isDemoMode, refreshUseCases])

    const handleRefreshAgentPrompts = useCallback(async (agent) => {
        setIsRefreshingPrompts(prev => ({ ...prev, [agent]: true }))
        try {
            await new Promise(resolve => setTimeout(resolve, 1500))
            toast.success(`${agent.charAt(0).toUpperCase() + agent.slice(1)} prompts refreshed successfully!`)
        } catch (error) {
            toast.error(`Failed to refresh ${agent} prompts`)
        } finally {
            setIsRefreshingPrompts(prev => ({ ...prev, [agent]: false }))
        }
    }, [])

    const handleRefreshKnowledgeBase = useCallback(async (kbId, kbTitle) => {
        setIsRefreshingKb(prev => ({ ...prev, [kbId]: true }))
        try {
            await new Promise(resolve => setTimeout(resolve, 1500))
            
            if (isDemoMode) {
                const docCount = (DEMO_DOCUMENTS[kbId] || []).length
                const addedDocs = Math.floor(Math.random() * 3)
                toast.success(`"${kbTitle}" refreshed! ${docCount} documents indexed${addedDocs > 0 ? `, ${addedDocs} new document(s) found.` : '.'}`)
            } else {
                toast.success(`"${kbTitle}" documents refreshed successfully!`)
            }
        } catch (error) {
            toast.error(`Failed to refresh "${kbTitle}" documents`)
        } finally {
            setIsRefreshingKb(prev => ({ ...prev, [kbId]: false }))
        }
    }, [isDemoMode])

    const handleRefreshAll = useCallback(async () => {
        setIsRefreshingAll(true)
        setIsRefreshingModels(true)
        setIsRefreshingUseCases(true)
        const agents = Object.keys(prompts)
        agents.forEach(agent => {
            setIsRefreshingPrompts(prev => ({ ...prev, [agent]: true }))
        })
        useCases.forEach(kb => {
            setIsRefreshingKb(prev => ({ ...prev, [kb.id]: true }))
        })
        
        try {
            await Promise.all([
                (async () => {
                    await new Promise(resolve => setTimeout(resolve, 500))
                    setModels(DEMO_MODELS)
                })(),
                (async () => {
                    if (isDemoMode) {
                        await new Promise(resolve => setTimeout(resolve, 800))
                    } else {
                        await refreshUseCases()
                    }
                })(),
                new Promise(resolve => setTimeout(resolve, 800)),
            ])
            toast.success("All configurations refreshed successfully!")
        } catch (error) {
            toast.error("Failed to refresh some configurations")
        } finally {
            setIsRefreshingAll(false)
            setIsRefreshingModels(false)
            setIsRefreshingUseCases(false)
            agents.forEach(agent => {
                setIsRefreshingPrompts(prev => ({ ...prev, [agent]: false }))
            })
            useCases.forEach(kb => {
                setIsRefreshingKb(prev => ({ ...prev, [kb.id]: false }))
            })
        }
    }, [isDemoMode, prompts, useCases, refreshUseCases])

    const handleRefreshAllAgents = useCallback(async () => {
        setIsRefreshingModels(true)
        const agents = Object.keys(prompts)
        agents.forEach(agent => {
            setIsRefreshingPrompts(prev => ({ ...prev, [agent]: true }))
        })
        
        try {
            await new Promise(resolve => setTimeout(resolve, 500))
            setModels(DEMO_MODELS)
            toast.success("All agent configurations refreshed successfully!")
        } catch (error) {
            toast.error("Failed to refresh agent configurations")
        } finally {
            setIsRefreshingModels(false)
            agents.forEach(agent => {
                setIsRefreshingPrompts(prev => ({ ...prev, [agent]: false }))
            })
        }
    }, [prompts])

    const handleRefreshAllPrompts = useCallback(async () => {
        setIsRefreshingAllPrompts(true)
        const agents = Object.keys(prompts)
        agents.forEach(agent => {
            setIsRefreshingPrompts(prev => ({ ...prev, [agent]: true }))
        })
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1200))
            toast.success("All prompts refreshed successfully!")
        } catch (error) {
            toast.error("Failed to refresh prompts")
        } finally {
            setIsRefreshingAllPrompts(false)
            agents.forEach(agent => {
                setIsRefreshingPrompts(prev => ({ ...prev, [agent]: false }))
            })
        }
    }, [prompts])

    const handleRefreshAllKnowledgeBases = useCallback(async () => {
        setIsRefreshingUseCases(true)
        useCases.forEach(kb => {
            setIsRefreshingKb(prev => ({ ...prev, [kb.id]: true }))
        })
        
        try {
            if (isDemoMode) {
                await new Promise(resolve => setTimeout(resolve, 800))
            } else {
                await refreshUseCases()
            }
            toast.success("All knowledge bases refreshed successfully!")
        } catch (error) {
            toast.error("Failed to refresh knowledge bases")
        } finally {
            setIsRefreshingUseCases(false)
            useCases.forEach(kb => {
                setIsRefreshingKb(prev => ({ ...prev, [kb.id]: false }))
            })
        }
    }, [isDemoMode, useCases, refreshUseCases])

    return {
        // State
        isDemoMode,
        models,
        agentModels,
        configStatus,
        selectedKnowledgeBases,
        kbDocumentCounts,
        expandedKb,
        kbPage,
        kbSearchTerm,
        viewPrompt,
        currentPage,
        agentPage,
        modelDropdownPage,
        promptDropdownPage,
        modelSearchTerm,
        promptSearchTerm,
        selectedSystemPrompts,

        // Refresh states
        isRefreshingModels,
        isRefreshingUseCases,
        isRefreshingAll,
        isRefreshingPrompts,
        isRefreshingAllPrompts,
        isRefreshingKb,

        // Context data
        useCases,
        prompts,
        selectedPrompts,

        // Setters
        setExpandedKb,
        setKbPage,
        setKbSearchTerm,
        setViewPrompt,
        setCurrentPage,
        setAgentPage,
        setModelDropdownPage,
        setPromptDropdownPage,
        setModelSearchTerm,
        setPromptSearchTerm,
        setSelectedSystemPrompts: setSelectedSystemPromptsWithSync,

        // Pagination helpers
        getPaginatedModels,
        getTotalModelPages,
        getPaginatedPrompts,
        getTotalPromptPages,

        // Handlers
        handleModelChange,
        handlePromptChange,
        toggleKnowledgeBase,
        truncateText,
        handleRefreshModels,
        handleRefreshUseCases,
        handleRefreshAgentPrompts,
        handleRefreshKnowledgeBase,
        handleRefreshAll,
        handleRefreshAllAgents,
        handleRefreshAllPrompts,
        handleRefreshAllKnowledgeBases,

        // Constants
        MODELS_PER_PAGE,
        PROMPTS_PER_PAGE,
        kbPerPage: 4,
    }
}
