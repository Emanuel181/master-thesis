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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

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

    const handleRefreshModels = () => {
        setIsRefreshingModels(true);
        // TODO: Add actual refresh logic
        setTimeout(() => {
            // Simulate model refresh
            _setModels(["Model A", "Model B", "Model C"]);
            setIsRefreshingModels(false);
        }, 2000);
    };

    const handleRefreshUseCases = () => {
        setIsRefreshingUseCases(true);
        refreshUseCases().finally(() => setIsRefreshingUseCases(false));
    };

    const truncateText = (text, maxLength = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
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
                            <TabsList className="grid w-full grid-cols-4 mb-4">
                                <TabsTrigger value="workflow">Workflow Visualization</TabsTrigger>
                                <TabsTrigger value="models">Agents Configuration</TabsTrigger>
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
                                            <div className="grid gap-2">
                                                <Label htmlFor="reviewer-model" className="sr-only">Reviewer Agent</Label>
                                                <Select id="reviewer-model" value={reviewerModel} onValueChange={setReviewerModel}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a model" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {models.map((model) => (
                                                            <SelectItem key={`reviewer-${model}`} value={model}>{model}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-muted-foreground mt-1">
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
                                            <div className="grid gap-2">
                                                <Label htmlFor="implementation-model" className="sr-only">Implementation Agent</Label>
                                                <Select id="implementation-model" value={implementationModel} onValueChange={setImplementationModel}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a model" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {models.map((model) => (
                                                            <SelectItem key={`implementation-${model}`} value={model}>{model}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-muted-foreground mt-1">
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
                                            <div className="grid gap-2">
                                                <Label htmlFor="tester-model" className="sr-only">Tester Agent</Label>
                                                <Select id="tester-model" value={testerModel} onValueChange={setTesterModel}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a model" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {models.map((model) => (
                                                            <SelectItem key={`tester-${model}`} value={model}>{model}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-muted-foreground mt-1">
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
                                            <div className="grid gap-2">
                                                <Label htmlFor="report-model" className="sr-only">Report Agent</Label>
                                                <Select id="report-model" value={reportModel} onValueChange={setReportModel}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a model" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {models.map((model) => (
                                                            <SelectItem key={`report-${model}`} value={model}>{model}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-muted-foreground mt-1">
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

                            <TabsContent value="prompts">
                                <div className="space-y-4">
                                    <div className="text-sm text-muted-foreground mb-4">
                                        Configure the prompts used by each AI agent. You can customize the prompts or use the default ones.
                                    </div>

                                    {Object.entries(prompts).map(([agent, agentPrompts]) => (
                                        <div key={agent} className="pb-4 border-b last:border-b-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-lg font-semibold capitalize">{agent} Agent</h4>
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
                                                                            <p className="text-sm text-center mb-2">{truncateText(prompt.text, 50)}</p>
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
                                                <DialogTitle>Full Prompt</DialogTitle>
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
                                                                        <h3 className="font-semibold text-base mb-1">{kb.title}</h3>
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
