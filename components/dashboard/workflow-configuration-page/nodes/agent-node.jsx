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
import { Input } from "@/components/ui/input";
import { RefreshCw, ChevronLeft, ChevronRight, X } from "lucide-react";

const MODELS_PER_PAGE = 5;

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
    const [modelPage, setModelPage] = React.useState(0);
    const [modelSearchTerm, setModelSearchTerm] = React.useState("");
    
    // Use parent's isRefreshingAll state or local isRefreshing state
    const showRefreshAnimation = data.isRefreshingAll || isRefreshing;

    // Filter and paginate models
    const filteredModels = (data.models || []).filter(model =>
        model.toLowerCase().includes(modelSearchTerm.toLowerCase())
    );
    const totalModelPages = Math.ceil(filteredModels.length / MODELS_PER_PAGE);
    const paginatedModels = filteredModels.slice(
        modelPage * MODELS_PER_PAGE,
        (modelPage + 1) * MODELS_PER_PAGE
    );

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Simulate refresh - in real implementation, this would refresh models for this agent
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1500);
    };

    return (
        <>
            {/* Input from Previous Agent (Left) - Not needed for Reviewer (first agent) */}
            {data.id !== "reviewer" && (
                <Handle type="target" position={Position.Left} id="flow-in" className="!bg-border !w-3 !h-3" />
            )}

            {/* Input from Knowledge Base (Left - Top position) - Only for Reviewer */}
            {data.id === "reviewer" && (
                <Handle
                    type="target"
                    position={Position.Left}
                    id="kb-in"
                    className="!bg-cyan-500 !w-3 !h-3"
                    style={{ top: '30%' }}
                    title="Knowledge Base Context"
                />
            )}

            {/* Input from User Code (Left - Bottom position) - Only for Reviewer */}
            {data.id === "reviewer" && (
                <Handle
                    type="target"
                    position={Position.Left}
                    id="flow-in"
                    className="!bg-border !w-3 !h-3"
                    style={{ top: '70%' }}
                    title="Code Input"
                />
            )}

            {/* Input from Prompt (Top - Center) */}
            <Handle
                type="target"
                position={Position.Top}
                id="prompt-in"
                className="!bg-indigo-500 !w-3 !h-3"
                style={{ left: '50%' }}
                title="Prompt Instructions"
            />

            <Card className={`w-full max-w-[200px] sm:max-w-[240px] shadow-lg border-2 ${borderColor}`}>
                <CardContent className="p-2 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className={`p-2 sm:p-3 rounded-lg ${data.iconBg}`}>
                            <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 font-semibold text-xs sm:text-base truncate">{data.label}</div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"
                            onClick={handleRefresh}
                            disabled={showRefreshAnimation}
                            title={`Refresh ${data.label.toLowerCase()} data`}
                        >
                            <RefreshCw className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${showRefreshAnimation ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                        {data.description}
                    </div>
                    <div className="mb-1 sm:mb-2">
                        <div className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-0.5 sm:mb-1">AI Model:</div>
                    </div>
                    <Select
                        value={data.model}
                        onValueChange={(value) => data.onModelChange(data.id, value)}
                    >
                        <SelectTrigger className="h-7 sm:h-8 text-[10px] sm:text-xs">
                            <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent
                            onPointerDownOutside={(e) => e.stopPropagation()}
                            onInteractOutside={(e) => e.stopPropagation()}
                        >
                            <div onWheelCapture={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                                <div className="p-2 border-b relative">
                                    <Input
                                        placeholder="Search models..."
                                        className="h-7 text-xs pr-7"
                                        value={modelSearchTerm}
                                        onChange={(e) => {
                                            setModelSearchTerm(e.target.value);
                                            setModelPage(0);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => e.stopPropagation()}
                                    />
                                    {modelSearchTerm && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setModelSearchTerm(""); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded-sm"
                                        >
                                            <X className="h-3 w-3 text-muted-foreground" />
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[180px]">
                                    {paginatedModels.length > 0 ? (
                                        paginatedModels.map((model, idx) => (
                                            <SelectItem key={`${data.id}-model-${modelPage}-${idx}`} value={model} className="text-xs">
                                                {model}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="py-2 px-3 text-xs text-muted-foreground text-center">No models found</div>
                                    )}
                                </div>
                                {totalModelPages > 1 && (
                                    <div className="flex items-center justify-between px-2 py-1.5 border-t">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => { e.stopPropagation(); setModelPage(p => Math.max(0, p - 1)); }}
                                            disabled={modelPage === 0}
                                        >
                                            <ChevronLeft className="h-3 w-3" />
                                        </Button>
                                        <span className="text-[10px] text-muted-foreground">
                                            {modelPage + 1} / {totalModelPages}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => { e.stopPropagation(); setModelPage(p => Math.min(totalModelPages - 1, p + 1)); }}
                                            disabled={modelPage >= totalModelPages - 1}
                                        >
                                            <ChevronRight className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Output to Next Agent (Right) - Not needed for Report agent (last in chain) */}
            {data.id !== "report" && (
                <Handle type="source" position={Position.Right} id="flow-out" className="!bg-border !w-3 !h-3" />
            )}
        </>
    );
}

