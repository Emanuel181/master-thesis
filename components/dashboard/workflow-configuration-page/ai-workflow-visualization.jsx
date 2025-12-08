"use client";

import React from "react";
import {
    ReactFlow,
    Controls,
    useNodesState,
    useEdgesState,
    MarkerType,
    BaseEdge,
    getSmoothStepPath,
    Handle,
    Position,
} from "reactflow";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Code,
    ScanSearch,
    Wrench,
    BugPlay,
    FileText,
    ZoomIn,
    ZoomOut,
    Database,
    ChevronDown,
    RefreshCw,
    MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import "reactflow/dist/style.css";

// -------- Custom Animated Edge --------

function AnimatedSVGEdge({
                             id,
                             sourceX,
                             sourceY,
                             targetX,
                             targetY,
                             sourcePosition,
                             targetPosition,
                             style = {},
                             markerEnd,
                             label,
                             labelStyle,
                             data,
                         }) {
    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const circleColor = style.stroke || "#3b82f6";
    const duration = data?.duration || "3s";

    return (
        <>
            <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
            {label && (
                <text>
                    <textPath
                        href={`#${id}`}
                        startOffset="50%"
                        textAnchor="middle"
                        style={labelStyle}
                    >
                        {label}
                    </textPath>
                </text>
            )}
            <circle r="6" fill={circleColor} opacity="0.8">
                <animateMotion dur={duration} repeatCount="indefinite" path={edgePath} />
            </circle>
        </>
    );
}

// -------- Custom Nodes --------

