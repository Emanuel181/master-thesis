"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * StatusBadge - Reusable status badge with icon and configurable styling
 * 
 * @param {string} status - Status key to look up in config
 * @param {object} config - Configuration object mapping status to { label, color, icon }
 * @param {string} [variant="secondary"] - Badge variant
 * @param {string} [size="default"] - Size variant: "sm" | "default"
 * @param {string} [className] - Additional CSS classes
 * @param {boolean} [showIcon=true] - Whether to show the status icon
 */
export function StatusBadge({
    status,
    config,
    variant = "secondary",
    size = "default",
    className,
    showIcon = true,
}) {
    const statusConfig = config[status] || {
        label: status,
        color: "bg-muted text-muted-foreground",
        icon: null,
    }

    const Icon = statusConfig.icon
    const textSize = size === "sm" ? "text-[9px]" : "text-[10px]"
    const iconSize = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5"
    const padding = size === "sm" ? "px-1 py-0.5" : "px-1.5 py-0.5"

    return (
        <Badge
            variant={variant}
            className={cn(
                textSize,
                padding,
                "shrink-0",
                statusConfig.color,
                className
            )}
        >
            {showIcon && Icon && (
                <Icon className={cn(iconSize, "mr-0.5")} />
            )}
            <span className={cn(
                "truncate",
                size === "sm" ? "max-w-[60px]" : "max-w-none"
            )}>
                {statusConfig.label}
            </span>
        </Badge>
    )
}

/**
 * Pre-configured status configs for common use cases
 */
export const ARTICLE_STATUS_CONFIG = {
    DRAFT: {
        label: "Draft",
        color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        icon: null,
    },
    PENDING_REVIEW: {
        label: "Pending Review",
        color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: null,
    },
    IN_REVIEW: {
        label: "In Review",
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        icon: null,
    },
    PUBLISHED: {
        label: "Published",
        color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        icon: null,
    },
    REJECTED: {
        label: "Rejected",
        color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        icon: null,
    },
    SCHEDULED_FOR_DELETION: {
        label: "Scheduled",
        color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        icon: null,
    },
}

export const CONNECTION_STATUS_CONFIG = {
    connected: {
        label: "Connected",
        color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        icon: null,
    },
    disconnected: {
        label: "Disconnected",
        color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        icon: null,
    },
    loading: {
        label: "Loading...",
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        icon: null,
    },
    error: {
        label: "Error",
        color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        icon: null,
    },
}
