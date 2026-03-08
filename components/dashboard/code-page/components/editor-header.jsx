"use client"

import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Play,
    Clipboard,
    Wand2,
    Check,
    MoreVertical,
    ChevronDown,
    FolderPlus,
    FolderX,
    FolderInput,
    GitBranch,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { ImportDialog } from './import-dialog';

/**
 * Editor Header component with actions and configuration
 */
export function EditorHeader({
    isPlaceholder,
    hasContent,
    isViewOnly,
    codeType,
    isFormatting,
    handleFormat,
    isFormattable,
    isCopied,
    handleCopy,
    hasCode,
    onStart,
    activeTab,
    code,
    // Tab group props
    onCreateGroup,
    hasOpenTabs = false,
    // Project controls (consolidated from top toolbar)
    hasImportedProject = false,
    currentRepo = null,
    viewMode = 'file',
    setViewMode,
    onUnloadProject,
    // Import dialog props
    isGithubConnected = false,
    isGitlabConnected = false,
    isImportDialogOpen = false,
    setIsImportDialogOpen,
    searchTerm = '',
    setSearchTerm,
    repos = [],
    gitlabRepos = [],
    isLoadingRepos = false,
    onSelectRepo,
    onSelectGitlabRepo,
    onDisconnectGitHub,
    onDisconnectGitlab,
    onConnectGitHub,
    onConnectGitlab,
    onRefreshGitHubRepos,
    onRefreshGitLabRepos,
    isDemoMode = false,
}) {
    return (
        <CardHeader className="py-2 px-2 sm:py-2.5 sm:px-4 shrink-0 border-b bg-card/50">
            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-between gap-3">
                {/* Left Section: Title + Project Controls */}
                <div className="flex items-center gap-3 min-w-0">
                    <CardTitle className="text-base font-semibold shrink-0">Code Editor</CardTitle>
                    
                    {/* Project Controls - only when project imported */}
                    {hasImportedProject && (
                        <div className="flex items-center gap-2 pl-2 border-l border-border/60">
                            {/* View Mode Toggle - compact */}
                            <div className="flex items-center gap-1 bg-muted/40 rounded px-1.5 py-0.5">
                                <span 
                                    onClick={() => setViewMode('project')}
                                    className={`text-[10px] cursor-pointer transition-colors px-1 py-0.5 rounded ${viewMode === 'project' ? 'text-foreground font-medium bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Project
                                </span>
                                <span 
                                    onClick={() => setViewMode('file')}
                                    className={`text-[10px] cursor-pointer transition-colors px-1 py-0.5 rounded ${viewMode === 'file' ? 'text-foreground font-medium bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    File
                                </span>
                            </div>

                            {/* Project Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 gap-1.5 text-xs"
                                    >
                                        <GitBranch className="h-3.5 w-3.5" />
                                        <span className="max-w-[120px] truncate">{typeof currentRepo === 'string' ? currentRepo : currentRepo?.repo || 'Project'}</span>
                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48">
                                    <DropdownMenuLabel className="text-xs">Project</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {(isGithubConnected || isGitlabConnected) && (
                                        <DropdownMenuItem
                                            onClick={() => setIsImportDialogOpen(true)}
                                            className="text-xs gap-2"
                                        >
                                            <FolderInput className="h-3.5 w-3.5" />
                                            Switch Project
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                        onClick={onUnloadProject}
                                        className="text-xs gap-2 text-destructive focus:text-destructive"
                                    >
                                        <FolderX className="h-3.5 w-3.5" />
                                        Unload Project
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}

                    {!isPlaceholder && hasContent && isViewOnly && (
                        <span className="text-[10px] text-muted-foreground bg-muted/80 px-2 py-1 rounded-md font-medium">
                            View Only
                        </span>
                    )}
                </div>

                {/* Right Section: Actions */}
                {!isPlaceholder && hasContent && (
                    <div className="flex items-center gap-1.5">
                        {/* Create Tab Group Button */}
                        {hasOpenTabs && onCreateGroup && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={onCreateGroup}
                                        >
                                            <FolderPlus className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Create Tab Group</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}

                        {/* Format Button - Now labeled and prominent */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2.5 gap-1.5"
                                        onClick={handleFormat}
                                        disabled={isFormatting || !isFormattable}
                                    >
                                        <Wand2 className="h-3.5 w-3.5" />
                                        <span className="text-xs font-medium">Format</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {!isFormattable ? "Formatting not supported for this language" : "Format Code (Prettier, Ruff, etc.)"}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={handleCopy}
                                        disabled={isCopied}
                                    >
                                        {isCopied ? (
                                            <Check className="h-3.5 w-3.5 text-success" />
                                        ) : (
                                            <Clipboard className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{isCopied ? "Copied!" : "Copy Code"}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* Start Review */}
                        {!isViewOnly && (
                            isDemoMode ? (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span tabIndex={0}>
                                                <Button
                                                    size="sm"
                                                    className="h-7 px-3 ml-1 gap-1.5"
                                                    disabled
                                                >
                                                    <Play className="h-3.5 w-3.5" />
                                                    <span className="text-xs font-medium">Review</span>
                                                </Button>
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Review is disabled in demo mode. Sign up to run AI-powered reviews.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <Button
                                    size="sm"
                                    className="h-7 px-3 ml-1 gap-1.5"
                                    onClick={() => onStart?.(activeTab ? activeTab.content : code, codeType)}
                                    disabled={!hasCode || !onStart}
                                >
                                    <Play className="h-3.5 w-3.5" />
                                    <span className="text-xs font-medium">Review</span>
                                </Button>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Mobile Layout */}
            <div className="flex sm:hidden items-center justify-between gap-2">
                {/* Left: Title + Project indicator */}
                <div className="flex items-center gap-2 min-w-0">
                    <CardTitle className="text-sm whitespace-nowrap">Editor</CardTitle>
                    {hasImportedProject && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 px-1.5 gap-1 text-xs text-muted-foreground">
                                    <GitBranch className="h-3 w-3" />
                                    <ChevronDown className="h-2.5 w-2.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-52">
                                <DropdownMenuLabel className="text-xs truncate">{typeof currentRepo === 'string' ? currentRepo : currentRepo?.repo || 'Project'}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <div className="px-2 py-1.5">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="view-mode-mobile" className="text-xs">Project</Label>
                                        <Switch
                                            id="view-mode-mobile"
                                            checked={viewMode === 'file'}
                                            onCheckedChange={(checked) => setViewMode(checked ? 'file' : 'project')}
                                            className="h-4 w-7"
                                        />
                                        <Label htmlFor="view-mode-mobile" className="text-xs">File</Label>
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                {viewMode === 'project' && (isGithubConnected || isGitlabConnected) && (
                                    <DropdownMenuItem
                                        onClick={() => setIsImportDialogOpen(true)}
                                        className="text-xs gap-2"
                                    >
                                        <FolderInput className="h-3.5 w-3.5" />
                                        Import Another
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    onClick={onUnloadProject}
                                    className="text-xs gap-2 text-destructive focus:text-destructive"
                                >
                                    <FolderX className="h-3.5 w-3.5" />
                                    Unload Project
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    {!isPlaceholder && hasContent && isViewOnly && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                            View Only
                        </span>
                    )}
                </div>

                {/* Right: Actions */}
                {!isPlaceholder && hasContent && (
                    <div className="flex items-center gap-1">
                        {/* Start Review button */}
                        {!isViewOnly && (
                            isDemoMode ? (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span tabIndex={0}>
                                                <Button
                                                    size="sm"
                                                    className="h-7 px-2"
                                                    disabled
                                                >
                                                    <Play className="h-3.5 w-3.5" />
                                                </Button>
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Review is disabled in demo mode.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <Button
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() => onStart?.(activeTab ? activeTab.content : code, codeType)}
                                    disabled={!hasCode || !onStart}
                                >
                                    <Play className="h-3.5 w-3.5" />
                                </Button>
                            )
                        )}

                        {/* More options menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                {/* Actions */}
                                <DropdownMenuItem
                                    onClick={handleFormat}
                                    disabled={isFormatting || !isFormattable}
                                    className="text-xs"
                                >
                                    <Wand2 className="h-3.5 w-3.5 mr-2" />
                                    Format Code
                                    {!isFormattable && <span className="ml-auto text-[10px] text-muted-foreground">N/A</span>}
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={handleCopy}
                                    disabled={isCopied}
                                    className="text-xs"
                                >
                                    {isCopied ? (
                                        <Check className="h-3.5 w-3.5 mr-2 text-success" />
                                    ) : (
                                        <Clipboard className="h-3.5 w-3.5 mr-2" />
                                    )}
                                    {isCopied ? "Copied!" : "Copy Code"}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            {/* Import Dialog - controlled externally, no trigger button */}
            {isImportDialogOpen !== undefined && setIsImportDialogOpen && (
                <ImportDialog
                    isOpen={isImportDialogOpen}
                    onOpenChange={setIsImportDialogOpen}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    repos={repos}
                    gitlabRepos={gitlabRepos}
                    isLoadingRepos={isLoadingRepos}
                    isGithubConnected={isGithubConnected}
                    isGitlabConnected={isGitlabConnected}
                    onSelectRepo={onSelectRepo}
                    onSelectGitlabRepo={onSelectGitlabRepo}
                    onDisconnectGitHub={onDisconnectGitHub}
                    onDisconnectGitlab={onDisconnectGitlab}
                    onConnectGitHub={onConnectGitHub}
                    onConnectGitlab={onConnectGitlab}
                    onRefreshGitHubRepos={onRefreshGitHubRepos}
                    onRefreshGitLabRepos={onRefreshGitLabRepos}
                />
            )}
        </CardHeader>
    );
}
