"use client";

import React from "react";
import { Handle, Position } from "reactflow";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { MessageSquare, ChevronDown, RefreshCw } from "lucide-react";

/**
 * Prompt Node component for the workflow visualization
 */
export function PromptNode({ data }) {
    const [open, setOpen] = React.useState(false);
    const borderColorMap = {
        "bg-indigo-500": "border-indigo-500 dark:border-indigo-400",
    };
    const borderColor = borderColorMap[data.iconBg] || "border-indigo-500 dark:border-indigo-400";

    const selectedCount = data.selectedPrompts?.length || 0;
    const selectedTexts = data.prompts
        .filter(p => data.selectedPrompts?.includes(p.id))
        .map(p => (p.title || p.text).length > 30 ? (p.title || p.text).substring(0, 30) + "..." : (p.title || p.text))
        .join(", ");

    const [isRefreshing, setIsRefreshing] = React.useState(false);

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
                <Handle type="target" position={Position.Left} className="!bg-cyan-500 !w-3 !h-3" />
            )}

            <Card className={`w-[220px] sm:w-[280px] shadow-lg border-2 ${borderColor}`}>
                <CardContent className="p-2 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className={`p-2 sm:p-3 rounded-lg ${data.iconBg}`}>
                            <MessageSquare className="w-4 h-4 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs sm:text-base truncate">{data.label}</div>
                            <div className="text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                {selectedCount} selected
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            title={`Refresh ${data.agent} prompts`}
                        >
                            <RefreshCw className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
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
                        <PopoverContent className="w-[250px] sm:w-[320px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                            <div className="p-3 border-b">
                                <p className="text-sm font-medium">Select Prompts for {data.agent}</p>
                            </div>
                            <ScrollArea className="h-[300px]">
                                <div className="p-2">
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
                                </div>
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>
                </CardContent>
            </Card>

            {/* Output to Agent (Bottom) */}
            <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-3 !h-3" />
        </>
    );
}

