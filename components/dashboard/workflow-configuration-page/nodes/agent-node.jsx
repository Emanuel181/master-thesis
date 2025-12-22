"use client";

import React from "react";
import { Handle, Position } from "reactflow";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

/**
 * Agent Node component for the workflow visualization
 */
export function AgentNode({ data }) {
    const Icon = data.icon;
    const borderColorMap = {
        "bg-blue-500": "border-blue-500 dark:border-blue-400",
        "bg-green-500": "border-green-500 dark:border-green-400",
        "bg-orange-500": "border-orange-500 dark:border-orange-400",
        "bg-purple-500": "border-purple-500 dark:border-purple-400",
    };
    const borderColor =
        borderColorMap[data.iconBg] || "border-gray-300 dark:border-gray-600";

    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Simulate refresh - in real implementation, this would refresh models for this agent
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1500);
    };

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
                        <div className="flex-1 font-semibold text-base">{data.label}</div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            title={`Refresh ${data.label.toLowerCase()} data`}
                        >
                            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
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

