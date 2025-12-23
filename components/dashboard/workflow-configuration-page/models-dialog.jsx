"use client"

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
import { ScanSearch, Wrench, BugPlay, FileText, Database, RefreshCw } from "lucide-react"
import { AIWorkflowVisualization } from "./ai-workflow-visualization"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUseCases } from "@/contexts/useCasesContext"
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

export function ModelsDialog({ isOpen, onOpenChange, codeType, onCodeTypeChange }) {
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

    const { useCases, refresh: refreshUseCases } = useUseCases();

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
        try {
            // Simulate API call to refresh specific knowledge base
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success(`"${kbTitle}" knowledge base refreshed successfully!`);
        } catch (error) {
            toast.error(`Failed to refresh "${kbTitle}" knowledge base`);
        }
    };

    // Fetch models from AWS Bedrock on component mount
    React.useEffect(() => {
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
    }, []);

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
                                                                {models.map((model, idx) => (
                                                                    <SelectItem key={`reviewer-model-${idx}`} value={model}>{model}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="reviewer-system-prompt" className="text-xs font-medium mb-1 block">System Prompt</Label>
                                                        <Select
                                                            id="reviewer-system-prompt"
                                                            value={selectedSystemPrompts.reviewer}
                                                            onValueChange={(value) => setSelectedSystemPrompts(prev => ({ ...prev, reviewer: value }))}
                                                        >
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue placeholder="Select prompt" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">No prompt</SelectItem>
                                                                {(prompts.reviewer || []).map((prompt) => (
                                                                    <SelectItem key={`reviewer-prompt-${prompt.id}`} value={prompt.id}>
                                                                        {prompt.title || "Untitled"}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
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
                                                                {models.map((model, idx) => (
                                                                    <SelectItem key={`implementation-model-${idx}`} value={model}>{model}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="implementation-system-prompt" className="text-xs font-medium mb-1 block">System Prompt</Label>
                                                        <Select
                                                            id="implementation-system-prompt"
                                                            value={selectedSystemPrompts.implementation}
                                                            onValueChange={(value) => setSelectedSystemPrompts(prev => ({ ...prev, implementation: value }))}
                                                        >
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue placeholder="Select prompt" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">No prompt</SelectItem>
                                                                {(prompts.implementation || []).map((prompt) => (
                                                                    <SelectItem key={`implementation-prompt-${prompt.id}`} value={prompt.id}>
                                                                        {prompt.title || "Untitled"}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
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
                                                                {models.map((model, idx) => (
                                                                    <SelectItem key={`tester-model-${idx}`} value={model}>{model}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="tester-system-prompt" className="text-xs font-medium mb-1 block">System Prompt</Label>
                                                        <Select
                                                            id="tester-system-prompt"
                                                            value={selectedSystemPrompts.tester}
                                                            onValueChange={(value) => setSelectedSystemPrompts(prev => ({ ...prev, tester: value }))}
                                                        >
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue placeholder="Select prompt" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">No prompt</SelectItem>
                                                                {(prompts.tester || []).map((prompt) => (
                                                                    <SelectItem key={`tester-prompt-${prompt.id}`} value={prompt.id}>
                                                                        {prompt.title || "Untitled"}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
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
                                                                {models.map((model, idx) => (
                                                                    <SelectItem key={`report-model-${idx}`} value={model}>{model}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="report-system-prompt" className="text-xs font-medium mb-1 block">System Prompt</Label>
                                                        <Select
                                                            id="report-system-prompt"
                                                            value={selectedSystemPrompts.report}
                                                            onValueChange={(value) => setSelectedSystemPrompts(prev => ({ ...prev, report: value }))}
                                                        >
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue placeholder="Select prompt" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">No prompt</SelectItem>
                                                                {(prompts.report || []).map((prompt) => (
                                                                    <SelectItem key={`report-prompt-${prompt.id}`} value={prompt.id}>
                                                                        {prompt.title || "Untitled"}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
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
                                <ScrollArea className="h-[calc(100vh-280px)] sm:h-[calc(100vh-240px)]">
                                    <div className="space-y-4 pr-4">
                                        <div className="text-sm text-muted-foreground mb-4">
                                            Configure the prompts used by each AI agent. You can customize the prompts or use the default ones.
                                        </div>

                                        {Object.entries(prompts).map(([agent, agentPrompts]) => (
                                            <div key={agent} className="pb-4 border-b last:border-b-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                                                    <h4 className="text-lg font-semibold capitalize">{agent} Agent</h4>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleRefreshAgentPrompts(agent)}
                                                        title={`Refresh ${agent} prompts`}
                                                        disabled={isRefreshingPrompts[agent]}
                                                    >
                                                        {isRefreshingPrompts[agent] ? (
                                                            <>
                                                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                                <span className="hidden sm:inline">Refreshing...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <RefreshCw className="h-4 w-4 sm:mr-2" />
                                                                <span className="hidden sm:inline">Refresh Prompts</span>
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>

                                            {(!agentPrompts || agentPrompts.length === 0) ? (
                                                <div className="text-sm text-muted-foreground italic">
                                                    No prompts configured.
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {(() => {
                                                        const page = currentPage[agent] || 0;
                                                        const visiblePrompts = agentPrompts.slice(page * 5, (page + 1) * 5);
                                                        return (
                                                            <>
                                                                <div className="flex gap-4 overflow-x-auto">
                                                                    {visiblePrompts.map((prompt) => (
                                                                        <div key={prompt.id} className="flex-1 min-w-[200px] p-3 rounded-lg border bg-muted flex flex-col items-center justify-between">
                                                                            <div className="text-center mb-2">
                                                                                <p className="text-sm font-medium">{prompt.title || "Untitled"}</p>
                                                                                <p className="text-xs text-muted-foreground">{truncateText(prompt.text, 30)}</p>
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    onClick={() => setViewPrompt(prompt)}

                                                                                >
                                                                                    View Full
                                                                                </Button>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    onClick={() => handlePromptChange(agent, prompt.id)}
                                                                                >
                                                                                    {selectedPrompts[agent]?.includes(prompt.id) ? 'Deselect' : 'Select'}
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="flex justify-between items-center mt-4">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => setCurrentPage(prev => ({ ...prev, [agent]: (prev[agent] || 0) - 1 }))}
                                                                        disabled={(currentPage[agent] || 0) === 0}
                                                                    >
                                                                        Previous
                                                                    </Button>
                                                                    <span className="text-sm">
                                                                        Page {(currentPage[agent] || 0) + 1} of {Math.ceil(agentPrompts.length / 5)}
                                                                    </span>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => setCurrentPage(prev => ({ ...prev, [agent]: (prev[agent] || 0) + 1 }))}
                                                                        disabled={((currentPage[agent] || 0) + 1) * 5 >= agentPrompts.length}
                                                                    >
                                                                        Next
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                            </div>
                                        ))}

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
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="knowledge" className="mt-0">
                                <ScrollArea className="h-[calc(100vh-280px)] sm:h-[calc(100vh-240px)]">
                                    <div className="space-y-4 pr-4">
                                        {!codeType ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <Database className="h-16 w-16 text-muted-foreground/50 mb-4" />
                                                <h3 className="text-lg font-semibold mb-2">Code Type Required</h3>
                                                <p className="text-sm text-muted-foreground max-w-md">
                                                    Please select a code type in the Code Editor first. The knowledge base selection will be automatically matched to your code type.
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-muted-foreground mb-4">
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

                                                <div className="space-y-3">
                                                    {useCases.map((kb) => {
                                                        const IconComponent = LucideIcons[kb.icon];
                                                        const isSelected = selectedKnowledgeBases.includes(kb.id);

                                                        return (
                                                            <Card
                                                                key={kb.id}
                                                                className={`cursor-pointer transition-all duration-200 ${
                                                                    isSelected
                                                                        ? 'border-cyan-500 dark:border-cyan-400 border-2 bg-cyan-50 dark:bg-cyan-950/30'
                                                                        : 'hover:border-cyan-300 dark:hover:border-cyan-600'
                                                                }`}
                                                                onClick={() => toggleKnowledgeBase(kb.id)}
                                                            >
                                                                <CardContent className="p-4 sm:p-5">
                                                                    <div className="flex items-start gap-3 sm:gap-4">
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
                                                                                <h3 className="font-semibold text-sm sm:text-base truncate">{kb.title}</h3>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="icon"
                                                                                    className="h-6 w-6 ml-2 shrink-0"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleRefreshKnowledgeBase(kb.id, kb.title);
                                                                                    }}
                                                                                    title={`Refresh ${kb.title}`}
                                                                                >
                                                                                    <RefreshCw className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                                                                {truncateText(kb.content, 100)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        );
                                                    })}
                                                </div>

                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 gap-2">
                                                    <p className="text-xs text-muted-foreground">
                                                        {selectedKnowledgeBases.length} knowledge base{selectedKnowledgeBases.length !== 1 ? 's' : ''} selected
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <Button onClick={() => {
                                                            onOpenChange(false);
                                                        }} size="sm">
                                                            Save
                                                        </Button>
                                                        <Button onClick={() => onOpenChange(false)} variant="outline" size="sm">
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
