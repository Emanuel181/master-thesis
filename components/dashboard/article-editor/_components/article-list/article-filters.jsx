"use client"

import { Search, Filter, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * ArticleFilters - Status filter dropdown and search input
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
        <div className="px-4 py-3 border-b space-y-2">
            <div className="flex items-center gap-2">
                <Select value={activeTab} onValueChange={setActiveTab}>
                    <SelectTrigger className="w-full h-9">
                        <div className="flex items-center gap-2">
                            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                            <SelectValue />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {tabs.map((tab) => (
                            <SelectItem key={tab.id} value={tab.id}>
                                <div className="flex items-center justify-between w-full gap-3">
                                    <span>{tab.label}</span>
                                    <Badge
                                        variant="outline"
                                        className="ml-auto text-[10px] px-1.5 py-0 font-normal"
                                    >
                                        {counts[tab.id]}
                                    </Badge>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                onClick={onRefreshCategory}
                                disabled={refreshingTab !== null}
                            >
                                <RefreshCw
                                    className={cn(
                                        "h-4 w-4",
                                        refreshingTab === activeTab && "animate-spin"
                                    )}
                                />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
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
                    className="h-8 pl-8 text-xs"
                />
            </div>
        </div>
    )
}
