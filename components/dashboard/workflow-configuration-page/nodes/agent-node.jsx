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
import { RefreshCw, ChevronLeft, ChevronRight, X, Check } from "lucide-react";

const MODELS_PER_PAGE = 5;

/**
 * Agent Node component for the workflow visualization
 */
export function AgentNode({ data }) {
    const Icon = data.icon;
    const isConfigured = !!data.model;
    const borderColorMap = {
        "bg-agent-reviewer": "border-agent-reviewer/30",
        "bg-agent-implementation": "border-agent-implementation/30",
        "bg-agent-tester": "border-agent-tester/30",
        "bg-agent-report": "border-agent-report/30",
    };
    const configuredRingMap = {
        "bg-agent-reviewer": "ring-agent-reviewer/25",
        "bg-agent-implementation": "ring-agent-implementation/25",
        "bg-agent-tester": "ring-agent-tester/25",
        "bg-agent-report": "ring-agent-report/25",
    };
    const borderColor =
        borderColorMap[data.iconBg] || "border-border";

    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [modelPage, setModelPage] = React.useState(0);
    const [modelSearchTerm, setModelSearchTerm] = React.useState("");
    
    // Use parent's isRefreshingAll state or local isRefreshing state
    const showRefreshAnimation = data.isRefreshingAll || isRefreshing;

    // Filter and paginate models
    const filteredModels = (data.models || []).filter(model => {
        if (model === null || model === undefined) return false;
        const searchLower = (modelSearchTerm || '').toLowerCase();
        if (!searchLower) return true; // No search term, include all
        if (typeof model === 'string') {
            return model.toLowerCase().includes(searchLower);
        }
        if (typeof model === 'object' && model !== null) {
            const name = typeof model.name === 'string' ? model.name : '';
            const id = typeof model.id === 'string' ? model.id : '';
            const provider = typeof model.provider === 'string' ? model.provider : '';
            return name.toLowerCase().includes(searchLower) ||
                   id.toLowerCase().includes(searchLower) ||
                   provider.toLowerCase().includes(searchLower);
        }
        return false;
    });
    const totalModelPages = Math.ceil(filteredModels.length / MODELS_PER_PAGE);
    const paginatedModels = filteredModels.slice(
        modelPage * MODELS_PER_PAGE,
        (modelPage + 1) * MODELS_PER_PAGE
    );

    // Helper to get model display name
    const getModelDisplayName = (modelId) => {
        if (!modelId) return null;
        const model = (data.models || []).find(m => (typeof m === 'string' ? m : m.id) === modelId);
        if (!model) return modelId;
        return typeof model === 'string' ? model : model.name;
    };

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
                    title="Knowledge base context"
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
                className="!bg-primary !w-3 !h-3"
                style={{ left: '50%' }}
                title="Prompt Instructions"
            />

            <Card className={`w-full max-w-[200px] sm:max-w-[240px] shadow-lg border-2 transition-all duration-300 ${borderColor} ${
                isConfigured ? `ring-2 ${configuredRingMap[data.iconBg] || 'ring-emerald-500/20'} shadow-md` : 'opacity-90'
            }`}>
                <CardContent className="p-2 sm:p-4">
                    <div className="flex items-center gap-1 mb-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/50 bg-muted px-1.5 py-0.5 rounded-sm">Agent</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className={`p-2 sm:p-3 rounded-lg ${data.iconBg} relative`}>
                            <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
                            {isConfigured && (
                                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 border-2 border-background">
                                    <Check className="h-2 w-2 text-white" strokeWidth={3} />
                                </span>
                            )}
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
                        <SelectTrigger className="h-7 sm:h-8 text-[10px] sm:text-xs" onClick={(e) => e.stopPropagation()}>
                            <SelectValue placeholder="Select model">
                                {data.model && getModelDisplayName(data.model)}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent
                            className="z-[9999]"
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
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-sm"
                                        >
                                            <X className="h-3 w-3 text-muted-foreground" />
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[180px]">
                                    {paginatedModels.length > 0 ? (
                                        paginatedModels.map((model, idx) => {
                                            const modelId = typeof model === 'string' ? model : model.id;
                                            const modelName = typeof model === 'string' ? model : model.name;
                                            const modelDesc = typeof model === 'object' ? model.description : null;
                                            return (
                                                <SelectItem key={`${data.id}-model-${modelPage}-${idx}`} value={modelId} className="text-xs">
                                                    <div className="flex flex-col">
                                                        <span>{modelName}</span>
                                                        {modelDesc && (
                                                            <span className="text-[9px] text-muted-foreground truncate max-w-[180px]">{modelDesc}</span>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            );
                                        })
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
                    {isConfigured ? (
                        <div className="mt-1.5 flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400">
                            <Check className="h-2.5 w-2.5" />
                            <span className="truncate">Model configured</span>
                        </div>
                    ) : (
                        <div className="mt-1.5 text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-400 animate-pulse">
                            Select a model to configure
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Output to Next Agent (Right) - Not needed for Report agent (last in chain) */}
            {data.id !== "report" && (
                <Handle type="source" position={Position.Right} id="flow-out" className="!bg-border !w-3 !h-3" />
            )}
        </>
    );
}

