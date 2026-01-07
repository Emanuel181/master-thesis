"use client";

import React from "react";
import {
    ReactFlow,
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
    isRefreshingAll = false,
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
                    label: "Knowledge base",
                    description: "RAG context source",
                    iconBg: "bg-cyan-500",
                    knowledgeBases,
                    selectedKnowledgeBases,
                    onKnowledgeBaseChange,
                    codeType,
                    onCodeTypeChange,
                    useCases,
                    isCodeLocked,
                    isRefreshingAll,
                },
            },
            {
                id: "userCode",
                type: "userCodeNode",
                position: getNodePosition("userCode"),
                data: {
                    label: "Your code",
                    description: "Input code for review",
                },
            },

            // --- Column 2: Reviewer ---
            {
                id: "reviewerPrompt",
                type: "promptNode",
                position: getNodePosition("reviewerPrompt"),
                data: {
                    label: "Reviewer prompt",
                    description: "Select prompts for reviewer",
                    iconBg: "bg-indigo-500",
                    agent: "reviewer",
                    prompts: prompts.reviewer || [],
                    selectedPrompts: selectedPrompts.reviewer || [],
                    onPromptChange,
                    isRefreshingAll,
                },
            },
            {
                id: "reviewer",
                type: "agentNode",
                position: getNodePosition("reviewer"),
                data: {
                    id: "reviewer",
                    label: "Reviewer agent",
                    description: "Analyzes code quality",
                    icon: ScanSearch,
                    iconBg: "bg-blue-500",
                    model: agentModels.reviewer,
                    models,
                    onModelChange,
                    isRefreshingAll,
                },
            },

            // --- Column 3: Implementation ---
            {
                id: "implementationPrompt",
                type: "promptNode",
                position: getNodePosition("implementationPrompt"),
                data: {
                    label: "Implementation prompt",
                    description: "Select prompts for changes",
                    iconBg: "bg-indigo-500",
                    agent: "implementation",
                    prompts: prompts.implementation || [],
                    selectedPrompts: selectedPrompts.implementation || [],
                    onPromptChange,
                    isRefreshingAll,
                },
            },
            {
                id: "implementation",
                type: "agentNode",
                position: getNodePosition("implementation"),
                data: {
                    id: "implementation",
                    label: "Implementation agent",
                    description: "Implements code changes",
                    icon: Wrench,
                    iconBg: "bg-green-500",
                    model: agentModels.implementation,
                    models,
                    onModelChange,
                    isRefreshingAll,
                },
            },

            // --- Column 4: Tester ---
            {
                id: "testerPrompt",
                type: "promptNode",
                position: getNodePosition("testerPrompt"),
                data: {
                    label: "Tester prompt",
                    description: "Select prompts for testing",
                    iconBg: "bg-indigo-500",
                    agent: "tester",
                    prompts: prompts.tester || [],
                    selectedPrompts: selectedPrompts.tester || [],
                    onPromptChange,
                    isRefreshingAll,
                },
            },
            {
                id: "tester",
                type: "agentNode",
                position: getNodePosition("tester"),
                data: {
                    id: "tester",
                    label: "Tester agent",
                    description: "Tests code functionality",
                    icon: BugPlay,
                    iconBg: "bg-orange-500",
                    model: agentModels.tester,
                    models,
                    onModelChange,
                    isRefreshingAll,
                },
            },

            // --- Column 5: Report ---
            {
                id: "reportPrompt",
                type: "promptNode",
                position: getNodePosition("reportPrompt"),
                data: {
                    label: "Report prompt",
                    description: "Select prompts for report",
                    iconBg: "bg-indigo-500",
                    agent: "report",
                    prompts: prompts.report || [],
                    selectedPrompts: selectedPrompts.report || [],
                    onPromptChange,
                    isRefreshingAll,
                },
            },
            {
                id: "report",
                type: "agentNode",
                position: getNodePosition("report"),
                data: {
                    id: "report",
                    label: "Report agent",
                    description: "Generates final report",
                    icon: FileText,
                    iconBg: "bg-purple-500",
                    model: agentModels.report,
                    models,
                    onModelChange,
                    isRefreshingAll,
                },
            },
        ],
        [agentModels, models, onModelChange, knowledgeBases, selectedKnowledgeBases, onKnowledgeBaseChange, codeType, onCodeTypeChange, useCases, prompts, selectedPrompts, onPromptChange, isCodeLocked, isRefreshingAll, getNodePosition]
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
            <div className="border rounded-lg bg-background shadow-sm flex flex-col overflow-hidden">
                {/* Header - responsive layout */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b bg-muted/30 gap-2 sm:gap-3">
                    <div className="text-sm font-semibold text-foreground">
                        AI workflow configuration
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {/* Zoom controls */}
                        <div className="flex items-center gap-1 bg-background/50 rounded-md p-0.5">
                            <Button type="button" size="icon" variant="ghost" onClick={handleZoomOut} className="h-7 w-7 sm:h-8 sm:w-8" title="Zoom out">
                                <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                            <div className="w-px h-4 bg-border" />
                            <Button type="button" size="icon" variant="ghost" onClick={handleZoomIn} className="h-7 w-7 sm:h-8 sm:w-8" title="Zoom in">
                                <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                        </div>

                        {/* Divider */}
                        <div className="hidden sm:block w-px h-6 bg-border/60" />

                        {/* Layout controls */}
                        <div className="flex items-center gap-1">
                            <Button
                                type="button"
                                size="sm"
                                variant={hasPositionChanges ? "default" : "ghost"}
                                onClick={handleSavePositions}
                                className={`h-7 sm:h-8 text-xs px-2 sm:px-3 ${hasPositionChanges ? '' : 'text-muted-foreground'}`}
                                title="Save current layout"
                            >
                                <Save className="w-3.5 h-3.5 sm:mr-1.5" />
                                <span className="hidden sm:inline">Save layout</span>
                            </Button>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={handleResetPositions}
                                className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground"
                                title="Reset to default layout"
                            >
                                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                        </div>

                        {/* Divider */}
                        <div className="hidden sm:block w-px h-6 bg-border/60" />

                        {/* Config save/cancel */}
                        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                            <Button type="button" onClick={onCancel} variant="ghost" size="sm" className="text-xs h-7 sm:h-8 px-2 sm:px-3 text-muted-foreground">
                                Cancel
                            </Button>
                            <Button type="button" onClick={onSave} size="sm" className="text-xs h-7 sm:h-8 px-3 sm:px-4">
                                Save
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile hint */}
                <div className="sm:hidden px-3 py-1.5 bg-muted/30 border-b">
                    <p className="text-[10px] text-muted-foreground text-center">
                        Drag nodes to rearrange • Pinch to zoom
                    </p>
                </div>

                {/* ReactFlow container - responsive height */}
                <div
                    className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-[800px]"
                    style={{
                        backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
                        backgroundImage: `radial-gradient(circle, ${isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'} 1px, transparent 1px)`,
                        backgroundSize: '20px 20px',
                    }}
                >
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
                        style={{ background: 'transparent' }}
                    />
                </div>
            </div>
        </div>
    );
}

