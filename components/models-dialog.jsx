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
import { ScanSearch, Wrench, BugPlay, FileText, Database } from "lucide-react"
import { AIWorkflowVisualization } from "@/components/ai-workflow-visualization"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { knowledgeBaseUseCases } from "@/lib/knowledge-base-cases"

export function ModelsDialog({ isOpen, onOpenChange, codeType }) {
    const [reviewerModel, setReviewerModel] = React.useState("GPT-4");
    const [implementationModel, setImplementationModel] = React.useState("Claude 3.5 Sonnet");
    const [testerModel, setTesterModel] = React.useState("GPT-4");
    const [reportModel, setReportModel] = React.useState("GPT-4");
    // Auto-select based on code type
    const [selectedKnowledgeBases, setSelectedKnowledgeBases] = React.useState([]);

    // Auto-select knowledge base when codeType changes
    React.useEffect(() => {
        if (codeType && selectedKnowledgeBases.length === 0) {
            setSelectedKnowledgeBases([codeType]);
        }
    }, [codeType]);

    const models = ["GPT-4", "GPT-4 Turbo", "Claude 3.5 Sonnet", "Claude 3 Opus", "Gemini Pro", "Llama 3 70B"];

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
                            <TabsList className="grid w-full grid-cols-3 mb-4">
                                <TabsTrigger value="workflow">Workflow Visualization</TabsTrigger>
                                <TabsTrigger value="models">Agents Configuration</TabsTrigger>
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
                                    knowledgeBases={knowledgeBaseUseCases}
                                    selectedKnowledgeBases={selectedKnowledgeBases}
                                    onKnowledgeBaseChange={toggleKnowledgeBase}
                                    codeType={codeType}
                                    onSave={() => {
                                        // Here you would typically save the configuration
                                        onOpenChange(false);
                                    }}
                                    onCancel={() => onOpenChange(false)}
                                />
                            </TabsContent>

                            <TabsContent value="models">
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
                                            <div className="text-sm text-muted-foreground mb-4">
                                                Select one or more knowledge bases for RAG (Retrieval-Augmented Generation) to provide context to the AI agents. At least one must be selected.
                                            </div>

                                            <div className="space-y-3">
                                        {knowledgeBaseUseCases.map((kb) => {
                                            const IconComponent = kb.icon;
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
                                                                <h3 className="font-semibold text-base mb-1">{kb.name}</h3>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {kb.description}
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
