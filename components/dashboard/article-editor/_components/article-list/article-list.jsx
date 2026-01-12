"use client"

import { FileText, Loader2, Plus, RefreshCw, PanelLeftClose } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { ArticleCard } from "./article-card"
import { ArticleFilters } from "./article-filters"
import { ArticlePagination } from "./article-pagination"

/**
 * ArticleList - Sidebar component showing all articles with filtering and pagination
 */
export function ArticleList({
    articles,
    isLoading,
    isCreating,
    activeTab,
    setActiveTab,
    selectedArticle,
    onSelectArticle,
    sidebarOpen,
    setSidebarOpen,
    articleSearchTerm,
    setArticleSearchTerm,
    refreshingTab,
    deletingId,
    submittingId,
    onRefreshAll,
    onRefreshCategory,
    onCreateArticle,
    onSubmitForReview,
    onImportToDrafts,
    onDelete,
    getPaginatedArticles,
    setPage,
    counts,
    tabs,
    statusConfig,
}) {
    const { items, total, totalPages, currentPage } = getPaginatedArticles(activeTab)

    return (
        <Card
            className={cn(
                "flex flex-col transition-all duration-300 ease-in-out shrink-0",
                "max-md:absolute max-md:inset-2 max-md:z-50 max-md:shadow-xl",
                sidebarOpen
                    ? "w-full sm:w-72 md:w-80"
                    : "w-0 p-0 border-0 overflow-hidden max-md:hidden"
            )}
        >
            {sidebarOpen && (
                <>
                    <CardHeader className="pb-3 space-y-0 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <CardTitle className="text-sm sm:text-base whitespace-nowrap">
                                    Your articles
                                </CardTitle>
                                <Badge variant="secondary" className="shrink-0">
                                    {counts.all}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={onRefreshAll}
                                                disabled={refreshingTab !== null}
                                            >
                                                <RefreshCw
                                                    className={cn(
                                                        "h-4 w-4",
                                                        refreshingTab === "all_global" && "animate-spin"
                                                    )}
                                                />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Refresh all</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setSidebarOpen(false)}
                                            >
                                                <PanelLeftClose className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Close sidebar</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                        <ArticleFilters
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            searchTerm={articleSearchTerm}
                            setSearchTerm={setArticleSearchTerm}
                            tabs={tabs}
                            counts={counts}
                            onRefreshCategory={onRefreshCategory}
                            refreshingTab={refreshingTab}
                        />

                        {/* Articles count */}
                        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
                            <span className="text-xs text-muted-foreground">
                                {total} article{total !== 1 ? "s" : ""}
                            </span>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-3 space-y-2">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                                        <div className="rounded-full bg-muted p-3 mb-3">
                                            <FileText className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-medium">No articles</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {activeTab === "all"
                                                ? "Create your first article"
                                                : `No ${tabs.find((t) => t.id === activeTab)?.label.toLowerCase() || ""} articles`}
                                        </p>
                                    </div>
                                ) : (
                                    items.map((article) => (
                                        <ArticleCard
                                            key={article.id}
                                            article={article}
                                            isSelected={selectedArticle?.id === article.id}
                                            statusConfig={statusConfig[article.status] || statusConfig.DRAFT}
                                            onSelect={onSelectArticle}
                                            onSubmitForReview={onSubmitForReview}
                                            onImportToDrafts={onImportToDrafts}
                                            onDelete={onDelete}
                                            submittingId={submittingId}
                                            deletingId={deletingId}
                                        />
                                    ))
                                )}
                            </div>
                        </ScrollArea>

                        <ArticlePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => setPage(activeTab, page)}
                        />

                        {/* New article button at bottom */}
                        <div className="p-3 border-t mt-auto">
                            <Button
                                onClick={onCreateArticle}
                                disabled={isCreating}
                                className="w-full"
                            >
                                {isCreating ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4 mr-2" />
                                )}
                                New article
                            </Button>
                        </div>
                    </CardContent>
                </>
            )}
        </Card>
    )
}
