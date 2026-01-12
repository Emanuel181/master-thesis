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

    return (
        <Card
            className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected && "ring-2 ring-primary shadow-md"
            )}
            onClick={() => onSelect(article)}
        >
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
                            <Badge
                                variant="secondary"
                                className={cn(
                                    "text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 shrink-0",
                                    statusConfig.color
                                )}
                            >
                                <StatusIcon className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-0.5" />
                                <span className="truncate max-w-[60px] sm:max-w-none">
                                    {statusConfig.label}
                                </span>
                            </Badge>
                            {article.readTime && (
                                <span className="text-[9px] sm:text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0">
                                    <Clock className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                                    {article.readTime}
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

                    <div className="flex flex-col gap-1 shrink-0">
                        {/* Import to Drafts button - for rejected and scheduled for deletion */}
                        {canImportToDrafts && (
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
