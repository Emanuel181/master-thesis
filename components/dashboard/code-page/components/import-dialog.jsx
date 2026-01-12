"use client"

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderOpen, RefreshCw } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// GitHub icon component
const GitHubIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
);

// GitLab icon component
const GitLabIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 380 380" fill="currentColor">
        <path d="M282.83,170.73l-.27-.69-26.14-68.22a6.81,6.81,0,0,0-2.69-3.24,7,7,0,0,0-8,.43,7,7,0,0,0-2.32,3.52l-17.65,54H154.29l-17.65-54A6.86,6.86,0,0,0,134.32,99a7,7,0,0,0-8-.43,6.87,6.87,0,0,0-2.69,3.24L97.44,170l-.26.69a48.54,48.54,0,0,0,16.1,56.1l.09.07.24.17,39.82,29.82,19.7,14.91,12,9.06a8.07,8.07,0,0,0,9.76,0l12-9.06,19.7-14.91,40.06-30,.1-.08A48.56,48.56,0,0,0,282.83,170.73Z" fill="#E24329"/>
        <path d="M282.83,170.73l-.27-.69a88.3,88.3,0,0,0-35.15,15.8L190,229.25c19.55,14.79,36.57,27.64,36.57,27.64l40.06-30,.1-.08A48.56,48.56,0,0,0,282.83,170.73Z" fill="#FC6D26"/>
        <path d="M153.43,256.89l19.7,14.91,12,9.06a8.07,8.07,0,0,0,9.76,0l12-9.06,19.7-14.91S209.55,244,190,229.25C170.45,244,153.43,256.89,153.43,256.89Z" fill="#FCA326"/>
        <path d="M132.58,185.84A88.19,88.19,0,0,0,97.44,170l-.26.69a48.54,48.54,0,0,0,16.1,56.1l.09.07.24.17,39.82,29.82s17-12.85,36.57-27.64Z" fill="#FC6D26"/>
    </svg>
);

/**
 * Import Dialog for switching projects from GitHub/GitLab
 */
