"use client"

import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Play, Clipboard, Wand2, RefreshCw, Lock, Unlock, Check, FileCode2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

/**
 * Editor Header component with actions and configuration
 */
export function EditorHeader({
    isPlaceholder,
    hasContent,
    isLocked,
    onLockChange,
    isViewOnly,
    displayLanguage,
    displayLanguages,
    language,
    setLanguage,
    setDetectedLanguage,
    setIsLanguageSupported,
    codeType,
    setCodeType,
    codeTypes,
    isRefreshing,
    refreshUseCases,
    setIsRefreshing,
    isFormatting,
    handleFormat,
    isFormattable,
    isCopied,
    handleCopy,
    hasCode,
    isReviewable,
    onStart,
    activeTab,
    code,
}) {
    return (
        <CardHeader className="pt-4 pb-4 px-6 shrink-0 border-b bg-card">
            <div className="flex items-center justify-between gap-4">
                {/* Left: Title and Lock Control */}
                <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">Code Editor</CardTitle>
                    {!isPlaceholder && hasContent && !isViewOnly && (
                        <Button
                            variant={isLocked ? "default" : "outline"}
                            size="sm"
                            onClick={() => onLockChange(!isLocked)}
                            className={isLocked ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                        >
                            {isLocked ? <Lock className="h-3.5 w-3.5 mr-2" /> : <Unlock className="h-3.5 w-3.5 mr-2" />}
                            {isLocked ? "Locked" : "Lock Code"}
                        </Button>
                    )}
                    {!isPlaceholder && hasContent && isViewOnly && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            View Only
                        </span>
                    )}
                </div>

                {/* Middle: Language & Config */}
                {!isPlaceholder && hasContent && (
                    <div className="flex items-center gap-6">
                        {/* Language Selector */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground">Language</span>
                            <div className="flex flex-col">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" disabled={isLocked} className="flex gap-2 min-w-[140px] justify-between relative">
                                            <div className="flex flex-col items-start">
                                                <div className="flex items-center gap-2">
                                                    <FileCode2 className="h-3.5 w-3.5 opacity-70" />
                                                    <span className="truncate max-w-[80px]">{displayLanguage}</span>
                                                </div>
                                            </div>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {displayLanguages.map((lang) => (
                                            <DropdownMenuItem key={lang.name} onClick={() => {
                                                setLanguage(lang);
                                                setDetectedLanguage(lang.prism);
                                                setIsLanguageSupported(true);
                                            }}>
                                                {lang.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div className="h-6 w-px bg-border"></div>

                        {/* Use Case - only show for reviewable files */}
                        {!isViewOnly && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-muted-foreground">Use Case</span>
                                <div className="flex items-center gap-2">
                                    <Select value={codeType} onValueChange={setCodeType} disabled={isLocked}>
                                        <SelectTrigger className="w-[180px] h-9">
                                            <SelectValue placeholder="Select type..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {codeTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={async () => {
                                            setIsRefreshing(true);
                                            try { await refreshUseCases(); }
                                            finally { setIsRefreshing(false); }
                                        }}
                                        disabled={isRefreshing}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Right: Actions */}
                {!isPlaceholder && hasContent && (
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleFormat}
                                            disabled={isFormatting || (!isViewOnly && isLocked) || !isFormattable}
                                        >
                                            <Wand2 className="mr-2 h-4 w-4" /> Format
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {!isFormattable ? "Formatting is not supported for this programming language" : "Format Code"}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                            disabled={isCopied}
                            className="transition-all duration-200"
                        >
                            {isCopied ? (
                                <Check className="mr-2 h-4 w-4 text-green-500 animate-in zoom-in duration-300" />
                            ) : (
                                <Clipboard className="mr-2 h-4 w-4" />
                            )}
                            {isCopied ? "Copied" : "Copy"}
                        </Button>
                        {/* Start Review - only show for reviewable files */}
                        {!isViewOnly && (
                            <Button
                                size="sm"
                                onClick={() => onStart(activeTab ? activeTab.content : code, language, codeType)}
                                disabled={!hasCode || !isLocked || !isReviewable}
                                className={(!isLocked || !isReviewable) ? "opacity-70" : ""}
                                title={!isLocked ? "Lock code to start review" : (!isReviewable ? "Language not supported for review" : "Start Review")}
                            >
                                <Play className="mr-2 h-4 w-4" /> Start Review
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </CardHeader>
    );
}

