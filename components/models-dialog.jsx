"use client"

import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
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
import { ScanSearch, Wrench, BugPlay , FileText  } from "lucide-react"
import { AIWorkflowVisualization } from "@/components/ai-workflow-visualization"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ModelsDialog({ isOpen, onOpenChange }) {
    const [reviewerModel, setReviewerModel] = React.useState("GPT-4");
    const [implementationModel, setImplementationModel] = React.useState("Claude 3.5 Sonnet");
    const [testerModel, setTesterModel] = React.useState("GPT-4");
    const [reportModel, setReportModel] = React.useState("GPT-4");

    const models = ["GPT-4", "GPT-4 Turbo", "Claude 3.5 Sonnet", "Claude 3 Opus", "Gemini Pro", "Llama 3 70B"];

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
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="workflow">Workflow Visualization</TabsTrigger>
                                <TabsTrigger value="models">Model Configuration</TabsTrigger>
                            </TabsList>

                            <TabsContent value="workflow" className="space-y-4">
                                <div className="text-sm text-muted-foreground mb-4">
                                    Your code flows through a series of AI agents. Each agent can use a different model. Select models directly in the workflow below:
                                </div>
                                <AIWorkflowVisualization
                                    models={models}
                                    agentModels={agentModels}
                                    onModelChange={handleModelChange}
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
                                            <ScanSearch className="w-6 h-6 text-muted-foreground" />
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
                                            <Wrench className="w-6 h-6 text-muted-foreground" />
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
                                            <BugPlay  className="w-6 h-6 text-muted-foreground" />
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
                                            <FileText className="w-6 h-6 text-muted-foreground" />
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
                        </Tabs>
                    </div>
                </div>
                </DrawerContent>
            </Drawer>
        )
    }
