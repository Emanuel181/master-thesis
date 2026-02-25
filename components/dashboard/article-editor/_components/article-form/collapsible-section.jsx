"use client"

import React, { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * CollapsibleSection - A collapsible card section wrapper with animated expand/collapse
 */
export function CollapsibleSection({
    title,
    description,
    icon: Icon,
    children,
    defaultOpen = true,
    className,
    badge,
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <Card
            className={cn(
                className,
                "transition-all duration-200",
                !isOpen && "cursor-pointer hover:bg-muted/30"
            )}
            onClick={!isOpen ? () => setIsOpen(true) : undefined}
        >
            <CardHeader
                className={cn(
                    "pb-3 cursor-pointer select-none transition-colors rounded-t-lg",
                    isOpen ? "hover:bg-muted/50" : ""
                )}
                onClick={isOpen ? () => setIsOpen(false) : undefined}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {Icon && (
                            <div className={cn(
                                "p-1 rounded transition-colors",
                                isOpen ? "bg-primary/10 text-primary" : "text-muted-foreground"
                            )}>
                                <Icon className="h-4 w-4" />
                            </div>
                        )}
                        <div>
                            <CardTitle className="text-sm flex items-center gap-2">
                                {title}
                                {badge}
                            </CardTitle>
                            {description && (
                                <CardDescription className="text-xs">
                                    {description}
                                </CardDescription>
                            )}
                        </div>
                    </div>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                </div>
            </CardHeader>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                    >
                        <CardContent className="pt-0">{children}</CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    )
}
