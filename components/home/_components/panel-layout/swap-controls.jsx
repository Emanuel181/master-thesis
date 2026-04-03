"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowUpDown } from "lucide-react"

/**
 * Swap button component for swapping panel positions.
 * @param {Function} onClick - Click handler for swapping
 * @param {string} title - Tooltip title
 * @param {string} className - Additional CSS classes
 * @param {boolean} rotate - Whether to rotate the icon 90 degrees
 * @param {Function} onHoverChange - Callback when hover state changes (true/false)
 */
export function SwapButton({ onClick, title, className, rotate = false, onHoverChange }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onClick}
                    onMouseEnter={() => onHoverChange?.(true)}
                    onMouseLeave={() => onHoverChange?.(false)}
                    className={`h-8 w-8 rounded-full bg-background shadow-md border-border/80 hover:bg-accent ${className || ''}`}
                >
                    <ArrowUpDown className={`h-4 w-4 ${rotate ? 'rotate-90' : ''}`} />
                </Button>
            </TooltipTrigger>
            <TooltipContent>{title}</TooltipContent>
        </Tooltip>
    )
}
