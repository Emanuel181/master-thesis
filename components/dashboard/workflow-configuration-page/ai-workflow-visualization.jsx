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
    RotateCcw,
    Save,
} from "lucide-react";
import { toast } from "sonner";
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

// Local storage key for node positions
const POSITIONS_STORAGE_KEY = 'workflow-node-positions';

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
    const [hasPositionChanges, setHasPositionChanges] = React.useState(false);
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
    const COL_WIDTH = 380;
    const ROW_1_Y = 0;
    const ROW_2_Y = 380;

    // Default positions for all nodes
    const defaultPositions = React.useMemo(() => ({
        knowledgeBase: { x: GRID_START_X, y: ROW_1_Y },
        userCode: { x: GRID_START_X, y: ROW_2_Y + 100 },
        reviewerPrompt: { x: GRID_START_X + COL_WIDTH, y: ROW_1_Y },
        reviewer: { x: GRID_START_X + COL_WIDTH, y: ROW_2_Y },
        implementationPrompt: { x: GRID_START_X + COL_WIDTH * 2, y: ROW_1_Y },
        implementation: { x: GRID_START_X + COL_WIDTH * 2, y: ROW_2_Y },
        testerPrompt: { x: GRID_START_X + COL_WIDTH * 3, y: ROW_1_Y },
        tester: { x: GRID_START_X + COL_WIDTH * 3, y: ROW_2_Y },
        reportPrompt: { x: GRID_START_X + COL_WIDTH * 4, y: ROW_1_Y },
        report: { x: GRID_START_X + COL_WIDTH * 4, y: ROW_2_Y },
    }), []);

    // Load saved positions from localStorage
    const getSavedPositions = React.useCallback(() => {
        if (typeof window === 'undefined') return null;
        try {
            const saved = localStorage.getItem(POSITIONS_STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    }, []);

    // Save positions to localStorage
    const savePositions = React.useCallback((positions) => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
            toast.success("Layout saved successfully");
            setHasPositionChanges(false);
        } catch {
            toast.error("Failed to save layout");
        }
    }, []);

    // Get position for a node (saved or default)
    const getNodePosition = React.useCallback((nodeId) => {
        const saved = getSavedPositions();
        if (saved && saved[nodeId]) {
            return saved[nodeId];
        }
        return defaultPositions[nodeId] || { x: 0, y: 0 };
    }, [getSavedPositions, defaultPositions]);

    const initialNodes = React.useMemo(
        () => [
            // --- Inputs Column (Left Most) ---
            {
                id: "knowledgeBase",
                type: "knowledgeBaseNode",
                position: getNodePosition("knowledgeBase"),
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
                position: getNodePosition("userCode"),
                data: {
                    label: "Your Code",
                    description: "Input code for review",
                },
            },

            // --- Column 2: Reviewer ---
            {
                id: "reviewerPrompt",
                type: "promptNode",
                position: getNodePosition("reviewerPrompt"),
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
                position: getNodePosition("reviewer"),
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
                position: getNodePosition("implementationPrompt"),
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
                position: getNodePosition("implementation"),
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
                position: getNodePosition("testerPrompt"),
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
                position: getNodePosition("tester"),
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
                position: getNodePosition("reportPrompt"),
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
                position: getNodePosition("report"),
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
        [agentModels, models, onModelChange, knowledgeBases, selectedKnowledgeBases, onKnowledgeBaseChange, codeType, onCodeTypeChange, useCases, prompts, selectedPrompts, onPromptChange, isCodeLocked, getNodePosition]
    );

    const initialEdges = React.useMemo(
        () => [
            // --- 1. Knowledge Base Flow (goes down then right to Reviewer) ---
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

    // Save current node positions
    const handleSavePositions = React.useCallback(() => {
        const positions = {};
        nodes.forEach(node => {
            positions[node.id] = node.position;
        });
        savePositions(positions);
    }, [nodes, savePositions]);

    // Reset to default positions
    const handleResetPositions = React.useCallback(() => {
        setNodes(nds => nds.map(node => ({
            ...node,
            position: defaultPositions[node.id] || node.position
        })));
        // Clear saved positions
        if (typeof window !== 'undefined') {
            localStorage.removeItem(POSITIONS_STORAGE_KEY);
        }
        setHasPositionChanges(false);
        toast.success("Layout reset to default");
    }, [defaultPositions, setNodes]);

    // Track position changes
    const handleNodesChangeWithTracking = React.useCallback((changes) => {
        onNodesChange(changes);
        // Check if any change is a position change
        const hasPositionChange = changes.some(change => change.type === 'position' && change.dragging === false);
        if (hasPositionChange) {
            setHasPositionChanges(true);
        }
    }, [onNodesChange]);

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
                        {/* Zoom controls */}
                        <div className="flex items-center gap-1">
                            <Button type="button" size="icon" variant="outline" onClick={handleZoomOut} className="h-8 w-8 sm:h-9 sm:w-9" title="Zoom out">
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                            <Button type="button" size="icon" variant="outline" onClick={handleZoomIn} className="h-8 w-8 sm:h-9 sm:w-9" title="Zoom in">
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                        </div>
                        {/* Layout controls */}
                        <div className="flex items-center gap-1">
                            <Button
                                type="button"
                                size="sm"
                                variant={hasPositionChanges ? "default" : "outline"}
                                onClick={handleSavePositions}
                                className="h-8 sm:h-9 text-xs sm:text-sm"
                                title="Save current layout"
                            >
                                <Save className="w-4 h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Save Layout</span>
                            </Button>
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={handleResetPositions}
                                className="h-8 w-8 sm:h-9 sm:w-9"
                                title="Reset to default layout"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                        </div>
                        {/* Config save/cancel */}
                        <div className="flex items-center gap-2 ml-auto sm:ml-0">
                            <Button type="button" onClick={onSave} size="sm" className="text-xs sm:text-sm h-8 sm:h-9">
                                Save
                                <span className="hidden sm:inline ml-1">Config</span>
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
                        Drag nodes to rearrange • Pinch to zoom • Save layout to persist
                    </p>
                </div>

                {/* ReactFlow container - responsive height */}
                <div className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-[800px]">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={handleNodesChangeWithTracking}
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

