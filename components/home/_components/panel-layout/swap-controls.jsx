"use client"

import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

/**
 * Swap button component for swapping panel positions.
 */
export function SwapButton({ onClick, title, className, rotate = false }) {
    return (
        <Button
            variant="outline"
            size="icon"
            onClick={onClick}
            className={`h-8 w-8 rounded-full bg-background shadow-md border-border/80 hover:bg-accent ${className || ''}`}
            title={title}
        >
            <ArrowUpDown className={`h-4 w-4 ${rotate ? 'rotate-90' : ''}`} />
        </Button>
    )
}
