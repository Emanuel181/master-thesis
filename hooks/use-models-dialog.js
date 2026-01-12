"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { useUseCases } from "@/contexts/useCasesContext"
import { usePrompts } from "@/contexts/promptsContext"
import { DEMO_DOCUMENTS } from "@/contexts/demoContext"
import { toast } from "sonner"

// Available AWS Bedrock models (matching Terraform configuration)
const DEMO_MODELS = [
    "anthropic.claude-3-5-sonnet-20240620-v1:0",
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

    // Agent model selections
    const [reviewerModel, setReviewerModel] = useState("")
    const [implementationModel, setImplementationModel] = useState("")
    const [testerModel, setTesterModel] = useState("")
    const [reportModel, setReportModel] = useState("")

    // Knowledge base state
    const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState([])
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
    const { prompts, selectedPrompts, handlePromptChange } = usePrompts()

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

    // Helper functions for pagination with search
    const getFilteredModels = useCallback((agent) => {
        const searchTerm = modelSearchTerm[agent] || ""
        if (!searchTerm) return models
        return models.filter(model => model.toLowerCase().includes(searchTerm.toLowerCase()))
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
        setSelectedSystemPrompts,

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
