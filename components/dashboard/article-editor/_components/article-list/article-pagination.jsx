"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * ArticlePagination - Pagination controls for article list
 */
export function ArticlePagination({
    currentPage,
    totalPages,
    onPageChange,
}) {
    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30">
            <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight className="h-3 w-3" />
                </Button>
            </div>
        </div>
    )
}
