"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RefreshCw, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { GitlabIcon } from "@/components/icons/gitlab"
import { RepoCard } from "./repo-card"

/**
 * GitLab repository panel component.
 * Displays connected status, search, repository list, and pagination.
 */
export function GitLabRepoPanel({
    repos,
    isLoading,
    isConnected,
    isRefreshing,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    paginatedRepos,
    totalPages,
    totalCount,
    status,
    isDemoMode,
    connect,
    disconnect,
    refresh,
    importingRepo,
    onImportRepo,
    className,
}) {
    return (
        <Card className={`flex flex-col overflow-hidden transition-shadow hover:shadow-md min-h-[420px] ${className || ''}`}>
            <CardHeader className="py-2 px-2.5 sm:py-3 sm:px-4 flex-shrink-0">
                {isConnected && (
                    <div className="flex items-center gap-1 mb-1">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] sm:text-xs text-green-600">Connected</span>
                    </div>
                )}
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base">
                        <GitlabIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">GitLab repositories</span>
                    </CardTitle>
                    {isConnected && (
                        <div className="flex gap-1 flex-shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                                onClick={refresh}
                                disabled={isRefreshing}
                                title="Refresh repositories"
                            >
                                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs"
                                onClick={disconnect}
                                title="Disconnect from GitLab"
                            >
                                <span className="hidden xs:inline">Disconnect</span>
                                <span className="xs:hidden">×</span>
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 overflow-hidden pt-2 pb-6 px-2.5 sm:px-4">
                {status === "loading" && !isDemoMode ? (
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Loading...</p>
                ) : !isConnected ? (
                    <ConnectPrompt onConnect={connect} />
                ) : (
                    <RepoList
                        repos={repos}
                        isLoading={isLoading}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        paginatedRepos={paginatedRepos}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        totalPages={totalPages}
                        totalCount={totalCount}
                        importingRepo={importingRepo}
                        onImportRepo={onImportRepo}
                    />
                )}
            </CardContent>
        </Card>
    )
}

/**
 * Connect prompt shown when not connected
 */
function ConnectPrompt({ onConnect }) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-3 sm:p-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-muted/30 flex items-center justify-center mb-3 sm:mb-4 border border-border/50">
                <GitlabIcon className="h-5 w-5 sm:h-7 sm:w-7 text-muted-foreground/60" />
            </div>
            <h3 className="text-sm font-medium mb-1">Connect GitLab</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">
                Import your repositories for security analysis
            </p>
            <Button onClick={onConnect} className="gap-2">
                <GitlabIcon className="h-4 w-4" />
                Connect GitLab
            </Button>
        </div>
    )
}

/**
 * Repository list with search and pagination
 */
function RepoList({
    repos,
    isLoading,
    searchTerm,
    setSearchTerm,
    paginatedRepos,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCount,
    importingRepo,
    onImportRepo,
}) {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between gap-2 p-2 border rounded-lg animate-pulse">
                        <div className="flex-1 min-w-0 space-y-2">
                            <div className="h-3 bg-muted rounded w-3/4"></div>
                            <div className="h-2 bg-muted/60 rounded w-1/2"></div>
                        </div>
                        <div className="h-7 w-14 bg-muted rounded"></div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Search input */}
            <div className="relative mb-2 flex-shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <Input
                    placeholder="Search repositories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 pl-8 text-xs"
                />
            </div>

            {repos.length === 0 ? (
                <EmptyState message="No repositories found in your GitLab account" />
            ) : totalCount === 0 ? (
                <EmptyState 
                    icon={Search} 
                    title="No Results"
                    message={`No repositories match "${searchTerm}"`} 
                />
            ) : (
                <div className="flex flex-col flex-1 min-h-0">
                    <div className="space-y-1.5 flex-1">
                        {paginatedRepos.map((repo) => {
                            const isImporting = importingRepo?.repo?.id === repo.id
                            return (
                                <RepoCard
                                    key={repo.id}
                                    repo={repo}
                                    isImporting={isImporting}
                                    importProgress={importingRepo?.progress}
                                    onImport={onImportRepo}
                                    disabled={importingRepo !== null}
                                />
                            )
                        })}
                    </div>
                    
                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-3 mt-3 pb-1 border-t border-border/50">
                        <span className="text-xs text-muted-foreground">
                            {totalCount} repos
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground min-w-[45px] text-center font-medium">
                                {currentPage}/{totalPages || 1}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/**
 * Empty state component
 */
function EmptyState({ icon: Icon = GitlabIcon, title = "No Repositories", message }) {
    return (
        <div className="h-full flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3 border border-border/50">
                <Icon className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <h3 className="text-sm font-medium mb-1">{title}</h3>
            <p className="text-xs text-muted-foreground max-w-[180px]">{message}</p>
        </div>
    )
}
