"use client"

import dynamic from "next/dynamic"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScanSearch, Wrench, BugPlay, FileText, Database, RefreshCw, ChevronDown, ChevronRight, Folder, File } from "lucide-react"
// Lazy-load ReactFlow visualization to reduce initial bundle size (~200KB)
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
);
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUseCases } from "@/contexts/useCasesContext"
import { DEMO_DOCUMENTS } from "@/contexts/demoContext"
import * as LucideIcons from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { usePrompts } from "@/contexts/promptsContext"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"

// Demo mode mock models
const DEMO_MODELS = [
    "Claude 3.5 Sonnet",
    "Claude 3 Opus",
    "Claude 3 Haiku",
    "GPT-4 Turbo",
    "GPT-4o",
    "GPT-4o Mini",
    "Gemini 1.5 Pro",
    "Gemini 1.5 Flash",
    "Llama 3.1 70B",
    "Llama 3.1 8B",
    "Mistral Large",
    "Mistral Medium",
];

export function ModelsDialog({ isOpen, onOpenChange, codeType, onCodeTypeChange }) {
    const { status } = useSession();
    const pathname = usePathname();
    const isDemoMode = pathname?.startsWith('/demo');
    
    const [reviewerModel, setReviewerModel] = React.useState("");
    const [implementationModel, setImplementationModel] = React.useState("");
    const [testerModel, setTesterModel] = React.useState("");
    const [reportModel, setReportModel] = React.useState("");
    // Auto-select based on code type
    const [selectedKnowledgeBases, setSelectedKnowledgeBases] = React.useState([]);
    const [isRefreshingModels, setIsRefreshingModels] = React.useState(false);
    const [isRefreshingUseCases, setIsRefreshingUseCases] = React.useState(false);
    const [viewPrompt, setViewPrompt] = React.useState(null);
    const [currentPage, setCurrentPage] = React.useState({});
    const [agentPage, setAgentPage] = React.useState(0);
    const [kbDocumentCounts, setKbDocumentCounts] = React.useState({});
    const [isRefreshingKb, setIsRefreshingKb] = React.useState({});
    const [expandedKb, setExpandedKb] = React.useState(null);
    const [kbPage, setKbPage] = React.useState(0);
    const kbPerPage = 4;

    const { useCases, refresh: refreshUseCases } = useUseCases();

    // Initialize document counts for demo mode from DEMO_DOCUMENTS
    React.useEffect(() => {
        if (isDemoMode && useCases.length > 0 && Object.keys(kbDocumentCounts).length === 0) {
            const mockCounts = {};
            useCases.forEach(kb => {
                // Use actual DEMO_DOCUMENTS count if available
                mockCounts[kb.id] = (DEMO_DOCUMENTS[kb.id] || []).length;
            });
            setKbDocumentCounts(mockCounts);
        }
    }, [isDemoMode, useCases, kbDocumentCounts]);

    const {
        prompts,
        selectedPrompts,
        handlePromptChange,
    } = usePrompts();

    // Auto-select knowledge base when codeType changes
    React.useEffect(() => {
        if (codeType && selectedKnowledgeBases.length === 0) {
            setSelectedKnowledgeBases([codeType]);
        }
    }, [codeType, selectedKnowledgeBases.length]);

    // Models list - will be populated from database/API
    // TODO: Fetch models from AWS backend
    const [models, _setModels] = React.useState([]);

    const toggleKnowledgeBase = (kbId) => {
        setSelectedKnowledgeBases(prev => {
            if (prev.includes(kbId)) {
                // Prevent deselecting if it's the last one
                if (prev.length === 1) return prev;
                return prev.filter(id => id !== kbId);
            } else {
                return [...prev, kbId];
            }
        });
    };

    const agentModels = {
        reviewer: reviewerModel,
        implementation: implementationModel,
        tester: testerModel,
        report: reportModel,
    };

    const handleModelChange = (agentId, model) => {
        switch(agentId) {
            case 'reviewer':
                setReviewerModel(model);
                break;
            case 'implementation':
                setImplementationModel(model);
                break;
            case 'tester':
                setTesterModel(model);
                break;
            case 'report':
                setReportModel(model);
                break;
        }
    };

    const handleRefreshModels = async () => {
        setIsRefreshingModels(true);
        
        // Demo mode - simulate refresh with animation
        if (isDemoMode) {
            await new Promise(resolve => setTimeout(resolve, 800));
            _setModels(DEMO_MODELS);
            toast.success("Models refreshed successfully!");
            setIsRefreshingModels(false);
            return;
        }
        
        try {
            const response = await fetch('/api/bedrock');
            if (response.ok) {
                const data = await response.json();
                _setModels(data.models.map(model => model.name));
                toast.success("Models refreshed successfully!");
            } else {
                const errorData = await response.json();
                console.error('Error refreshing models:', errorData.error);
                toast.error(`AWS Bedrock Error: ${errorData.error}`);
                throw new Error(errorData.error);
            }
        } catch (error) {
            console.error('Error refreshing models:', error);
            toast.error("Failed to refresh models from AWS Bedrock");
        } finally {
            setIsRefreshingModels(false);
        }
    };

    const handleRefreshUseCases = async () => {
        setIsRefreshingUseCases(true);
        
        // Demo mode - simulate refresh with animation
        if (isDemoMode) {
            await new Promise(resolve => setTimeout(resolve, 800));
            toast.success("Knowledge bases refreshed successfully!");
            setIsRefreshingUseCases(false);
            return;
        }
        
        try {
            await refreshUseCases();
            toast.success("Knowledge bases refreshed successfully!");
        } catch (error) {
            toast.error("Failed to refresh knowledge bases");
        } finally {
            setIsRefreshingUseCases(false);
        }
    };

    const truncateText = (text, maxLength = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const [isRefreshingPrompts, setIsRefreshingPrompts] = React.useState({});

    const handleRefreshAgentPrompts = async (agent) => {
        setIsRefreshingPrompts(prev => ({ ...prev, [agent]: true }));
        try {
            // Simulate API call to refresh prompts for specific agent
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success(`${agent.charAt(0).toUpperCase() + agent.slice(1)} prompts refreshed successfully!`);
        } catch (error) {
            toast.error(`Failed to refresh ${agent} prompts`);
        } finally {
            setIsRefreshingPrompts(prev => ({ ...prev, [agent]: false }));
        }
    };

    const handleRefreshKnowledgeBase = async (kbId, kbTitle) => {
        setIsRefreshingKb(prev => ({ ...prev, [kbId]: true }));
        try {
            // Simulate API call to refresh documents in specific knowledge base
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // In demo mode, show the actual document count from DEMO_DOCUMENTS
            if (isDemoMode) {
                const docCount = (DEMO_DOCUMENTS[kbId] || []).length;
                const addedDocs = Math.floor(Math.random() * 3); // Simulate 0-2 new docs found
                toast.success(`"${kbTitle}" refreshed! ${docCount} documents indexed${addedDocs > 0 ? `, ${addedDocs} new document(s) found.` : '.'}`);
            } else {
                toast.success(`"${kbTitle}" documents refreshed successfully!`);
            }
        } catch (error) {
            toast.error(`Failed to refresh "${kbTitle}" documents`);
        } finally {
            setIsRefreshingKb(prev => ({ ...prev, [kbId]: false }));
        }
    };

    // Fetch models from AWS Bedrock on component mount
    React.useEffect(() => {
        if (status === "loading") return;

        // Demo mode - use mock models
        if (isDemoMode) {
            _setModels(DEMO_MODELS);
            return;
        }

        if (status === "unauthenticated") {
            _setModels(["GPT-4", "Claude-3", "Gemini-1.5", "Llama-3"]);
            return;
        }

        const fetchAgents = async () => {
            try {
                const response = await fetch('/api/bedrock/agents');
                if (response.ok) {
                    const data = await response.json();
                    _setModels(data.agents.map(agent => agent.name));
                } else {
                    const errorData = await response.json();
                    console.error('Failed to fetch agents:', errorData.error);
                    toast.error(`AWS Bedrock Error: ${errorData.error}`);
                    // Fallback to some default models
                    _setModels(["GPT-4", "Claude-3", "Gemini-1.5", "Llama-3"]);
                }
            } catch (error) {
                console.error('Error fetching agents:', error);
                toast.error("Failed to connect to AWS Bedrock. Using fallback models.");
                // Fallback to some default models
                _setModels(["GPT-4", "Claude-3", "Gemini-1.5", "Llama-3"]);
            }
        };

        fetchAgents();
    }, [status, isDemoMode]);

    const [selectedSystemPrompts, setSelectedSystemPrompts] = React.useState({
        reviewer: "",
        implementation: "",
        tester: "",
        report: "",
    });

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-7xl">
                    <DrawerHeader>
                        <DrawerTitle>Configure AI Agent Workflow</DrawerTitle>
                        <DrawerDescription>
                            Visualize your code workflow and select AI models for each agent.
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4">
                        <Tabs defaultValue="workflow" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4 h-auto">
                                <TabsTrigger value="workflow" className="text-xs sm:text-sm px-2 py-2">
                                    <span className="hidden sm:inline">Workflow Visualization</span>
                                    <span className="sm:hidden">Workflow</span>
                                </TabsTrigger>
                                <TabsTrigger value="models" className="text-xs sm:text-sm px-2 py-2">
                                    <span className="hidden sm:inline">Agents Configuration</span>
                                    <span className="sm:hidden">Agents</span>
                                </TabsTrigger>
                                <TabsTrigger value="prompts" className="text-xs sm:text-sm px-2 py-2">
                                    <span className="hidden sm:inline">Prompts Configuration</span>
                                    <span className="sm:hidden">Prompts</span>
                                </TabsTrigger>
                                <TabsTrigger value="knowledge" className="text-xs sm:text-sm px-2 py-2">
                                    <span className="hidden sm:inline">Knowledge Base</span>
                                    <span className="sm:hidden">Knowledge</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="workflow" className="mt-0">
                                <ScrollArea className="h-[calc(100vh-280px)] sm:h-[calc(100vh-240px)]">
                                    <div className="space-y-4 pr-4">
                                        <div className="text-sm text-muted-foreground mb-4">
                                            Your code flows through a series of AI agents. Each agent can use a different model. Select models directly in the workflow below:
                                        </div>
                                        <AIWorkflowVisualization
                                            models={models}
                                            agentModels={agentModels}
                                            onModelChange={handleModelChange}
                                            knowledgeBases={useCases.map(uc => ({
                                                id: uc.id,
                                                name: uc.title,
                                                description: uc.content,
                                                icon: uc.icon
                                            }))}
                                            selectedKnowledgeBases={selectedKnowledgeBases}
                                            onKnowledgeBaseChange={toggleKnowledgeBase}
                                            codeType={codeType}
                                            onCodeTypeChange={onCodeTypeChange}
                                            useCases={useCases}
                                            prompts={prompts}
                                            selectedPrompts={selectedPrompts}
                                            selectedSystemPrompts={selectedSystemPrompts}
                                            onPromptChange={handlePromptChange}
                                            onSave={() => {
                                                // Here you would typically save the configuration
                                                onOpenChange(false);
                                            }}
                                            onCancel={() => onOpenChange(false)}
                                        />
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="models" className="mt-0">
                                <ScrollArea className="h-[calc(100vh-280px)] sm:h-[calc(100vh-240px)]">
                                    <div className="pr-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                                            <div>
                                                <h3 className="text-lg font-semibold">Agent Configuration</h3>
                                                <p className="text-sm text-muted-foreground">Select AI models for each agent in the workflow</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                title="Refresh available models"
                                                onClick={handleRefreshModels}
                                                disabled={isRefreshingModels}
                                            >
                                                {isRefreshingModels ? (
                                                    <>
                                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                        <span className="hidden sm:inline">Refreshing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw className="h-4 w-4 sm:mr-2" />
                                                        <span className="hidden sm:inline">Refresh Models</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-lg font-medium">Reviewer Agent</CardTitle>
                                            <ScanSearch className="w-6 h-6 text-blue-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <Label htmlFor="reviewer-model" className="text-xs font-medium mb-1 block">Model</Label>
                                                        <Select id="reviewer-model" value={reviewerModel} onValueChange={setReviewerModel}>
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue placeholder="Select model" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <div onWheelCapture={(e) => e.stopPropagation()}>
                                                                    <ScrollArea className="h-[200px]">
                                                                        {models.map((model, idx) => (
                                                                            <SelectItem key={`reviewer-model-${idx}`} value={model}>{model}</SelectItem>
                                                                        ))}
                                                                    </ScrollArea>
                                                                </div>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="reviewer-system-prompt" className="text-xs font-medium mb-1 block">System Prompt</Label>
                                                        <div className="flex items-center gap-1">
                                                            <Select
                                                                id="reviewer-system-prompt"
                                                                value={selectedSystemPrompts.reviewer}
                                                                onValueChange={(value) => setSelectedSystemPrompts(prev => ({ ...prev, reviewer: value }))}
                                                            >
                                                                <SelectTrigger className="h-8 flex-1">
                                                                    <SelectValue placeholder="Select prompt" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <div onWheelCapture={(e) => e.stopPropagation()}>
                                                                        <ScrollArea className="h-[200px]">
                                                                            <SelectItem value="none">No prompt</SelectItem>
                                                                            {(prompts.reviewer || []).map((prompt) => (
                                                                                <SelectItem key={`reviewer-prompt-${prompt.id}`} value={prompt.id}>
                                                                                    {prompt.title || "Untitled"}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </ScrollArea>
                                                                    </div>
                                                                </SelectContent>
                                                            </Select>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 shrink-0"
                                                                onClick={() => handleRefreshAgentPrompts('reviewer')}
                                                                disabled={isRefreshingPrompts.reviewer}
                                                                title="Refresh prompts"
                                                            >
                                                                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingPrompts.reviewer ? 'animate-spin' : ''}`} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Analyzes code quality, security, and best practices
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-lg font-medium">Implementation Agent</CardTitle>
                                            <Wrench className="w-6 h-6 text-green-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <Label htmlFor="implementation-model" className="text-xs font-medium mb-1 block">Model</Label>
                                                        <Select id="implementation-model" value={implementationModel} onValueChange={setImplementationModel}>
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue placeholder="Select model" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <div onWheelCapture={(e) => e.stopPropagation()}>
                                                                    <ScrollArea className="h-[200px]">
                                                                        {models.map((model, idx) => (
                                                                            <SelectItem key={`implementation-model-${idx}`} value={model}>{model}</SelectItem>
                                                                        ))}
                                                                    </ScrollArea>
                                                                </div>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="implementation-system-prompt" className="text-xs font-medium mb-1 block">System Prompt</Label>
                                                        <div className="flex items-center gap-1">
                                                            <Select
                                                                id="implementation-system-prompt"
                                                                value={selectedSystemPrompts.implementation}
                                                                onValueChange={(value) => setSelectedSystemPrompts(prev => ({ ...prev, implementation: value }))}
                                                            >
                                                                <SelectTrigger className="h-8 flex-1">
                                                                    <SelectValue placeholder="Select prompt" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <div onWheelCapture={(e) => e.stopPropagation()}>
                                                                        <ScrollArea className="h-[200px]">
                                                                            <SelectItem value="none">No prompt</SelectItem>
                                                                            {(prompts.implementation || []).map((prompt) => (
                                                                                <SelectItem key={`implementation-prompt-${prompt.id}`} value={prompt.id}>
                                                                                    {prompt.title || "Untitled"}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </ScrollArea>
                                                                    </div>
                                                                </SelectContent>
                                                            </Select>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 shrink-0"
                                                                onClick={() => handleRefreshAgentPrompts('implementation')}
                                                                disabled={isRefreshingPrompts.implementation}
                                                                title="Refresh prompts"
                                                            >
                                                                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingPrompts.implementation ? 'animate-spin' : ''}`} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Implements code changes and improvements
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-lg font-medium">Tester Agent</CardTitle>
                                            <BugPlay  className="w-6 h-6 text-orange-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <Label htmlFor="tester-model" className="text-xs font-medium mb-1 block">Model</Label>
                                                        <Select id="tester-model" value={testerModel} onValueChange={setTesterModel}>
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue placeholder="Select model" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <div onWheelCapture={(e) => e.stopPropagation()}>
                                                                    <ScrollArea className="h-[200px]">
                                                                        {models.map((model, idx) => (
                                                                            <SelectItem key={`tester-model-${idx}`} value={model}>{model}</SelectItem>
                                                                        ))}
                                                                    </ScrollArea>
                                                                </div>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="tester-system-prompt" className="text-xs font-medium mb-1 block">System Prompt</Label>
                                                        <div className="flex items-center gap-1">
                                                            <Select
                                                                id="tester-system-prompt"
                                                                value={selectedSystemPrompts.tester}
                                                                onValueChange={(value) => setSelectedSystemPrompts(prev => ({ ...prev, tester: value }))}
                                                            >
                                                                <SelectTrigger className="h-8 flex-1">
                                                                    <SelectValue placeholder="Select prompt" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <div onWheelCapture={(e) => e.stopPropagation()}>
                                                                        <ScrollArea className="h-[200px]">
                                                                            <SelectItem value="none">No prompt</SelectItem>
                                                                            {(prompts.tester || []).map((prompt) => (
                                                                                <SelectItem key={`tester-prompt-${prompt.id}`} value={prompt.id}>
                                                                                    {prompt.title || "Untitled"}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </ScrollArea>
                                                                    </div>
                                                                </SelectContent>
                                                            </Select>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 shrink-0"
                                                                onClick={() => handleRefreshAgentPrompts('tester')}
                                                                disabled={isRefreshingPrompts.tester}
                                                                title="Refresh prompts"
                                                            >
                                                                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingPrompts.tester ? 'animate-spin' : ''}`} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Tests functionality, edge cases, and performance
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-lg font-medium">Report Agent</CardTitle>
                                            <FileText className="w-6 h-6 text-purple-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <Label htmlFor="report-model" className="text-xs font-medium mb-1 block">Model</Label>
                                                        <Select id="report-model" value={reportModel} onValueChange={setReportModel}>
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue placeholder="Select model" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <div onWheelCapture={(e) => e.stopPropagation()}>
                                                                    <ScrollArea className="h-[200px]">
                                                                        {models.map((model, idx) => (
                                                                            <SelectItem key={`report-model-${idx}`} value={model}>{model}</SelectItem>
                                                                        ))}
                                                                    </ScrollArea>
                                                                </div>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="report-system-prompt" className="text-xs font-medium mb-1 block">System Prompt</Label>
                                                        <div className="flex items-center gap-1">
                                                            <Select
                                                                id="report-system-prompt"
                                                                value={selectedSystemPrompts.report}
                                                                onValueChange={(value) => setSelectedSystemPrompts(prev => ({ ...prev, report: value }))}
                                                            >
                                                                <SelectTrigger className="h-8 flex-1">
                                                                    <SelectValue placeholder="Select prompt" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <div onWheelCapture={(e) => e.stopPropagation()}>
                                                                        <ScrollArea className="h-[200px]">
                                                                            <SelectItem value="none">No prompt</SelectItem>
                                                                            {(prompts.report || []).map((prompt) => (
                                                                                <SelectItem key={`report-prompt-${prompt.id}`} value={prompt.id}>
                                                                                    {prompt.title || "Untitled"}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </ScrollArea>
                                                                    </div>
                                                                </SelectContent>
                                                            </Select>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 shrink-0"
                                                                onClick={() => handleRefreshAgentPrompts('report')}
                                                                disabled={isRefreshingPrompts.report}
                                                                title="Refresh prompts"
                                                            >
                                                                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingPrompts.report ? 'animate-spin' : ''}`} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Generates comprehensive reports and documentation
                                                </p>
                                            </div>
                                            </CardContent>
                                        </Card>
                                        </div>
                                        <div className="flex justify-end gap-2 mt-4">
                                            <Button onClick={() => {
                                                // Here you would typically save the configuration
                                                onOpenChange(false);
                                            }}>
                                                Save Configuration
                                            </Button>
                                            <Button onClick={() => onOpenChange(false)} variant="outline">
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="prompts" className="mt-0">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            Configure the prompts used by each AI agent. Select one prompt per agent.
                                        </div>
                                    </div>

                                    {(() => {
                                        const agentEntries = Object.entries(prompts);
                                        const agentsPerPage = 2;
                                        const totalAgentPages = Math.ceil(agentEntries.length / agentsPerPage);
                                        const visibleAgents = agentEntries.slice(agentPage * agentsPerPage, (agentPage + 1) * agentsPerPage);

                                        return (
                                            <>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    {visibleAgents.map(([agent, agentPrompts]) => {
                                                        const agentConfig = {
                                                            reviewer: { icon: ScanSearch, color: "text-blue-500", bg: "bg-blue-500" },
                                                            implementation: { icon: Wrench, color: "text-green-500", bg: "bg-green-500" },
                                                            tester: { icon: BugPlay, color: "text-orange-500", bg: "bg-orange-500" },
                                                            report: { icon: FileText, color: "text-purple-500", bg: "bg-purple-500" },
                                                        };
                                                        const config = agentConfig[agent] || { icon: ScanSearch, color: "text-gray-500", bg: "bg-gray-500" };
                                                        const AgentIcon = config.icon;
                                                        const page = currentPage[agent] || 0;
                                                        const pageSize = 3;
                                                        const totalPages = Math.ceil((agentPrompts?.length || 0) / pageSize);
                                                        const visiblePrompts = agentPrompts?.slice(page * pageSize, (page + 1) * pageSize) || [];
                                                        
                                                        return (
                                                            <Card key={agent}>
                                                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <AgentIcon className={`w-5 h-5 ${config.color}`} />
                                                                        <CardTitle className="text-lg font-medium capitalize">{agent} Agent</CardTitle>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={() => handleRefreshAgentPrompts(agent)}
                                                                        title={`Refresh ${agent} prompts`}
                                                                        disabled={isRefreshingPrompts[agent]}
                                                                    >
                                                                        <RefreshCw className={`h-4 w-4 ${isRefreshingPrompts[agent] ? 'animate-spin' : ''}`} />
                                                                    </Button>
                                                                </CardHeader>
                                                                <CardContent>
                                                                    {(!agentPrompts || agentPrompts.length === 0) ? (
                                                                        <div className="text-sm text-muted-foreground italic py-2">
                                                                            No prompts configured.
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            {visiblePrompts.map((prompt) => {
                                                                                const isSelected = selectedPrompts[agent]?.includes(prompt.id);
                                                                                return (
                                                                                    <div 
                                                                                        key={prompt.id} 
                                                                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                                                                            isSelected 
                                                                                                ? 'border-primary bg-primary/10' 
                                                                                                : 'hover:border-muted-foreground/50'
                                                                                        }`}
                                                                                        onClick={() => handlePromptChange(agent, prompt.id)}
                                                                                    >
                                                                                        <div className="flex items-start justify-between gap-2">
                                                                                            <div className="flex-1 min-w-0">
                                                                                                <p className="text-sm font-medium truncate">{prompt.title || "Untitled"}</p>
                                                                                                <p className="text-xs text-muted-foreground line-clamp-1">{truncateText(prompt.text, 50)}</p>
                                                                                            </div>
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                className="shrink-0 h-7"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setViewPrompt(prompt);
                                                                                                }}
                                                                                            >
                                                                                                View
                                                                                            </Button>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                            {totalPages > 1 && (
                                                                                <div className="flex items-center justify-between pt-2 border-t mt-2">
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-7 px-2"
                                                                                        onClick={() => setCurrentPage(prev => ({ ...prev, [agent]: Math.max(0, (prev[agent] || 0) - 1) }))}
                                                                                        disabled={page === 0}
                                                                                    >
                                                                                        ← Prev
                                                                                    </Button>
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        {page + 1} / {totalPages}
                                                                                    </span>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-7 px-2"
                                                                                        onClick={() => setCurrentPage(prev => ({ ...prev, [agent]: Math.min(totalPages - 1, (prev[agent] || 0) + 1) }))}
                                                                                        disabled={page >= totalPages - 1}
                                                                                    >
                                                                                        Next →
                                                                                    </Button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </CardContent>
                                                            </Card>
                                                        );
                                                    })}
                                                </div>

                                                {totalAgentPages > 1 && (
                                                    <div className="flex items-center justify-center gap-4 pt-4 border-t">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setAgentPage(prev => Math.max(0, prev - 1))}
                                                            disabled={agentPage === 0}
                                                        >
                                                            ← Previous Agents
                                                        </Button>
                                                        <span className="text-sm text-muted-foreground">
                                                            Agents {agentPage * agentsPerPage + 1}-{Math.min((agentPage + 1) * agentsPerPage, agentEntries.length)} of {agentEntries.length}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setAgentPage(prev => Math.min(totalAgentPages - 1, prev + 1))}
                                                            disabled={agentPage >= totalAgentPages - 1}
                                                        >
                                                            Next Agents →
                                                        </Button>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}

                                    <Dialog open={!!viewPrompt} onOpenChange={() => setViewPrompt(null)}>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>{viewPrompt?.title || "Untitled Prompt"}</DialogTitle>
                                                <DialogDescription>
                                                    Complete text of the selected prompt.
                                                </DialogDescription>
                                            </DialogHeader>
                                            {viewPrompt && (
                                                <Textarea
                                                    value={viewPrompt.text}
                                                    readOnly
                                                    rows={10}
                                                    className="resize-none"
                                                />
                                            )}
                                            <DialogFooter>
                                                <Button onClick={() => setViewPrompt(null)}>Close</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </TabsContent>

                            <TabsContent value="knowledge" className="mt-0">
                                {!codeType ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <Database className="h-16 w-16 text-muted-foreground/50 mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">Code Type Required</h3>
                                        <p className="text-sm text-muted-foreground max-w-md">
                                            Please select a code type in the Code Editor first. The knowledge base selection will be automatically matched to your code type.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-muted-foreground">
                                            <span>Select one or more knowledge bases for RAG to provide context to the AI agents.</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRefreshUseCases}
                                                title="Refresh knowledge bases"
                                                disabled={isRefreshingUseCases}
                                                className="shrink-0"
                                            >
                                                {isRefreshingUseCases ? (
                                                    <>
                                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                        <span className="hidden sm:inline">Refreshing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw className="h-4 w-4 sm:mr-2" />
                                                        <span className="hidden sm:inline">Refresh</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        <ScrollArea className="h-[320px]">
                                            <div className="space-y-2 pr-4">
                                            {(() => {
                                                const paginatedUseCases = useCases.slice(kbPage * kbPerPage, (kbPage + 1) * kbPerPage);
                                                
                                                return paginatedUseCases.map((kb) => {
                                                    const IconComponent = LucideIcons[kb.icon];
                                                    const isSelected = selectedKnowledgeBases.includes(kb.id);
                                                    const docCount = kbDocumentCounts[kb.id] || 0;
                                                    const isRefreshing = isRefreshingKb[kb.id] || false;
                                                    const isExpanded = expandedKb === kb.id;
                                                    const documents = isDemoMode ? (DEMO_DOCUMENTS[kb.id] || []) : [];
                                                    
                                                    // Group documents by folder
                                                    const folders = {};
                                                    const rootDocs = [];
                                                    documents.forEach(doc => {
                                                        if (doc.folder) {
                                                            if (!folders[doc.folder]) folders[doc.folder] = [];
                                                            folders[doc.folder].push(doc);
                                                        } else {
                                                            rootDocs.push(doc);
                                                        }
                                                    });

                                                        return (
                                                            <Card
                                                                key={kb.id}
                                                                className={`transition-all duration-200 ${
                                                                    isSelected
                                                                        ? 'border-cyan-500 dark:border-cyan-400 border-2 bg-cyan-50 dark:bg-cyan-950/30'
                                                                        : 'hover:border-cyan-300 dark:hover:border-cyan-600'
                                                                }`}
                                                            >
                                                                <CardContent className="p-4 sm:p-5">
                                                                    <div 
                                                                        className="flex items-start gap-3 sm:gap-4 cursor-pointer"
                                                                        onClick={() => toggleKnowledgeBase(kb.id)}
                                                                    >
                                                                        <div className={`p-2 sm:p-3 rounded-lg shrink-0 ${
                                                                            isSelected
                                                                                ? 'bg-cyan-500 dark:bg-cyan-500'
                                                                                : 'bg-cyan-100 dark:bg-cyan-900/50'
                                                                        }`}>
                                                                            <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 ${
                                                                                isSelected
                                                                                    ? 'text-white'
                                                                                    : 'text-cyan-600 dark:text-cyan-400'
                                                                            }`} />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center justify-between mb-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <h3 className="font-semibold text-sm sm:text-base truncate">{kb.title}</h3>
                                                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                                                        {docCount} docs
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="h-6 w-6 shrink-0"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setExpandedKb(isExpanded ? null : kb.id);
                                                                                        }}
                                                                                        title={isExpanded ? "Collapse documents" : "View documents"}
                                                                                    >
                                                                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="outline"
                                                                                        size="icon"
                                                                                        className="h-6 w-6 shrink-0"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleRefreshKnowledgeBase(kb.id, kb.title);
                                                                                        }}
                                                                                        title={`Refresh documents in ${kb.title}`}
                                                                                        disabled={isRefreshing}
                                                                                    >
                                                                                        <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                                                                {truncateText(kb.content, 100)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Expandable Documents Section */}
                                                                    {isExpanded && isDemoMode && (
                                                                        <div className="mt-4 pt-4 border-t">
                                                                            <div className="space-y-2">
                                                                                {/* Root documents */}
                                                                                {rootDocs.map(doc => (
                                                                                    <div key={doc.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-muted/50">
                                                                                        <File className="h-4 w-4 text-red-500 shrink-0" />
                                                                                        <span className="truncate flex-1">{doc.name}</span>
                                                                                        <span className="text-xs text-muted-foreground shrink-0">{doc.size}</span>
                                                                                    </div>
                                                                                ))}
                                                                                
                                                                                {/* Folders with documents */}
                                                                                {Object.entries(folders).map(([folderName, folderDocs]) => (
                                                                                    <div key={folderName} className="space-y-1">
                                                                                        <div className="flex items-center gap-2 text-sm font-medium py-1 px-2">
                                                                                            <Folder className="h-4 w-4 text-yellow-500 shrink-0" />
                                                                                            <span>{folderName}</span>
                                                                                            <span className="text-xs text-muted-foreground">({folderDocs.length})</span>
                                                                                        </div>
                                                                                        <div className="ml-6 space-y-1">
                                                                                            {folderDocs.map(doc => (
                                                                                                <div key={doc.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-muted/50">
                                                                                                    <File className="h-4 w-4 text-red-500 shrink-0" />
                                                                                                    <span className="truncate flex-1">{doc.name}</span>
                                                                                                    <span className="text-xs text-muted-foreground shrink-0">{doc.size}</span>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                                
                                                                                {documents.length === 0 && (
                                                                                    <p className="text-sm text-muted-foreground italic py-2">No documents in this knowledge base.</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </CardContent>
                                                            </Card>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </ScrollArea>

                                        {/* Pagination */}
                                        {useCases.length > kbPerPage && (
                                            <div className="flex items-center justify-center gap-4 pt-4 border-t">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setKbPage(prev => Math.max(0, prev - 1))}
                                                    disabled={kbPage === 0}
                                                >
                                                    ← Previous
                                                </Button>
                                                <span className="text-sm font-medium">
                                                    Page {kbPage + 1} of {Math.ceil(useCases.length / kbPerPage)} ({useCases.length} total)
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setKbPage(prev => Math.min(Math.ceil(useCases.length / kbPerPage) - 1, prev + 1))}
                                                    disabled={kbPage >= Math.ceil(useCases.length / kbPerPage) - 1}
                                                >
                                                    Next →
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