function AgentNode({ data }) {
    const Icon = data.icon;
    const borderColorMap = {
        "bg-blue-500": "border-blue-500 dark:border-blue-400",
        "bg-green-500": "border-green-500 dark:border-green-400",
        "bg-orange-500": "border-orange-500 dark:border-orange-400",
        "bg-purple-500": "border-purple-500 dark:border-purple-400",
    };
    const borderColor =
        borderColorMap[data.iconBg] || "border-gray-300 dark:border-gray-600";

    return (
        <>
            {/* Input from Previous Agent (Left) */}
            <Handle type="target" position={Position.Left} id="flow-in" className="!bg-border !w-3 !h-3" />

            {/* Input from Knowledge Base (Top - Offset Left) */}
            <Handle
                type="target"
                position={Position.Top}
                id="kb-in"
                className="!bg-cyan-500 !w-3 !h-3"
                style={{ left: '25%' }}
                title="Knowledge Base Context"
            />

            {/* Input from Prompt (Top - Offset Right to avoid collision) */}
            <Handle
                type="target"
                position={Position.Top}
                id="prompt-in"
                className="!bg-indigo-500 !w-3 !h-3"
                style={{ left: '75%' }}
                title="Prompt Instructions"
            />

            <Card className={`min-w-[240px] shadow-lg border-2 ${borderColor}`}>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-3 rounded-lg ${data.iconBg}`}>
                            <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="font-semibold text-base">{data.label}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-3">
                        {data.description}
                    </div>
                    <div className="mb-2">
                        <div className="text-xs font-medium text-muted-foreground mb-1">AI Model:</div>
                        <span className="text-xs text-muted-foreground">Select the AI model for this agent</span>
                    </div>
                    <Select
                        value={data.model}
                        onValueChange={(value) => data.onModelChange(data.id, value)}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                            {data.models.map((model) => (
                                <SelectItem key={model} value={model} className="text-xs">
                                    {model}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Output to Next Agent (Right) */}
            <Handle type="source" position={Position.Right} id="flow-out" className="!bg-border !w-3 !h-3" />
        </>
    );
}

function UserCodeNode({ data }) {
    return (
        <>
            <Card className="min-w-[220px] shadow-lg border-2 border-yellow-400 dark:border-yellow-400">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 rounded-lg bg-yellow-400">
                            <Code className="w-7 h-7 text-gray-900" strokeWidth={2.5} />
                        </div>
                        <div className="font-semibold text-base">{data.label}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {data.description}
                    </div>
                </CardContent>
            </Card>
            <Handle type="source" position={Position.Right} className="!bg-border !w-3 !h-3" />
        </>
    );
}

function KnowledgeBaseNode({ data }) {
    const [open, setOpen] = React.useState(false);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const borderColorMap = {
        "bg-cyan-500": "border-cyan-500 dark:border-cyan-400",
    };
    const borderColor = borderColorMap[data.iconBg] || "border-cyan-500 dark:border-cyan-400";

    const selectedCount = data.selectedKnowledgeBases?.length || 0;
    const selectedNames = data.knowledgeBases
        .filter(kb => data.selectedKnowledgeBases?.includes(kb.id))
        .map(kb => kb.name)
        .join(", ");

    const handleToggle = (kbId) => {
        if (data.onKnowledgeBaseChange) {
            data.onKnowledgeBaseChange(kbId);
        }
    };

    const handleCodeTypeChange = (newCodeType) => {
        if (data.onCodeTypeChange) {
            data.onCodeTypeChange(newCodeType);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1500);
    };

    const isKnowledgeBaseDisabled = !data.codeType;

    return (
        <>
            <Card className={`min-w-[280px] shadow-lg border-2 ${borderColor}`}>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-3 rounded-lg ${data.iconBg}`}>
                            <Database className="w-6 h-6 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-base">{data.label}</div>
                            <div className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                                {selectedCount} selected
                            </div>
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-3">
                        {data.description}
                    </div>

                    <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="text-xs font-medium text-muted-foreground">Code Type:</div>
                            <span className="text-xs text-muted-foreground">Select use case</span>
                        </div>
                        <Select
                            value={data.codeType || ""}
                            onValueChange={handleCodeTypeChange}
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Select code type" />
                            </SelectTrigger>
                            <SelectContent>
                                {data.useCases?.map((uc) => (
                                    <SelectItem key={uc.id} value={uc.id} className="text-xs">
                                        {uc.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1">
                            <div className="text-xs font-medium text-muted-foreground mb-1">Knowledge Bases:</div>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full h-auto justify-between text-left font-normal p-2"
                                disabled={isKnowledgeBaseDisabled}
                            >
                                <div className="flex-1 min-w-0">
                                    {selectedCount > 0 ? (
                                        <span className="text-xs truncate block">
                                            {selectedNames}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">
                                            Select knowledge bases
                                        </span>
                                    )}
                                </div>
                                <ChevronDown className="h-4 w-4 ml-2 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                            <div className="p-3 border-b">
                                <p className="text-sm font-medium">Select Knowledge Bases</p>
                            </div>
                            <div className="p-2 max-h-[300px] overflow-y-auto">
                                {data.knowledgeBases.map((kb) => {
                                    const IconComponent = LucideIcons[kb.icon];
                                    const isSelected = data.selectedKnowledgeBases?.includes(kb.id);

                                    return (
                                        <div
                                            key={kb.id}
                                            className={cn(
                                                "flex items-start gap-3 rounded-md p-3 cursor-pointer transition-colors",
                                                "hover:bg-accent",
                                                isSelected && "bg-cyan-5 dark:bg-cyan-950/30"
                                            )}
                                            onClick={() => handleToggle(kb.id)}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                className="mt-0.5 pointer-events-none"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {IconComponent && (
                                                        <IconComponent className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                                                    )}
                                                    <span className="text-sm font-medium">
                                                        {kb.name}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {kb.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </PopoverContent>
                    </Popover>
                </CardContent>
            </Card>
            {/* Output to Prompts/Agents (Right) */}
            <Handle type="source" position={Position.Right} className="!bg-border !w-3 !h-3" />
        </>
    );
}

function PromptNode({ data }) {
    const [open, setOpen] = React.useState(false);
    const borderColorMap = {
        "bg-indigo-500": "border-indigo-500 dark:border-indigo-400",
    };
    const borderColor = borderColorMap[data.iconBg] || "border-indigo-500 dark:border-indigo-400";

    const selectedCount = data.selectedPrompts?.length || 0;
    const selectedTexts = data.prompts
        .filter(p => data.selectedPrompts?.includes(p.id))
        .map(p => p.text.length > 30 ? p.text.substring(0, 30) + "..." : p.text)
        .join(", ");

    const handleToggle = (promptId) => {
        if (data.onPromptChange) {
            data.onPromptChange(data.agent, promptId);
        }
    };

    // LOGIC CHANGE: No prompt nodes show KB input anymore
    // Reviewer, Implementation, Tester, and Report are all disconnected from KB.
    const showKbInput = !["reviewer", "implementation", "tester", "report"].includes(data.agent);

    return (
        <>
            {/* Input from KB (Left) - Conditionally Rendered */}
            {showKbInput && (
                <Handle type="target" position={Position.Left} className="!bg-cyan-500 !w-3 !h-3" />
            )}

            <Card className={`min-w-[280px] shadow-lg border-2 ${borderColor}`}>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-3 rounded-lg ${data.iconBg}`}>
                            <MessageSquare className="w-6 h-6 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-base">{data.label}</div>
                            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                {selectedCount} selected
                            </div>
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-3">
                        {data.description}
                    </div>

                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full h-auto justify-between text-left font-normal p-2"
                            >
                                <div className="flex-1 min-w-0">
                                    {selectedCount > 0 ? (
                                        <span className="text-xs truncate block">
                                            {selectedTexts}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">
                                            Select prompts
                                        </span>
                                    )}
                                </div>
                                <ChevronDown className="h-4 w-4 ml-2 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                            <div className="p-3 border-b">
                                <p className="text-sm font-medium">Select Prompts for {data.agent}</p>
                            </div>
                            <div className="p-2 max-h-[300px] overflow-y-auto">
                                {data.prompts.map((prompt) => {
                                    const isSelected = data.selectedPrompts?.includes(prompt.id);

                                    return (
                                        <div
                                            key={prompt.id}
                                            className={cn(
                                                "flex items-start gap-3 rounded-md p-3 cursor-pointer transition-colors",
                                                "hover:bg-accent",
                                                isSelected && "bg-indigo-5 dark:bg-indigo-950/30"
                                            )}
                                            onClick={() => handleToggle(prompt.id)}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                className="mt-0.5 pointer-events-none"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm">
                                                    {prompt.text}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </PopoverContent>
                    </Popover>
                </CardContent>
            </Card>

            {/* Output to Agent (Bottom) */}
            <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-3 !h-3" />
        </>
    );
}

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

    const GRID_START_X = 50;
    const COL_WIDTH = 450;
    const ROW_1_Y = 0;
    const ROW_2_Y = 400;

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

            // CONNECTS: Knowledge Base -> Reviewer Agent
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
                <div className="flex items-center justify-between px-4 py-3 border-b gap-3">
                    <div className="text-sm font-medium text-foreground">
                        AI Workflow Configuration
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 mr-3">
                            <Button type="button" size="icon" variant="outline" onClick={handleZoomOut}>
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                            <Button type="button" size="icon" variant="outline" onClick={handleZoomIn}>
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                        </div>
                        <Button type="button" onClick={onSave}>Save Configuration</Button>
                        <Button type="button" onClick={onCancel} variant="outline">Cancel</Button>
                    </div>
                </div>

                <div className="h-[800px]">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.2 }}
                        minZoom={MIN_ZOOM}
                        maxZoom={MAX_ZOOM}
                        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                        nodesDraggable
                        nodesConnectable={false}
                        elementsSelectable
                        snapToGrid
                        snapGrid={[20, 20]}
                        onInit={(instance) => { reactFlowInstanceRef.current = instance; }}
                    >
                        <Controls className="!bg-card !border-border" />
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}