export function ImportDialog({
    isOpen,
    onOpenChange,
    searchTerm,
    setSearchTerm,
    repos,
    gitlabRepos,
    isLoadingRepos,
    isGithubConnected,
    isGitlabConnected,
    onSelectRepo,
    onSelectGitlabRepo,
    onDisconnectGitHub,
    onDisconnectGitlab,
    onConnectGitHub,
    onConnectGitlab,
    onRefreshGitHubRepos,
    onRefreshGitLabRepos,
}) {
    const pathname = usePathname();
    const isDemoMode = pathname?.startsWith('/demo');
    
    // Filter mode: 'all', 'github', or 'gitlab' - default to 'all'
    const [filterMode, setFilterMode] = useState('all');

    // Handle connect - use demo handlers if in demo mode, otherwise signIn
    const handleConnectGitHub = () => {
        if (isDemoMode && onConnectGitHub) {
            onConnectGitHub();
        } else {
            signIn('github');
        }
    };

    const handleConnectGitLab = () => {
        if (isDemoMode && onConnectGitlab) {
            onConnectGitlab();
        } else {
            signIn('gitlab');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {/* Only show trigger when not controlled externally */}
            {onOpenChange === undefined && (
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <FolderOpen className="mr-2 h-4 w-4" /> Switch project
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Switch Project</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                    {/* Search with filter selector */}
                    {(isGithubConnected || isGitlabConnected) && (
                        <div className="space-y-2">
                            <Label>Search Projects</Label>
                            <div className="relative">
                                <Input 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    placeholder={filterMode === 'all' ? 'Search all projects...' : `Search ${filterMode === 'github' ? 'GitHub' : 'GitLab'} projects...`}
                                    className="pr-12"
                                />
                                {/* Filter selector inside search */}
                                {isGithubConnected && isGitlabConnected && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 hover:bg-accent text-xs gap-1"
                                            >
                                                {filterMode === 'all' ? (
                                                    <span className="text-muted-foreground">All</span>
                                                ) : filterMode === 'github' ? (
                                                    <GitHubIcon className="h-3.5 w-3.5" />
                                                ) : (
                                                    <GitLabIcon className="h-3.5 w-3.5" />
                                                )}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-36">
                                            <DropdownMenuItem 
                                                onClick={() => setFilterMode('all')}
                                                className="gap-2 text-xs"
                                            >
                                                All
                                                {filterMode === 'all' && (
                                                    <span className="ml-auto text-muted-foreground">✓</span>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => setFilterMode('github')}
                                                className="gap-2 text-xs"
                                            >
                                                <GitHubIcon className="h-3.5 w-3.5" />
                                                GitHub
                                                {filterMode === 'github' && (
                                                    <span className="ml-auto text-muted-foreground">✓</span>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => setFilterMode('gitlab')}
                                                className="gap-2 text-xs"
                                            >
                                                <GitLabIcon className="h-3.5 w-3.5" />
                                                GitLab
                                                {filterMode === 'gitlab' && (
                                                    <span className="ml-auto text-muted-foreground">✓</span>
                                                )}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Projects lists - side by side when both connected */}
                    {(isGithubConnected || isGitlabConnected) && (
                        <div className={`grid gap-4 ${isGithubConnected && isGitlabConnected && (filterMode === 'all') ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {/* GitHub Projects */}
                            {isGithubConnected && (filterMode === 'all' || filterMode === 'github') && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="flex items-center gap-2 text-xs">
                                            <GitHubIcon className="h-3.5 w-3.5" />
                                            GitHub
                                        </Label>
                                        {onRefreshGitHubRepos && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={onRefreshGitHubRepos}
                                                disabled={isLoadingRepos}
                                                className="h-6 px-2"
                                            >
                                                <RefreshCw className={`h-3 w-3 ${isLoadingRepos ? 'animate-spin' : ''}`} />
                                            </Button>
                                        )}
                                    </div>
                                    <ScrollArea className="h-48 border rounded-md">
                                        <div className="p-2">
                                            {isLoadingRepos ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                                    <span className="text-sm text-muted-foreground">Loading...</span>
                                                </div>
                                            ) : repos.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">No projects found</p>
                                            ) : (
                                                repos.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map(r => (
                                                    <div
                                                        key={r.id}
                                                        onClick={() => onSelectRepo(r)}
                                                        className="p-2 hover:bg-accent rounded-md cursor-pointer flex justify-between text-sm transition-colors"
                                                    >
                                                        <span className="font-medium truncate mr-2">{r.name}</span>
                                                        <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${r.private ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                            {r.private ? 'Private' : 'Public'}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}

                            {/* GitLab Projects */}
                            {isGitlabConnected && (filterMode === 'all' || filterMode === 'gitlab') && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="flex items-center gap-2 text-xs">
                                            <GitLabIcon className="h-3.5 w-3.5" />
                                            GitLab
                                        </Label>
                                        {onRefreshGitLabRepos && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={onRefreshGitLabRepos}
                                                disabled={isLoadingRepos}
                                                className="h-6 px-2"
                                            >
                                                <RefreshCw className={`h-3 w-3 ${isLoadingRepos ? 'animate-spin' : ''}`} />
                                            </Button>
                                        )}
                                    </div>
                                    <Label className="flex items-center gap-2 text-xs">
                                        <GitLabIcon className="h-3.5 w-3.5" />
                                        GitLab
                                    </Label>
                                    <ScrollArea className="h-48 border rounded-md">
                                        <div className="p-2">
                                            {isLoadingRepos ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                                    <span className="text-sm text-muted-foreground">Loading...</span>
                                                </div>
                                            ) : gitlabRepos.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">No projects found</p>
                                            ) : (
                                                gitlabRepos.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map(r => (
                                                    <div
                                                        key={r.id}
                                                        onClick={() => onSelectGitlabRepo(r)}
                                                        className="p-2 hover:bg-accent rounded-md cursor-pointer flex justify-between text-sm transition-colors"
                                                    >
                                                        <span className="font-medium truncate mr-2">{r.name}</span>
                                                        <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${r.visibility === 'private' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                            {r.visibility === 'private' ? 'Private' : 'Public'}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}
                        </div>
                    )}

                    {!isGithubConnected && !isGitlabConnected && (
                        <div className="flex flex-col gap-2 p-4 border rounded-md bg-muted/20">
                            <p className="text-sm text-muted-foreground text-center mb-2">Connect a provider to access your projects</p>
                            <Button onClick={handleConnectGitHub} variant="outline" className="w-full">
                                <GitHubIcon className="h-4 w-4 mr-2" />
                                Connect GitHub
                            </Button>
                            <Button onClick={handleConnectGitLab} variant="outline" className="w-full">
                                <GitLabIcon className="h-4 w-4 mr-2" />
                                Connect GitLab
                            </Button>
                        </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t">
                        {isGithubConnected && (
                            <Button variant="ghost" size="sm" onClick={onDisconnectGitHub} className="text-muted-foreground hover:text-destructive">
                                Disconnect GitHub
                            </Button>
                        )}
                        {isGitlabConnected && (
                            <Button variant="ghost" size="sm" onClick={onDisconnectGitlab} className="text-muted-foreground hover:text-destructive">
                                Disconnect GitLab
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

