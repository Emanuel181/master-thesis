"use client";

import React from "react";
import { Handle, Position } from "reactflow";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { Database, ChevronDown, RefreshCw } from "lucide-react";

/**
 * Knowledge Base Node component for the workflow visualization
 */
export function KnowledgeBaseNode({ data }) {
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
            <Card className={`w-[220px] sm:w-[280px] shadow-lg border-2 ${borderColor}`}>
                <CardContent className="p-2 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className={`p-2 sm:p-3 rounded-lg ${data.iconBg}`}>
                            <Database className="w-4 h-4 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs sm:text-base truncate">{data.label}</div>
                            <div className="text-[10px] sm:text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                                {selectedCount} selected
                            </div>
                        </div>
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                        {data.description}
                    </div>

                    <div className="mb-2 sm:mb-3">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                            <div className="text-[10px] sm:text-xs font-medium text-muted-foreground">Code Type:</div>
                        </div>
                        <Select
                            value={data.codeType || ""}
                            onValueChange={handleCodeTypeChange}
                        >
                            <SelectTrigger className="h-7 sm:h-8 text-[10px] sm:text-xs">
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

                    <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                        <div className="flex-1">
                            <div className="text-[10px] sm:text-xs font-medium text-muted-foreground">Knowledge Bases:</div>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-5 w-5 sm:h-6 sm:w-6"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full h-auto justify-between text-left font-normal p-1.5 sm:p-2"
                                disabled={isKnowledgeBaseDisabled}
                            >
                                <div className="flex-1 min-w-0">
                                    {selectedCount > 0 ? (
                                        <span className="text-[10px] sm:text-xs truncate block">
                                            {selectedNames}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                                            Select knowledge bases
                                        </span>
                                    )}
                                </div>
                                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[220px] sm:w-[280px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                            <div className="p-3 border-b">
                                <p className="text-sm font-medium">Select Knowledge Bases</p>
                            </div>
                            <div onWheelCapture={(e) => e.stopPropagation()}>
                                <ScrollArea className="h-[300px]">
                                    <div className="p-2">
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
                                </ScrollArea>
                            </div>
                        </PopoverContent>
                    </Popover>
                </CardContent>
            </Card>
            {/* Output to Reviewer Agent (Bottom) */}
            <Handle type="source" position={Position.Bottom} className="!bg-cyan-500 !w-3 !h-3" />
        </>
    );
}

