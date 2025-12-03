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
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
            <circle r="8" fill={circleColor} opacity="0.8">
                <animateMotion dur={duration} repeatCount="indefinite" path={edgePath} />
            </circle>
            <circle r="8" fill={circleColor} opacity="0.6">
                <animateMotion
                    dur={duration}
                    repeatCount="indefinite"
                    path={edgePath}
                    begin="0.5s"
                />
            </circle>
            <circle r="8" fill={circleColor} opacity="0.4">
                <animateMotion
                    dur={duration}
                    repeatCount="indefinite"
                    path={edgePath}
                    begin="1s"
                />
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
            <Handle type="target" position={Position.Left} className="!bg-border" />
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
            <Handle type="source" position={Position.Right} className="!bg-border" />
        </>
    );
}

function UserCodeNode({ data }) {
    return (
        <>
            <Handle type="target" position={Position.Left} className="!bg-border" />
            <Card className="min-w-[220px] shadow-lg border-2 border-amber-700 dark:border-amber-600">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 rounded-lg bg-amber-700 dark:bg-amber-600">
                            <Code className="w-7 h-7 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="font-semibold text-base">{data.label}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {data.description}
                    </div>
                </CardContent>
            </Card>
            <Handle type="source" position={Position.Right} className="!bg-border" />
        </>
    );
}

const nodeTypes = {
    agentNode: AgentNode,
    userCodeNode: UserCodeNode,
};

const edgeTypes = {
    animated: AnimatedSVGEdge,
};

// -------- Main Component --------

export function AIWorkflowVisualization({
                                            models,
                                            agentModels,
                                            onModelChange,
                                            onSave,
                                            onCancel,
                                        }) {
    const [isDarkMode, setIsDarkMode] = React.useState(false);

    // Store React Flow instance so we can control zoom
    const reactFlowInstanceRef = React.useRef(null);

    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 1.5;
    const ZOOM_STEP = 0.15;

    const handleZoomIn = () => {
        const instance = reactFlowInstanceRef.current;
        if (!instance) return;
        const currentZoom = instance.getZoom();
        const nextZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
        instance.zoomTo(nextZoom);
    };

    const handleZoomOut = () => {
        const instance = reactFlowInstanceRef.current;
        if (!instance) return;
        const currentZoom = instance.getZoom();
        const nextZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
        instance.zoomTo(nextZoom);
    };

    React.useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains("dark"));
        };

        checkDarkMode();

        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    const getEdgeColors = React.useCallback((isDark) => {
        return {
            amber: isDark ? "#fbbf24" : "#b45309",
            blue: isDark ? "#60a5fa" : "#3b82f6",
            green: isDark ? "#4ade80" : "#22c55e",
            orange: isDark ? "#fb923c" : "#f97316",
        };
    }, []);

    const edgeColors = getEdgeColors(isDarkMode);

    const initialNodes = React.useMemo(
        () => [
            {
                id: "userCode",
                type: "userCodeNode",
                position: { x: 40, y: 160 },
                data: {
                    label: "Your Code",
                    description: "Input code for review",
                },
            },
            {
                id: "reviewer",
                type: "agentNode",
                position: { x: 360, y: 120 },
                data: {
                    id: "reviewer",
                    label: "Reviewer Agent",
                    description: "Analyzes and reviews code quality",
                    icon: ScanSearch,
                    iconBg: "bg-blue-500",
                    model: agentModels.reviewer,
                    models,
                    onModelChange,
                },
            },
            {
                id: "implementation",
                type: "agentNode",
                position: { x: 720, y: 160 },
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
            {
                id: "tester",
                type: "agentNode",
                position: { x: 1080, y: 200 },
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
            {
                id: "report",
                type: "agentNode",
                position: { x: 1440, y: 160 },
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
        [agentModels, models, onModelChange]
    );

    const initialEdges = React.useMemo(
        () => [
            {
                id: "e1",
                source: "userCode",
                target: "reviewer",
                type: "smoothstep",
                animated: true,
                style: {
                    stroke: edgeColors.amber,
                    strokeWidth: 4,
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: edgeColors.amber,
                },
            },
            {
                id: "e2",
                source: "reviewer",
                target: "implementation",
                type: "smoothstep",
                animated: true,
                style: {
                    stroke: edgeColors.blue,
                    strokeWidth: 4,
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: edgeColors.blue,
                },
            },
            {
                id: "e3",
                source: "implementation",
                target: "tester",
                type: "smoothstep",
                animated: true,
                style: {
                    stroke: edgeColors.green,
                    strokeWidth: 4,
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: edgeColors.green,
                },
            },
            {
                id: "e4",
                source: "tester",
                target: "report",
                type: "smoothstep",
                animated: true,
                style: {
                    stroke: edgeColors.orange,
                    strokeWidth: 4,
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: edgeColors.orange,
                },
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
                    const id = node.data.id;
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            model: agentModels[id],
                        },
                    };
                }
                return node;
            })
        );
    }, [agentModels, setNodes]);

    return (
        <div className="w-full">
            <div className="border rounded-lg bg-background shadow-sm flex flex-col">
                {/* Header with actions & zoom controls */}
                <div className="flex items-center justify-between px-4 py-3 border-b gap-3">
                    <div className="text-sm font-medium text-foreground">
                        AI Workflow Configuration
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Zoom controls */}
                        <div className="flex items-center gap-1 mr-3">
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={handleZoomOut}
                            >
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={handleZoomIn}
                            >
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                        </div>
                        {/* Save / Cancel */}
                        <Button type="button" onClick={onSave}>
                            Save Configuration
                        </Button>
                        <Button type="button" onClick={onCancel} variant="outline">
                            Cancel
                        </Button>
                    </div>
                </div>

                {/* Flow area */}
                <div className="h-[600px]">
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
                        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
                        nodesDraggable
                        nodesConnectable={false}
                        elementsSelectable
                        snapToGrid
                        snapGrid={[20, 20]}
                        onInit={(instance) => {
                            reactFlowInstanceRef.current = instance;
                        }}
                    >
                        {/* You still get the built-in controls if you want them too */}
                        <Controls className="!bg-card !border-border" />
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}
