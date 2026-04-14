"use client"

import { Search, RefreshCw, X, ListFilter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Status color dots for each tab
const TAB_COLORS = {
    all: "bg-foreground/50",
    draft: "bg-secondary-foreground/50",
    pending: "bg-yellow-500",
    in_review: "bg-blue-500",
    published: "bg-green-500",
    rejected: "bg-red-500",
    pending_deletion: "bg-orange-500",
}

/**
 * ArticleFilters - Status dropdown filter and search input
 */
export function ArticleFilters({
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    tabs,
    counts,
    onRefreshCategory,
    refreshingTab,
}) {
    return (
        <div className="px-3 py-2.5 border-b space-y-2">
            {/* Status filter dropdown + refresh */}
            <div className="flex items-center gap-1.5">
                <Select value={activeTab} onValueChange={setActiveTab}>
                    <SelectTrigger className="h-8 text-xs flex-1">
                        <div className="flex items-center gap-2">
                            <ListFilter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <SelectValue placeholder="Filter by status" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {tabs.map((tab) => {
                            const count = counts[tab.id] || 0
                            const dotColor = TAB_COLORS[tab.id] || TAB_COLORS.all
                            return (
                                <SelectItem key={tab.id} value={tab.id}>
                                    <div className="flex items-center justify-between w-full gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className={cn("h-2 w-2 rounded-full shrink-0", dotColor)} />
                                            <span>{tab.label}</span>
                                        </div>
                                        {count > 0 && (
                                            <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-semibold tabular-nums ml-auto">
                                                {count}
                                            </Badge>
                                        )}
                                    </div>
                                </SelectItem>
                            )
                        })}
                    </SelectContent>
                </Select>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={onRefreshCategory}
                                disabled={refreshingTab !== null}
                            >
                                <RefreshCw
                                    className={cn(
                                        "h-3.5 w-3.5",
                                        refreshingTab === activeTab && "animate-spin"
                                    )}
                                />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                            Refresh {tabs.find((t) => t.id === activeTab)?.label || "category"}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            {/* Search input */}
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                    placeholder={`Search in ${(tabs.find((t) => t.id === activeTab)?.label || "articles").toLowerCase()}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 pl-8 pr-8 text-xs"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-sm transition-colors"
                    >
                        <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                )}
            </div>
        </div>
    )
}
