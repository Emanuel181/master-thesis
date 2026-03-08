"use client";

import React from "react";
import { Handle, Position } from "reactflow";
import { Card, CardContent } from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { MessageSquare, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

const PROMPTS_PER_PAGE = 4;

/**
 * Prompt Node component for the workflow visualization
 */
export function PromptNode({ data }) {
    const [open, setOpen] = React.useState(false);
    const [promptPage, setPromptPage] = React.useState(0);
    const [promptSearchTerm, setPromptSearchTerm] = React.useState("");
    const borderColorMap = {
        "bg-primary": "border-primary",
    };
    const borderColor = borderColorMap[data.iconBg] || "border-primary";

    const selectedCount = data.selectedPrompts?.length || 0;
    const isConfigured = selectedCount > 0;
    const selectedTexts = data.prompts
        .filter(p => data.selectedPrompts?.includes(p.id))
        .map(p => (p.title || p.text).length > 30 ? (p.title || p.text).substring(0, 30) + "..." : (p.title || p.text))
        .join(", ");

    const [isRefreshing, setIsRefreshing] = React.useState(false);
    
    // Use parent's isRefreshingAll state or local isRefreshing state
    const showRefreshAnimation = data.isRefreshingAll || isRefreshing;

    // Filter and paginate prompts
    const filteredPrompts = (data.prompts || []).filter(p =>
        (p.title || p.text || "").toLowerCase().includes(promptSearchTerm.toLowerCase())
    );
    const totalPromptPages = Math.ceil(filteredPrompts.length / PROMPTS_PER_PAGE);
    const paginatedPrompts = filteredPrompts.slice(
        promptPage * PROMPTS_PER_PAGE,
        (promptPage + 1) * PROMPTS_PER_PAGE
    );

    const handleToggle = (promptId) => {
        if (data.onPromptChange) {
            data.onPromptChange(data.agent, promptId);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Simulate refresh - in real implementation, this would refresh prompts for this agent
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1500);
    };

    // LOGIC CHANGE: No prompt nodes show KB input anymore
    // Reviewer, Implementation, Tester, and Report are all disconnected from KB.
    const showKbInput = !["reviewer", "implementation", "tester", "report"].includes(data.agent);

    return (
        <>
            {/* Input from KB (Left) - Conditionally Rendered */}
            {showKbInput && (
                <Handle type="target" position={Position.Left} className="!bg-primary !w-3 !h-3" />
            )}

            <Card className={`w-[220px] sm:w-[280px] shadow-lg border-2 transition-all duration-300 ${borderColor} ${
                isConfigured ? 'ring-2 ring-primary/20 shadow-md' : 'opacity-90'
            }`}>
                <CardContent className="p-2 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className={`p-2 sm:p-3 rounded-lg ${data.iconBg} relative`}>
                            <MessageSquare className="w-4 h-4 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
                            {isConfigured && (
                                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary border-2 border-background">
                                    <Check className="h-2 w-2 text-white" strokeWidth={3} />
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs sm:text-base truncate">{data.label}</div>
                            <div className={`text-[10px] sm:text-xs font-medium ${
                                isConfigured
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                            }`}>
                                {selectedCount} selected
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"
                            onClick={handleRefresh}
                            disabled={showRefreshAnimation}
                            title={`Refresh ${data.agent} prompts`}
                        >
                            <RefreshCw className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${showRefreshAnimation ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                        {data.description}
                    </div>

                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full h-auto justify-between text-left font-normal p-1.5 sm:p-2"
                            >
                                <div className="flex-1 min-w-0">
                                    {selectedCount > 0 ? (
                                        <span className="text-[10px] sm:text-xs truncate block">
                                            {selectedTexts}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                                            Select prompts
                                        </span>
                                    )}
                                </div>
                                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-[250px] sm:w-[320px] p-0"
                            align="start"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                            onPointerDownOutside={(e) => e.stopPropagation()}
                            onInteractOutside={(e) => e.stopPropagation()}
                        >
                            <div className="p-3 border-b">
                                <p className="text-sm font-medium">Select Prompts for {data.agent}</p>
                            </div>
                            <div
                                onWheelCapture={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                className="touch-pan-y"
                            >
                                <div className="p-2 border-b relative">
                                    <Input
                                        placeholder="Search prompts..."
                                        className="h-7 text-xs pr-7"
                                        value={promptSearchTerm}
                                        onChange={(e) => {
                                            setPromptSearchTerm(e.target.value);
                                            setPromptPage(0);
                                        }}
                                    />
                                    {promptSearchTerm && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setPromptSearchTerm(""); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded-sm"
                                        >
                                            <X className="h-3 w-3 text-muted-foreground" />
                                        </button>
                                    )}
                                </div>
                                <div className="p-2 max-h-[50vh] overflow-y-auto touch-pan-y">
                                    {paginatedPrompts.map((prompt) => {
                                        const isSelected = data.selectedPrompts?.includes(prompt.id);

                                        return (
                                            <div
                                                key={prompt.id}
                                                className={cn(
                                                    "flex items-start gap-3 rounded-md p-3 cursor-pointer transition-colors",
                                                    "hover:bg-accent",
                                                    isSelected && "bg-primary/5 dark:bg-primary/10"
                                                )}
                                                onClick={() => handleToggle(prompt.id)}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    className="mt-0.5 pointer-events-none"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium">
                                                        {prompt.title || "Untitled"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {prompt.text.length > 50 ? prompt.text.substring(0, 50) + "..." : prompt.text}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {paginatedPrompts.length === 0 && (
                                        <div className="py-4 px-3 text-xs text-muted-foreground text-center">No prompts found</div>
                                    )}
                                </div>
                                {totalPromptPages > 1 && (
                                    <div className="flex items-center justify-between px-3 py-2 border-t">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => setPromptPage(p => Math.max(0, p - 1))}
                                            disabled={promptPage === 0}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-xs text-muted-foreground">
                                            {promptPage + 1} / {totalPromptPages}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => setPromptPage(p => Math.min(totalPromptPages - 1, p + 1))}
                                            disabled={promptPage >= totalPromptPages - 1}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                    {isConfigured ? (
                        <div className="mt-1.5 flex items-center gap-1 text-[9px] sm:text-[10px] text-primary">
                            <Check className="h-2.5 w-2.5" />
                            <span className="truncate">{selectedTexts}</span>
                        </div>
                    ) : (
                        <div className="mt-1.5 text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-400 animate-pulse">
                            Select prompts to configure
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Output to Agent (Bottom) */}
            <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
        </>
    );
}

