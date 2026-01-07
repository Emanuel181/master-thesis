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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { Database, ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";

const KB_PER_PAGE = 4;
const USE_CASES_PER_PAGE = 5;

/**
 * Knowledge Base Node component for the workflow visualization
 */
export function KnowledgeBaseNode({ data }) {
    const [open, setOpen] = React.useState(false);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [kbPage, setKbPage] = React.useState(0);
    const [useCasePage, setUseCasePage] = React.useState(0);
    const [kbSearchTerm, setKbSearchTerm] = React.useState("");
    const [useCaseSearchTerm, setUseCaseSearchTerm] = React.useState("");
    
    // Use parent's isRefreshingAll state or local isRefreshing state
    const showRefreshAnimation = data.isRefreshingAll || isRefreshing;
    
    const borderColorMap = {
        "bg-cyan-500": "border-cyan-500 dark:border-cyan-400",
    };
    const borderColor = borderColorMap[data.iconBg] || "border-cyan-500 dark:border-cyan-400";

    const selectedCount = data.selectedKnowledgeBases?.length || 0;
    const selectedNames = data.knowledgeBases
        .filter(kb => data.selectedKnowledgeBases?.includes(kb.id))
        .map(kb => kb.name)
        .join(", ");

    // Filter and paginate knowledge bases
    const filteredKbs = (data.knowledgeBases || []).filter(kb =>
        kb.name.toLowerCase().includes(kbSearchTerm.toLowerCase())
    );
    const totalKbPages = Math.ceil(filteredKbs.length / KB_PER_PAGE);
    const paginatedKbs = filteredKbs.slice(
        kbPage * KB_PER_PAGE,
        (kbPage + 1) * KB_PER_PAGE
    );

    // Filter and paginate use cases (code type dropdown)
    const filteredUseCases = (data.useCases || []).filter(uc =>
        uc.title.toLowerCase().includes(useCaseSearchTerm.toLowerCase())
    );
    const totalUseCasePages = Math.ceil(filteredUseCases.length / USE_CASES_PER_PAGE);
    const paginatedUseCases = filteredUseCases.slice(
        useCasePage * USE_CASES_PER_PAGE,
        (useCasePage + 1) * USE_CASES_PER_PAGE
    );

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
                            <div className="text-[10px] sm:text-xs font-medium text-muted-foreground">Code type:</div>
                        </div>
                        <Select
                            value={data.codeType || ""}
                            onValueChange={handleCodeTypeChange}
                        >
                            <SelectTrigger className="h-7 sm:h-8 text-[10px] sm:text-xs">
                                <SelectValue placeholder="Select code type" />
                            </SelectTrigger>
                            <SelectContent>
                                <div onWheelCapture={(e) => e.stopPropagation()}>
                                    <div className="p-2 border-b">
                                        <Input
                                            placeholder="Search code types..."
                                            className="h-7 text-xs"
                                            value={useCaseSearchTerm}
                                            onChange={(e) => {
                                                setUseCaseSearchTerm(e.target.value);
                                                setUseCasePage(0);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            onKeyDown={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    <div className="max-h-[160px]">
                                        {paginatedUseCases.length > 0 ? (
                                            paginatedUseCases.map((uc) => (
                                                <SelectItem key={uc.id} value={uc.id} className="text-xs">
                                                    {uc.title}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="py-2 px-3 text-xs text-muted-foreground text-center">No code types found</div>
                                        )}
                                    </div>
                                    {totalUseCasePages > 1 && (
                                        <div className="flex items-center justify-between px-2 py-1.5 border-t">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => { e.stopPropagation(); setUseCasePage(p => Math.max(0, p - 1)); }}
                                                disabled={useCasePage === 0}
                                            >
                                                <ChevronLeft className="h-3 w-3" />
                                            </Button>
                                            <span className="text-[10px] text-muted-foreground">
                                                {useCasePage + 1} / {totalUseCasePages}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => { e.stopPropagation(); setUseCasePage(p => Math.min(totalUseCasePages - 1, p + 1)); }}
                                                disabled={useCasePage >= totalUseCasePages - 1}
                                            >
                                                <ChevronRight className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                        <div className="flex-1">
                            <div className="text-[10px] sm:text-xs font-medium text-muted-foreground">Knowledge bases:</div>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-5 w-5 sm:h-6 sm:w-6"
                            onClick={handleRefresh}
                            disabled={showRefreshAnimation}
                        >
                            <RefreshCw className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${showRefreshAnimation ? 'animate-spin' : ''}`} />
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
                                <p className="text-sm font-medium">Select knowledge bases</p>
                            </div>
                            <div onWheelCapture={(e) => e.stopPropagation()}>
                                <div className="p-2 border-b">
                                    <Input
                                        placeholder="Search knowledge bases..."
                                        className="h-7 text-xs"
                                        value={kbSearchTerm}
                                        onChange={(e) => {
                                            setKbSearchTerm(e.target.value);
                                            setKbPage(0);
                                        }}
                                    />
                                </div>
                                <div className="p-2">
                                    {paginatedKbs.map((kb) => {
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
                                    {paginatedKbs.length === 0 && (
                                        <div className="py-4 px-3 text-xs text-muted-foreground text-center">No knowledge bases found</div>
                                    )}
                                </div>
                                {totalKbPages > 1 && (
                                    <div className="flex items-center justify-between px-3 py-2 border-t">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => setKbPage(p => Math.max(0, p - 1))}
                                            disabled={kbPage === 0}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-xs text-muted-foreground">
                                            {kbPage + 1} / {totalKbPages}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => setKbPage(p => Math.min(totalKbPages - 1, p + 1))}
                                            disabled={kbPage >= totalKbPages - 1}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
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

