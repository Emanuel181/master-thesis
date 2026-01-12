"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * PaginationControls - Reusable pagination component
 * 
 * @param {number} currentPage - Current page number (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Callback when page changes, receives new page number
 * @param {string} [variant="default"] - Visual variant: "default" | "compact" | "minimal"
 * @param {string} [className] - Additional CSS classes
 * @param {boolean} [showPageCount=true] - Whether to show "Page X of Y" text
 * @param {string} [countLabel] - Optional label to show instead of page count (e.g., "5 repos")
 */
export function PaginationControls({
    currentPage,
    totalPages,
    onPageChange,
    variant = "default",
    className,
    showPageCount = true,
    countLabel,
}) {
    if (totalPages <= 1) return null

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1)
        }
    }

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1)
        }
    }

    const buttonSize = variant === "compact" ? "h-6 w-6" : "h-7 w-7"
    const iconSize = variant === "compact" ? "h-3 w-3" : "h-4 w-4"
    const textSize = variant === "compact" ? "text-[10px]" : "text-xs"

    return (
        <div className={cn(
            "flex items-center",
            variant === "default" && "justify-between",
            variant === "compact" && "justify-center gap-2",
            variant === "minimal" && "justify-center gap-2",
            className
        )}>
            {/* Count label or page info on the left (default variant only) */}
            {variant === "default" && showPageCount && (
                <span className={cn("text-muted-foreground", textSize)}>
                    {countLabel || `Page ${currentPage} of ${totalPages}`}
                </span>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center gap-1">
                <Button
                    variant={variant === "minimal" ? "ghost" : "outline"}
                    size="icon"
                    className={cn(buttonSize, "p-0")}
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                >
                    <ChevronLeft className={iconSize} />
                </Button>

                {/* Page indicator (compact and minimal variants) */}
                {(variant === "compact" || variant === "minimal") && showPageCount && (
                    <span className={cn(
                        "text-muted-foreground min-w-[45px] text-center",
                        textSize
                    )}>
                        {currentPage}/{totalPages}
                    </span>
                )}

                <Button
                    variant={variant === "minimal" ? "ghost" : "outline"}
                    size="icon"
                    className={cn(buttonSize, "p-0")}
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                >
                    <ChevronRight className={iconSize} />
                </Button>
            </div>
        </div>
    )
}
