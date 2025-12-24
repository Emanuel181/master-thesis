"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { formatShortcut } from "@/hooks/use-keyboard-shortcuts"

/**
 * TooltipButton - A button with consistent tooltip behavior
 * Shows tooltip with optional keyboard shortcut hint
 */
export const TooltipButton = React.forwardRef(function TooltipButton(
    {
        children,
        tooltip,
        shortcut,
        side = "top",
        align = "center",
        delayDuration = 300,
        className,
        asChild = false,
        ...props
    },
    ref
) {
    if (!tooltip && !shortcut) {
        return (
            <Button ref={ref} className={className} {...props}>
                {children}
            </Button>
        )
    }

    return (
        <TooltipProvider>
            <Tooltip delayDuration={delayDuration}>
                <TooltipTrigger asChild>
                    <Button ref={ref} className={className} {...props}>
                        {children}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side={side} align={align}>
                    <div className="flex items-center gap-2">
                        <span>{tooltip}</span>
                        {shortcut && (
                            <kbd className="inline-flex h-5 items-center rounded border bg-background/50 px-1.5 font-mono text-[10px] text-muted-foreground">
                                {formatShortcut(shortcut)}
                            </kbd>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
})

/**
 * IconButton - A small icon button with tooltip
 */
export const IconButton = React.forwardRef(function IconButton(
    {
        icon: Icon,
        tooltip,
        shortcut,
        size = "icon",
        variant = "ghost",
        className,
        iconClassName,
        ...props
    },
    ref
) {
    return (
        <TooltipButton
            ref={ref}
            variant={variant}
            size={size}
            tooltip={tooltip}
            shortcut={shortcut}
            className={cn("h-8 w-8", className)}
            {...props}
        >
            <Icon className={cn("h-4 w-4", iconClassName)} />
            <span className="sr-only">{tooltip}</span>
        </TooltipButton>
    )
})

/**
 * ActionButton - A button with text and optional icon, with tooltip
 */
export const ActionButton = React.forwardRef(function ActionButton(
    {
        icon: Icon,
        children,
        tooltip,
        shortcut,
        iconPosition = "left",
        className,
        iconClassName,
        ...props
    },
    ref
) {
    const content = (
        <>
            {Icon && iconPosition === "left" && (
                <Icon className={cn("h-4 w-4 mr-2", iconClassName)} />
            )}
            {children}
            {Icon && iconPosition === "right" && (
                <Icon className={cn("h-4 w-4 ml-2", iconClassName)} />
            )}
            {shortcut && (
                <kbd className="ml-auto hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                    {formatShortcut(shortcut)}
                </kbd>
            )}
        </>
    )

    if (tooltip) {
        return (
            <TooltipButton
                ref={ref}
                tooltip={tooltip}
                shortcut={undefined} // Already shown in button
                className={className}
                {...props}
            >
                {content}
            </TooltipButton>
        )
    }

    return (
        <Button ref={ref} className={className} {...props}>
            {content}
        </Button>
    )
})

export default TooltipButton

