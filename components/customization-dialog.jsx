'use client'

import React, { useState } from "react"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import ThemeCustomization from "@/components/theme-customization"

export function CustomizationDialog({ className = "", showEditorTabs = true }) {
    const [open, setOpen] = useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className={className}
                    aria-label="Open theme customization"
                >
                    <Settings className="h-5 w-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[340px] p-3"
                align="end"
                side="bottom"
                sideOffset={8}
            >
                <ThemeCustomization showEditorTabs={showEditorTabs} />
            </PopoverContent>
        </Popover>
    )
}
