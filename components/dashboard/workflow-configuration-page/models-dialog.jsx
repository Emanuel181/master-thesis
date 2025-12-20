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
import { Input } from "@/components/ui/input"
import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScanSearch, Wrench, BugPlay, FileText, Database, RefreshCw, Plus } from "lucide-react"
import { AIWorkflowVisualization } from "./ai-workflow-visualization"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUseCases } from "@/contexts/useCasesContext"
import * as LucideIcons from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { usePrompts } from "@/contexts/promptsContext"
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
        handlePromptTextChange,
        addPrompt,
        savePrompts,
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

    const [selectedAgentDetails, setSelectedAgentDetails] = React.useState(null);
    const [isLoadingAgentDetails, setIsLoadingAgentDetails] = React.useState(false);
    const [newAgentName, setNewAgentName] = React.useState("");
    const [newAgentFoundationModel, setNewAgentFoundationModel] = React.useState("");
    const [newAgentDescription, setNewAgentDescription] = React.useState("");
    const [newAgentInstruction, setNewAgentInstruction] = React.useState("");
    const [isCreatingAgent, setIsCreatingAgent] = React.useState(false);
    const [selectedSystemPrompts, setSelectedSystemPrompts] = React.useState({
        reviewer: "",
        implementation: "",
        tester: "",
        report: "",
    });

    const handleCreateAgent = async () => {
        setIsCreatingAgent(true);
        try {
            const response = await fetch('/api/bedrock/agents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newAgentName,
                    model: newAgentFoundationModel,
                    description: newAgentDescription,
                    instruction: newAgentInstruction,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(`Agent "${data.name}" created successfully!`);
                // Reset form states
                setNewAgentName("");
                setNewAgentFoundationModel("");
                setNewAgentDescription("");
                setNewAgentInstruction("");
                // Optionally, refresh the agent list or perform other actions
            } else {
                const errorData = await response.json();
                toast.error(`Error creating agent: ${errorData.error}`);
            }
        } catch (error) {
            toast.error("Failed to create agent. Please try again later.");
        } finally {
            setIsCreatingAgent(false);
        }
    };

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
                            <TabsList className="grid w-full grid-cols-5 mb-4">
                                <TabsTrigger value="workflow">Workflow Visualization</TabsTrigger>
                                <TabsTrigger value="models">Agents Configuration</TabsTrigger>
                                <TabsTrigger value="create">Create Agent</TabsTrigger>
                                <TabsTrigger value="prompts">Prompts Configuration</TabsTrigger>
                                <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
                            </TabsList>

                            <TabsContent value="workflow" className="space-y-4">
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
                                    onPromptChange={handlePromptChange}
                                    onSave={() => {
                                        // Here you would typically save the configuration
                                        onOpenChange(false);
                                    }}
                                    onCancel={() => onOpenChange(false)}
                                />
                            </TabsContent>

                            <TabsContent value="models">
                                <div className="flex items-center justify-between mb-4">
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
                                                Refreshing...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                Refresh Models
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
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
                                                                {models.map((model) => (
                                                                    <SelectItem key={`reviewer-${model}`} value={model}>{model}</SelectItem>
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
                                                                {models.map((model) => (
                                                                    <SelectItem key={`implementation-${model}`} value={model}>{model}</SelectItem>
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
                                                                {models.map((model) => (
                                                                    <SelectItem key={`tester-${model}`} value={model}>{model}</SelectItem>
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
                                                                {models.map((model) => (
                                                                    <SelectItem key={`report-${model}`} value={model}>{model}</SelectItem>
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
                                <div className="flex justify-end gap-2 px-4 mt-4">
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
                            </TabsContent>

                            <TabsContent value="create">
                                <div className="space-y-4">
                                    <div className="text-sm text-muted-foreground mb-4">
                                        Create a new AWS Bedrock AI agent with custom instructions and model selection.
                                    </div>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                                <Plus className="w-5 h-5" />
                                                New AWS Bedrock Agent
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid gap-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="agent-name">Agent Name *</Label>
                                                        <Input
                                                            id="agent-name"
                                                            placeholder="Enter agent name (e.g., CodeReviewer, BugTester)"
                                                            value={newAgentName}
                                                            onChange={(e) => setNewAgentName(e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="agent-foundation-model">Foundation Model *</Label>
                                                        <Select value={newAgentFoundationModel} onValueChange={setNewAgentFoundationModel}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select AI model" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="anthropic.claude-3-sonnet-20240229-v1:0">Claude 3 Sonnet</SelectItem>
                                                                <SelectItem value="anthropic.claude-3-haiku-20240307-v1:0">Claude 3 Haiku</SelectItem>
                                                                <SelectItem value="meta.llama2-13b-chat-v1">Llama 2 13B</SelectItem>
                                                                <SelectItem value="amazon.titan-text-lite-v1">Titan Text Lite</SelectItem>
                                                                <SelectItem value="amazon.titan-text-express-v1">Titan Text Express</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor="agent-description">Description</Label>
                                                    <Input
                                                        id="agent-description"
                                                        placeholder="Brief description of the agent's role"
                                                        value={newAgentDescription}
                                                        onChange={(e) => setNewAgentDescription(e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="agent-instruction">Instructions *</Label>
                                                    <Textarea
                                                        id="agent-instruction"
                                                        placeholder="Enter detailed instructions for the agent (e.g., 'You are a code reviewer. Analyze code for bugs, security issues, and best practices.')"
                                                        rows={4}
                                                        value={newAgentInstruction}
                                                        onChange={(e) => setNewAgentInstruction(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="flex justify-end gap-2">
                                        <Button
                                            onClick={handleCreateAgent}
                                            disabled={isCreatingAgent}
                                        >
                                            {isCreatingAgent ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                    Creating Agent...
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Create Agent
                                                </>
                                            )}
                                        </Button>
                                        <Button onClick={() => onOpenChange(false)} variant="outline">
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="prompts">
                                <div className="space-y-4">
                                    <div className="text-sm text-muted-foreground mb-4">
                                        Configure the prompts used by each AI agent. You can customize the prompts or use the default ones.
                                    </div>

                                    {Object.entries(prompts).map(([agent, agentPrompts]) => (
                                        <div key={agent} className="pb-4 border-b last:border-b-0">
                                            <div className="flex items-center justify-between mb-2">
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
                                                            Refreshing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RefreshCw className="h-4 w-4 mr-2" />
                                                            Refresh Prompts
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
                            </TabsContent>

                            <TabsContent value="knowledge">
                                <div className="space-y-4">
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
                                            <div className="text-sm text-muted-foreground mb-4 flex items-center justify-between">
                                                <span>Select one or more knowledge bases for RAG (Retrieval-Augmented Generation) to provide context to the AI agents. At least one must be selected.</span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleRefreshUseCases}
                                                    title="Refresh knowledge bases"
                                                    disabled={isRefreshingUseCases}
                                                >
                                                    {isRefreshingUseCases ? (
                                                        <>
                                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                            Refreshing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RefreshCw className="h-4 w-4 mr-2" />
                                                            Refresh
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
                                                            <CardContent className="p-5">
                                                                <div className="flex items-start gap-4">
                                                                    <div className={`p-3 rounded-lg ${
                                                                        isSelected
                                                                            ? 'bg-cyan-500 dark:bg-cyan-500'
                                                                            : 'bg-cyan-100 dark:bg-cyan-900/50'
                                                                    }`}>
                                                                        <IconComponent className={`w-6 h-6 ${
                                                                            isSelected
                                                                                ? 'text-white'
                                                                                : 'text-cyan-600 dark:text-cyan-400'
                                                                        }`} />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <h3 className="font-semibold text-base">{kb.title}</h3>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="icon"
                                                                                className="h-6 w-6 ml-2"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleRefreshKnowledgeBase(kb.id, kb.title);
                                                                                }}
                                                                                title={`Refresh ${kb.title}`}
                                                                            >
                                                                                <RefreshCw className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            {truncateText(kb.content, 100)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })}
                                            </div>

                                            <div className="flex items-center justify-between mt-6">
                                                <p className="text-xs text-muted-foreground">
                                                    {selectedKnowledgeBases.length} knowledge base{selectedKnowledgeBases.length !== 1 ? 's' : ''} selected
                                                </p>
                                                <div className="flex gap-2">
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
                                        </>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
