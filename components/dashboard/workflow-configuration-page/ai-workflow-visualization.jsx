"use client";

import React from "react";
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    MarkerType,
    MiniMap,
    Background,
} from "reactflow";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { usePathname } from "@/i18n/navigation";
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
    prompts = {},
    selectedPrompts = {},
    selectedSystemPrompts = {},
    onPromptChange,
    onSave,
    onCancel,
    isRefreshingAll = false,
}) {
    const [isDarkMode, setIsDarkMode] = React.useState(false);
    const [hasPositionChanges, setHasPositionChanges] = React.useState(false);
    const reactFlowInstanceRef = React.useRef(null);

    // Detect demo mode once at this level and pass down to nodes
    const pathname = usePathname();
    const isDemoMode = pathname?.startsWith('/demo');

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

    // Read the user's primary color from CSS variable
    const primaryColor = React.useMemo(() => {
        if (typeof window === 'undefined') return isDarkMode ? "#22d3ee" : "#06b6d4";
        const style = getComputedStyle(document.documentElement);
        return style.getPropertyValue('--primary').trim() || (isDarkMode ? "#22d3ee" : "#06b6d4");
    }, [isDarkMode]);

    const edgeColors = React.useMemo(() => ({
        amber: primaryColor,
        cyan: primaryColor,
        indigo: primaryColor,
        blue: primaryColor,
        green: primaryColor,
        orange: primaryColor,
    }), [primaryColor]);

    const GRID_START_X = 30;
    const COL_WIDTH = 380;
    const ROW_1_Y = 0;
    const ROW_2_Y = 320;

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
                    iconBg: "bg-primary",
                    knowledgeBases,
                    selectedKnowledgeBases,
                    onKnowledgeBaseChange,
                    codeType,
                    onCodeTypeChange,
                    isRefreshingAll,
                    isDemoMode,
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
                    iconBg: "bg-primary",
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
                    iconBg: "bg-agent-reviewer",
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
                    iconBg: "bg-primary",
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
                    iconBg: "bg-agent-implementation",
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
                    iconBg: "bg-primary",
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
                    iconBg: "bg-agent-tester",
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
                    iconBg: "bg-primary",
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
                    iconBg: "bg-agent-report",
                    model: agentModels.report,
                    models,
                    onModelChange,
                    isRefreshingAll,
                },
            },
        ],
        [agentModels, models, onModelChange, knowledgeBases, selectedKnowledgeBases, onKnowledgeBaseChange, codeType, onCodeTypeChange, prompts, selectedPrompts, onPromptChange, isRefreshingAll, isDemoMode, getNodePosition]
    );

    const initialEdges = React.useMemo(
        () => [
            // --- 1. Knowledge Base Flow (dashed, cyan) ---
            {
                id: "e_kb_reviewer",
                source: "knowledgeBase",
                target: "reviewer",
                targetHandle: "kb-in",
                type: "animated",
                animated: true,
                style: { stroke: edgeColors.cyan, strokeWidth: 2, strokeDasharray: "5,5" },
                data: { duration: "4s", radius: 4 },
            },

            // --- 2. Prompt → Agent (vertical, primary color, solid) ---
            {
                id: "e_reviewerPrompt_reviewer",
                source: "reviewerPrompt",
                target: "reviewer",
                targetHandle: "prompt-in",
                type: "animated",
                style: { stroke: edgeColors.indigo, strokeWidth: 2.5 },
                markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.indigo, width: 18, height: 18 },
                data: { duration: "2s", radius: 4 },
            },
            {
                id: "e_implementationPrompt_implementation",
                source: "implementationPrompt",
                target: "implementation",
                targetHandle: "prompt-in",
                type: "animated",
                style: { stroke: edgeColors.indigo, strokeWidth: 2.5 },
                markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.indigo, width: 18, height: 18 },
                data: { duration: "2s", radius: 4 },
            },
            {
                id: "e_testerPrompt_tester",
                source: "testerPrompt",
                target: "tester",
                targetHandle: "prompt-in",
                type: "animated",
                style: { stroke: edgeColors.indigo, strokeWidth: 2.5 },
                markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.indigo, width: 18, height: 18 },
                data: { duration: "2s", radius: 4 },
            },
            {
                id: "e_reportPrompt_report",
                source: "reportPrompt",
                target: "report",
                targetHandle: "prompt-in",
                type: "animated",
                style: { stroke: edgeColors.indigo, strokeWidth: 2.5 },
                markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.indigo, width: 18, height: 18 },
                data: { duration: "2s", radius: 4 },
            },

            // --- 3. Horizontal Code Flow (thick, primary, animated) ---
            {
                id: "e_userCode_reviewer",
                source: "userCode",
                target: "reviewer",
                targetHandle: "flow-in",
                type: "animated",
                animated: true,
                style: { stroke: edgeColors.amber, strokeWidth: 3 },
                markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.amber, width: 20, height: 20 },
            },
            {
                id: "e_reviewer_implementation",
                source: "reviewer",
                target: "implementation",
                targetHandle: "flow-in",
                type: "animated",
                animated: true,
                style: { stroke: edgeColors.blue, strokeWidth: 3 },
                markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.blue, width: 20, height: 20 },
            },
            {
                id: "e_implementation_tester",
                source: "implementation",
                target: "tester",
                targetHandle: "flow-in",
                type: "animated",
                animated: true,
                style: { stroke: edgeColors.green, strokeWidth: 3 },
                markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.green, width: 20, height: 20 },
            },
            {
                id: "e_tester_report",
                source: "tester",
                target: "report",
                targetHandle: "flow-in",
                type: "animated",
                animated: true,
                style: { stroke: edgeColors.orange, strokeWidth: 3 },
                markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors.orange, width: 20, height: 20 },
            },
        ],
        [edgeColors, primaryColor]
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

    // Update promptNode data when selectedPrompts changes (for cross-tab synchronization)
    React.useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.type === "promptNode" && node.data && node.data.agent) {
                    const agent = node.data.agent;
                    const agentPrompts = prompts[agent] || [];
                    const agentSelectedPrompts = selectedPrompts[agent] || [];
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            prompts: agentPrompts,
                            selectedPrompts: agentSelectedPrompts
                        }
                    };
                }
                return node;
            })
        );
    }, [selectedPrompts, prompts, setNodes]);

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
        <div className="w-full overflow-hidden">
            <div className="border rounded-lg bg-background shadow-sm flex flex-col overflow-hidden">
                {/* Header - responsive layout */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end px-3 sm:px-4 py-2.5 sm:py-3 border-b bg-muted/30 gap-2 sm:gap-3">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {/* Zoom controls */}
                        <div className="flex items-center gap-1 bg-background/50 rounded-md p-0.5">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button type="button" size="icon" variant="ghost" onClick={handleZoomOut} className="h-7 w-7 sm:h-8 sm:w-8" aria-label="Zoom out">
                                        <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Zoom out</TooltipContent>
                            </Tooltip>
                            <div className="w-px h-4 bg-border" />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button type="button" size="icon" variant="ghost" onClick={handleZoomIn} className="h-7 w-7 sm:h-8 sm:w-8" aria-label="Zoom in">
                                        <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Zoom in</TooltipContent>
                            </Tooltip>
                        </div>

                        {/* Divider */}
                        <div className="hidden sm:block w-px h-6 bg-border/60" />

                        {/* Layout controls */}
                        <div className="flex items-center gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={hasPositionChanges ? "default" : "ghost"}
                                        onClick={handleSavePositions}
                                        className={`h-7 sm:h-8 text-xs px-2 sm:px-3 ${hasPositionChanges ? '' : 'text-muted-foreground'}`}
                                    >
                                        <Save className="w-3.5 h-3.5 sm:mr-1.5" />
                                        <span className="hidden sm:inline">Save layout</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Save current layout</TooltipContent>
                            </Tooltip>
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
                            <Button type="button" onClick={() => {
                                // Helper to resolve prompt text
                                const getPromptText = (agentId, promptId) => {
                                    if (!promptId) return '';
                                    const agentPrompts = prompts[agentId] || [];
                                    const prompt = agentPrompts.find(p => p.id === promptId);
                                    return prompt?.text || '';
                                };
                                // Save all configurations before closing
                                try {
                                    // Save agent configurations (include prompt info)
                                    const agentConfigurations = {
                                        reviewer: {
                                            enabled: true,
                                            modelId: agentModels['reviewer'] || 'anthropic.claude-3-sonnet-20240229-v1:0',
                                            customPrompt: getPromptText('reviewer', selectedSystemPrompts?.['reviewer']),
                                            promptId: selectedSystemPrompts?.['reviewer'] || '',
                                        },
                                        implementer: {
                                            enabled: !!agentModels['implementation'],
                                            modelId: agentModels['implementation'] || 'anthropic.claude-3-sonnet-20240229-v1:0',
                                            customPrompt: getPromptText('implementation', selectedSystemPrompts?.['implementation']),
                                            promptId: selectedSystemPrompts?.['implementation'] || '',
                                        },
                                        tester: {
                                            enabled: !!agentModels['tester'],
                                            modelId: agentModels['tester'] || 'anthropic.claude-3-sonnet-20240229-v1:0',
                                            customPrompt: getPromptText('tester', selectedSystemPrompts?.['tester']),
                                            promptId: selectedSystemPrompts?.['tester'] || '',
                                        },
                                        reporter: {
                                            enabled: true,
                                            modelId: agentModels['report'] || 'anthropic.claude-3-sonnet-20240229-v1:0',
                                            customPrompt: getPromptText('report', selectedSystemPrompts?.['report']),
                                            promptId: selectedSystemPrompts?.['report'] || '',
                                        },
                                    };
                                    localStorage.setItem('vulniq_agent_configurations', JSON.stringify(agentConfigurations));

                                    // Save selected prompts
                                    if (selectedPrompts) {
                                        localStorage.setItem('vulniq_selected_prompts', JSON.stringify(selectedPrompts));
                                    }

                                    // Save selected knowledge bases
                                    if (selectedKnowledgeBases && selectedKnowledgeBases.length > 0) {
                                        localStorage.setItem('vulniq_selected_groups', JSON.stringify(selectedKnowledgeBases));
                                    }

                                    toast.success('Workflow configuration saved!');
                                } catch (err) {
                                    console.error('Error saving configuration:', err);
                                    toast.error('Failed to save some configurations');
                                }
                                onSave();
                            }} size="sm" className="text-xs h-7 sm:h-8 px-3 sm:px-4">
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
                    className="h-96 sm:h-[32rem] md:h-[38rem] lg:h-[50rem] relative overflow-hidden"
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
                        panOnScroll={false}
                        panOnDrag
                        zoomOnScroll={false}
                        zoomOnPinch
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background
                            color={isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
                            gap={20}
                            size={1}
                        />
                        <MiniMap
                            nodeStrokeWidth={3}
                            zoomable
                            pannable
                            className="!bg-background/80 !border !border-border !rounded-lg !shadow-lg"
                            maskColor={isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'}
                            style={{ width: 150, height: 100 }}
                        />
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}

