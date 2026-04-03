"use client"

import { PersonStanding } from "lucide-react"
import { useAccessibility } from "@/contexts/accessibilityContext"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * AccessibilityButton - Opens accessibility options panel
 */
export function AccessibilityButton({ compact }) {
    const { openPanel } = useAccessibility()

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant={compact ? "ghost" : "outline"}
                    size="icon"
                    onClick={openPanel}
                    className={cn(
                        compact && "h-7 w-7 border-0"
                    )}
                    aria-label="Accessibility options"
                >
                    <PersonStanding
                        className={compact ? "h-4 w-4" : "h-5 w-5"}
                        strokeWidth={2}
                    />
                </Button>
            </TooltipTrigger>
            <TooltipContent>Accessibility options</TooltipContent>
        </Tooltip>
    )
}
