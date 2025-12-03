"use client"

import React from 'react';
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
} from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code, ScanSearch, Wrench, BugPlay, FileText } from "lucide-react";

// Custom Animated Edge Component
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

  const circleColor = style.stroke || '#3b82f6';
  const duration = data?.duration || '3s';

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {label && (
        <text>
          <textPath href={`#${id}`} startOffset="50%" textAnchor="middle" style={labelStyle}>
            {label}
          </textPath>
        </text>
      )}
      <circle r="8" fill={circleColor} opacity="0.8">
        <animateMotion dur={duration} repeatCount="indefinite" path={edgePath} />
      </circle>
      <circle r="8" fill={circleColor} opacity="0.6">
        <animateMotion dur={duration} repeatCount="indefinite" path={edgePath} begin="0.5s" />
      </circle>
      <circle r="8" fill={circleColor} opacity="0.4">
        <animateMotion dur={duration} repeatCount="indefinite" path={edgePath} begin="1s" />
      </circle>
    </>
  );
}

// Custom Node Component for AI Agents
function AgentNode({ data }) {
  const Icon = data.icon;
  const borderColorMap = {
    'bg-blue-500': 'border-blue-500 dark:border-blue-400',
    'bg-green-500': 'border-green-500 dark:border-green-400',
    'bg-orange-500': 'border-orange-500 dark:border-orange-400',
    'bg-purple-500': 'border-purple-500 dark:border-purple-400',
  };
  const borderColor = borderColorMap[data.iconBg] || 'border-gray-300 dark:border-gray-600';

  return (
    <>
      <Handle type="target" position={Position.Left} className="!bg-border" />
      <Card className={`min-w-[240px] shadow-lg border-2 ${borderColor}`}>
        <CardContent className="p-4" style={{ color: 'inherit' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-3 rounded-lg ${data.iconBg}`}>
              <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>{data.label}</div>
          </div>
          <div className="text-xs text-muted-foreground mb-3" style={{ color: 'var(--muted-foreground)' }}>{data.description}</div>
          <Select value={data.model} onValueChange={(value) => data.onModelChange(data.id, value)}>
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

// Custom Node Component for User Code
function UserCodeNode({ data }) {
  return (
    <>
      <Card className="min-w-[220px] shadow-lg border-2 border-amber-700 dark:border-amber-600">
        <CardContent className="p-4" style={{ color: 'inherit' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-amber-700 dark:bg-amber-600">
              <Code className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>{data.label}</div>
          </div>
          <div className="text-xs text-muted-foreground" style={{ color: 'var(--muted-foreground)' }}>{data.description}</div>
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

export function AIWorkflowVisualization({ models, agentModels, onModelChange }) {
  const initialNodes = [
    {
      id: 'userCode',
      type: 'userCodeNode',
      position: { x: 40, y: 160 },
      sourcePosition: 'right',
      data: {
        label: 'Your Code',
        description: 'Input code for review'
      },
    },
    {
      id: 'reviewer',
      type: 'agentNode',
      position: { x: 360, y: 120 },
      sourcePosition: 'right',
      targetPosition: 'left',
      data: {
        id: 'reviewer',
        label: 'Reviewer Agent',
        description: 'Analyzes and reviews code quality',
        icon: ScanSearch,
        iconBg: 'bg-blue-500',
        model: agentModels.reviewer,
        models: models,
        onModelChange: onModelChange,
      },
    },
    {
      id: 'implementation',
      type: 'agentNode',
      position: { x: 720, y: 160 },
      sourcePosition: 'right',
      targetPosition: 'left',
      data: {
        id: 'implementation',
        label: 'Implementation Agent',
        description: 'Implements code changes',
        icon: Wrench,
        iconBg: 'bg-green-500',
        model: agentModels.implementation,
        models: models,
        onModelChange: onModelChange,
      },
    },
    {
      id: 'tester',
      type: 'agentNode',
      position: { x: 1080, y: 200 },
      sourcePosition: 'right',
      targetPosition: 'left',
      data: {
        id: 'tester',
        label: 'Tester Agent',
        description: 'Tests code functionality',
        icon: BugPlay,
        iconBg: 'bg-orange-500',
        model: agentModels.tester,
        models: models,
        onModelChange: onModelChange,
      },
    },
    {
      id: 'report',
      type: 'agentNode',
      position: { x: 1440, y: 160 },
      targetPosition: 'left',
      data: {
        id: 'report',
        label: 'Report Agent',
        description: 'Generates final report',
        icon: FileText,
        iconBg: 'bg-purple-500',
        model: agentModels.report,
        models: models,
        onModelChange: onModelChange,
      },
    },
  ];

  // Detect dark mode
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const getEdgeColors = React.useCallback((isDark) => ({
    amber: isDark ? '#f59e0b' : '#b45309',
    blue: isDark ? '#60a5fa' : '#3b82f6',
    green: isDark ? '#4ade80' : '#22c55e',
    orange: isDark ? '#fb923c' : '#f97316',
  }), []);

  const edgeColors = getEdgeColors(isDarkMode);

  const initialEdges = React.useMemo(() => [
    {
      id: 'e1',
      source: 'userCode',
      target: 'reviewer',
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: edgeColors.amber,
        strokeWidth: 4
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColors.amber,
      },
    },
    {
      id: 'e2',
      source: 'reviewer',
      target: 'implementation',
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: edgeColors.blue,
        strokeWidth: 4
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColors.blue,
      },
    },
    {
      id: 'e3',
      source: 'implementation',
      target: 'tester',
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: edgeColors.green,
        strokeWidth: 4
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColors.green,
      },
    },
    {
      id: 'e4',
      source: 'tester',
      target: 'report',
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: edgeColors.orange,
        strokeWidth: 4
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColors.orange,
      },
    },
  ], [edgeColors]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update edges when dark mode changes
  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Update nodes when agentModels change
  React.useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === 'agentNode' && node.data.id) {
          return {
            ...node,
            data: {
              ...node.data,
              model: agentModels[node.data.id],
            },
          };
        }
        return node;
      })
    );
  }, [agentModels, setNodes]);

  return (
    <div className="w-full h-[500px] border rounded-lg overflow-hidden bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        snapToGrid={true}
        snapGrid={[20, 20]}
      >
        <Controls className="!bg-card !border-border" />
        {/* Removed dotted Background for solid color grid */}
      </ReactFlow>
    </div>
  );
}
