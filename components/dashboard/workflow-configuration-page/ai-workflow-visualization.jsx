"use client";

import React from "react";
import {
    ReactFlow,
    Controls,
    useNodesState,
    useEdgesState,
    MarkerType,
} from "reactflow";
import { Button } from "@/components/ui/button";
import {
    ScanSearch,
    Wrench,
    BugPlay,
    FileText,
    ZoomIn,
    ZoomOut,
} from "lucide-react";
import "reactflow/dist/style.css";

// Import extracted nodes and edges
import { AgentNode, UserCodeNode, KnowledgeBaseNode, PromptNode } from './nodes';
import { AnimatedSVGEdge } from './edges';

const nodeTypes = {
    agentNode: AgentNode,
    userCodeNode: UserCodeNode,
    knowledgeBaseNode: KnowledgeBaseNode,
    promptNode: PromptNode,
};

const edgeTypes = {
    animated: AnimatedSVGEdge,
};

// -------- Main Component --------

export function AIWorkflowVisualization({
    models,
    agentModels,
    onModelChange,
    knowledgeBases = [],
    selectedKnowledgeBases = [],
    onKnowledgeBaseChange,
    codeType,
    onCodeTypeChange,
    useCases = [],
    prompts = {},
    selectedPrompts = {},
    onPromptChange,
    onSave,
    onCancel,
    isCodeLocked = false,
}) {
    const [isDarkMode, setIsDarkMode] = React.useState(false);
    const reactFlowInstanceRef = React.useRef(null);

    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 1.5;
    const ZOOM_STEP = 0.15;

    const handleZoomIn = () => {
        const instance = reactFlowInstanceRef.current;
        if (!instance) return;
        instance.zoomTo(Math.min(instance.getZoom() + ZOOM_STEP, MAX_ZOOM));
    };

    const handleZoomOut = () => {
        const instance = reactFlowInstanceRef.current;
        if (!instance) return;
        instance.zoomTo(Math.max(instance.getZoom() - ZOOM_STEP, MIN_ZOOM));
    };

    React.useEffect(() => {
        const checkDarkMode = () => setIsDarkMode(document.documentElement.classList.contains("dark"));
        checkDarkMode();
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    const edgeColors = React.useMemo(() => ({
        amber: "#facc15",
        cyan: isDarkMode ? "#22d3ee" : "#06b6d4",
        indigo: isDarkMode ? "#818cf8" : "#6366f1",
        blue: isDarkMode ? "#60a5fa" : "#3b82f6",
        green: isDarkMode ? "#4ade80" : "#22c55e",
        orange: isDarkMode ? "#fb923c" : "#f97316",
    }), [isDarkMode]);

    const GRID_START_X = 30;
    const COL_WIDTH = 350;
    const ROW_1_Y = 0;
    const ROW_2_Y = 350;

    const initialNodes = React.useMemo(
        () => [
            // --- Inputs Column (Left Most) ---
            {
                id: "knowledgeBase",
                type: "knowledgeBaseNode",
                position: { x: GRID_START_X, y: ROW_1_Y },
                data: {
                    label: "Knowledge Base",
                    description: "RAG context source",
                    iconBg: "bg-cyan-500",
                    knowledgeBases,
                    selectedKnowledgeBases,
                    onKnowledgeBaseChange,
                    codeType,
                    onCodeTypeChange,
                    useCases,
                    isCodeLocked,
                },
            },
            {
                id: "userCode",
                type: "userCodeNode",
                position: { x: GRID_START_X, y: ROW_2_Y + 40 },
                data: {
                    label: "Your Code",
                    description: "Input code for review",
                },
            },

            // --- Column 2: Reviewer ---
            {
                id: "reviewerPrompt",
                type: "promptNode",
                position: { x: GRID_START_X + COL_WIDTH + 100, y: ROW_1_Y },
                data: {
                    label: "Reviewer Prompts",
                    description: "Select prompts for reviewer",
                    iconBg: "bg-indigo-500",
                    agent: "reviewer",
                    prompts: prompts.reviewer || [],
                    selectedPrompts: selectedPrompts.reviewer || [],
                    onPromptChange,
                },
            },
            {
                id: "reviewer",
                type: "agentNode",
                position: { x: GRID_START_X + COL_WIDTH, y: ROW_2_Y },
                data: {
                    id: "reviewer",
                    label: "Reviewer Agent",
                    description: "Analyzes code quality",
                    icon: ScanSearch,
                    iconBg: "bg-blue-500",
                    model: agentModels.reviewer,
                    models,
                    onModelChange,
                },
            },

            // --- Column 3: Implementation ---
            {
                id: "implementationPrompt",
                type: "promptNode",
                position: { x: GRID_START_X + COL_WIDTH * 2, y: ROW_1_Y },
                data: {
                    label: "Implementation Prompts",
                    description: "Select prompts for changes",
                    iconBg: "bg-indigo-500",
                    agent: "implementation",
                    prompts: prompts.implementation || [],
                    selectedPrompts: selectedPrompts.implementation || [],
                    onPromptChange,
                },
            },
            {
                id: "implementation",
                type: "agentNode",
                position: { x: GRID_START_X + COL_WIDTH * 2, y: ROW_2_Y },
                data: {
                    id: "implementation",
                    label: "Implementation Agent",
                    description: "Implements code changes",
                    icon: Wrench,
                    iconBg: "bg-green-500",
                    model: agentModels.implementation,
                    models,
                    onModelChange,
                },
            },

            // --- Column 4: Tester ---
            {
                id: "testerPrompt",
                type: "promptNode",
                position: { x: GRID_START_X + COL_WIDTH * 3, y: ROW_1_Y },
                data: {
                    label: "Tester Prompts",
                    description: "Select prompts for testing",
                    iconBg: "bg-indigo-500",
                    agent: "tester",
                    prompts: prompts.tester || [],
                    selectedPrompts: selectedPrompts.tester || [],
                    onPromptChange,
                },
            },
            {
                id: "tester",
                type: "agentNode",
                position: { x: GRID_START_X + COL_WIDTH * 3, y: ROW_2_Y },
                data: {
                    id: "tester",
                    label: "Tester Agent",
                    description: "Tests code functionality",
                    icon: BugPlay,
                    iconBg: "bg-orange-500",
                    model: agentModels.tester,
                    models,
                    onModelChange,
                },
            },

            // --- Column 5: Report ---
            {
                id: "reportPrompt",
                type: "promptNode",
                position: { x: GRID_START_X + COL_WIDTH * 4, y: ROW_1_Y },
                data: {
                    label: "Report Prompts",
                    description: "Select prompts for report",
                    iconBg: "bg-indigo-500",
                    agent: "report",
                    prompts: prompts.report || [],
                    selectedPrompts: selectedPrompts.report || [],
                    onPromptChange,
                },
            },
            {
                id: "report",
                type: "agentNode",
                position: { x: GRID_START_X + COL_WIDTH * 4, y: ROW_2_Y },
                data: {
                    id: "report",
                    label: "Report Agent",
                    description: "Generates final report",
                    icon: FileText,
                    iconBg: "bg-purple-500",
                    model: agentModels.report,
                    models,
                    onModelChange,
                },
            },
        ],
        [agentModels, models, onModelChange, knowledgeBases, selectedKnowledgeBases, onKnowledgeBaseChange, codeType, onCodeTypeChange, useCases, prompts, selectedPrompts, onPromptChange, isCodeLocked]
    );

    const initialEdges = React.useMemo(
        () => [
            // --- 1. Knowledge Base Flow ---
            {
                id: "e_kb_reviewer",
                source: "knowledgeBase",
                target: "reviewer",
                targetHandle: "kb-in",
                type: "smoothstep",
                animated: true,
                style: { stroke: edgeColors.cyan, strokeWidth: 2, strokeDasharray: "5,5" },
            },

            // --- 2. Vertical Downward Connections (Prompt -> Agent) ---
            {
                id: "e_reviewerPrompt_reviewer",
                source: "reviewerPrompt",
                target: "reviewer",
                targetHandle: "prompt-in",
                type: "default",
                animated: false,
                style: { stroke: edgeColors.indigo, strokeWidth: 3 },
                markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.indigo },
            },
            {
                id: "e_implementationPrompt_implementation",
                source: "implementationPrompt",
                target: "implementation",
                targetHandle: "prompt-in",
                type: "default",
                style: { stroke: edgeColors.indigo, strokeWidth: 3 },
                markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.indigo },
            },
            {
                id: "e_testerPrompt_tester",
                source: "testerPrompt",
                target: "tester",
                targetHandle: "prompt-in",
                type: "default",
                style: { stroke: edgeColors.indigo, strokeWidth: 3 },
                markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.indigo },
            },
            {
                id: "e_reportPrompt_report",
                source: "reportPrompt",
                target: "report",
                targetHandle: "prompt-in",
                type: "default",
                style: { stroke: edgeColors.indigo, strokeWidth: 3 },
                markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.indigo },
            },

            // --- 3. Horizontal Workflow Flow (Left to Right) ---
            {
                id: "e_userCode_reviewer",
                source: "userCode",
                target: "reviewer",
                targetHandle: "flow-in",
                type: "animated",
                style: { stroke: edgeColors.amber, strokeWidth: 3 },
                markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.amber },
            },
            {
                id: "e_reviewer_implementation",
                source: "reviewer",
                target: "implementation",
                targetHandle: "flow-in",
                type: "animated",
                style: { stroke: edgeColors.blue, strokeWidth: 3 },
                markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.blue },
            },
            {
                id: "e_implementation_tester",
                source: "implementation",
                target: "tester",
                targetHandle: "flow-in",
                type: "animated",
                style: { stroke: edgeColors.green, strokeWidth: 3 },
                markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.green },
            },
            {
                id: "e_tester_report",
                source: "tester",
                target: "report",
                targetHandle: "flow-in",
                type: "animated",
                style: { stroke: edgeColors.orange, strokeWidth: 3 },
                markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.orange },
            },
        ],
        [edgeColors]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    React.useEffect(() => {
        setEdges(initialEdges);
    }, [initialEdges, setEdges]);

    React.useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.type === "agentNode" && node.data && node.data.id) {
                    return { ...node, data: { ...node.data, model: agentModels[node.data.id] } };
                }
                return node;
            })
        );
    }, [agentModels, setNodes]);

    React.useEffect(() => {
        setNodes(initialNodes);
    }, [initialNodes, setNodes]);

    React.useEffect(() => {
        if (codeType && onKnowledgeBaseChange) {
            const matchingKnowledgeBase = knowledgeBases.find(kb => kb.id === codeType);
            if (matchingKnowledgeBase && !selectedKnowledgeBases.includes(codeType)) {
                onKnowledgeBaseChange(codeType);
            }
        }
    }, [codeType, knowledgeBases, selectedKnowledgeBases, onKnowledgeBaseChange]);

    return (
        <div className="w-full">
            <div className="border rounded-lg bg-background shadow-sm flex flex-col">
                {/* Header - responsive layout */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 sm:px-4 py-2 sm:py-3 border-b gap-2 sm:gap-3">
                    <div className="text-sm font-medium text-foreground">
                        AI Workflow Configuration
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">
                            <Button type="button" size="icon" variant="outline" onClick={handleZoomOut} className="h-8 w-8 sm:h-9 sm:w-9">
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                            <Button type="button" size="icon" variant="outline" onClick={handleZoomIn} className="h-8 w-8 sm:h-9 sm:w-9">
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 ml-auto sm:ml-0">
                            <Button type="button" onClick={onSave} size="sm" className="text-xs sm:text-sm h-8 sm:h-9">
                                Save
                                <span className="hidden sm:inline ml-1">Configuration</span>
                            </Button>
                            <Button type="button" onClick={onCancel} variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile hint */}
                <div className="sm:hidden px-3 py-2 bg-muted/50 border-b">
                    <p className="text-xs text-muted-foreground text-center">
                        Pinch to zoom • Drag to pan • Tap nodes to configure
                    </p>
                </div>

                {/* ReactFlow container - responsive height */}
                <div className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-[800px]">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.1 }}
                        minZoom={MIN_ZOOM}
                        maxZoom={MAX_ZOOM}
                        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
                        nodesDraggable
                        nodesConnectable={false}
                        elementsSelectable
                        snapToGrid
                        snapGrid={[20, 20]}
                        onInit={(instance) => { reactFlowInstanceRef.current = instance; }}
                        panOnScroll
                        panOnDrag
                        zoomOnPinch
                    >
                        <Controls className="!bg-card !border-border !left-2 !bottom-2 sm:!left-4 sm:!bottom-4" showInteractive={false} />
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}

