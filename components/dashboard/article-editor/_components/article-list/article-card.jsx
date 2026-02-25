"use client"

import { FileText, Clock, Loader2, Send, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * Truncate excerpt text
 */
const truncateExcerpt = (text, maxLength = 60) => {
    if (!text) return "No excerpt"
    return text.length > maxLength ? text.substring(0, maxLength - 3) + "..." : text
}

/**
 * Format relative time
 */
const formatRelativeTime = (dateStr) => {
    if (!dateStr) return null
    try {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now - date
        const diffMin = Math.floor(diffMs / 60000)
        if (diffMin < 1) return "just now"
        if (diffMin < 60) return `${diffMin}m ago`
        const diffHr = Math.floor(diffMin / 60)
        if (diffHr < 24) return `${diffHr}h ago`
        const diffDays = Math.floor(diffHr / 24)
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    } catch {
        return null
    }
}

/**
 * ArticleCard - Individual article display in the list
 */
export function ArticleCard({
    article,
    isSelected,
    statusConfig,
    onSelect,
    onSubmitForReview,
    onImportToDrafts,
    onDelete,
    submittingId,
    deletingId,
}) {
    const StatusIcon = statusConfig.icon
    const isDraft = article.status === "DRAFT"
    const isRejected = article.status === "REJECTED"
    const isScheduledForDeletion = article.status === "SCHEDULED_FOR_DELETION"
    const canImportToDrafts = isRejected || isScheduledForDeletion
    const relativeTime = formatRelativeTime(article.updatedAt)

    return (
        <Card
            className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 overflow-hidden group",
                isSelected && "ring-2 ring-primary shadow-md border-primary"
            )}
            onClick={() => onSelect(article)}
        >
            {/* Gradient/cover preview strip */}
            {(article.gradient || article.coverImage) && (
                <div
                    className="h-1 w-full"
                    style={{
                        background: article.gradient || undefined,
                        backgroundImage: article.coverImage && !article.gradient ? `url(${article.coverImage})` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
            )}
            <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate flex-1">
                                {article.title || "Untitled"}
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                            {truncateExcerpt(article.excerpt)}
                        </p>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                                <span className={cn(
                                    "h-2 w-2 rounded-full shrink-0",
                                    statusConfig.color.replace(/text-\S+/, '').replace(/\/15/g, '').trim()
                                        || "bg-muted-foreground"
                                )} style={{
                                    backgroundColor: statusConfig.color.includes('success') ? 'hsl(var(--success))' :
                                        statusConfig.color.includes('destructive') ? 'hsl(var(--destructive))' :
                                        statusConfig.color.includes('primary') ? 'hsl(var(--primary))' :
                                        statusConfig.color.includes('severity-medium') ? 'hsl(var(--severity-medium))' :
                                        statusConfig.color.includes('severity-high') ? 'hsl(var(--severity-high))' :
                                        undefined
                                }} />
                                <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                                    {statusConfig.label}
                                </span>
                            </div>
                            {article.readTime && (
                                <span className="text-[9px] sm:text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0">
                                    <Clock className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                                    {article.readTime}
                                </span>
                            )}
                            {relativeTime && (
                                <span className="text-[9px] sm:text-[10px] text-muted-foreground/60 ml-auto">
                                    {relativeTime}
                                </span>
                            )}
                            {article.scheduledForDeletionAt && (
                                <span className="text-[9px] sm:text-[10px] text-orange-600 dark:text-orange-400 flex items-center gap-0.5 truncate">
                                    <span className="hidden sm:inline">Deletes:</span>{" "}
                                    {new Date(article.scheduledForDeletionAt).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {/* Import to Drafts button - for rejected and scheduled for deletion */}
                        {canImportToDrafts && (
                            // ...existing code...
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onImportToDrafts(article)
                                            }}
                                            disabled={submittingId === article.id}
                                        >
                                            {submittingId === article.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <FileText className="h-3 w-3" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Import to Drafts</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {/* Submit for review button - only for drafts */}
                        {isDraft && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onSubmitForReview(article)
                                            }}
                                            disabled={submittingId === article.id}
                                        >
                                            {submittingId === article.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Send className="h-3 w-3" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Submit for review</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {/* Delete button - for all articles */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDelete(article)
                                        }}
                                        disabled={deletingId === article.id}
                                    >
                                        {deletingId === article.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3 w-3" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
