'use client'

import React, { useState, useEffect } from "react"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import ThemeCustomization from "@/components/theme-customization"

export function CustomizationDialog({ className = "", showEditorTabs = true }) {
    const [open, setOpen] = useState(false)

    // Listen for the open-settings event from command palette
    useEffect(() => {
        const handleOpenSettings = () => {
            setOpen(true)
        }

        window.addEventListener('open-settings', handleOpenSettings)
        return () => {
            window.removeEventListener('open-settings', handleOpenSettings)
        }
    }, [])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className={className}
                    aria-label="Open theme customization"
                >
                    <Settings className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] p-0">
                <DialogHeader className="px-4 pt-4 pb-2">
                    <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <div className="px-4 pb-4">
                    <ThemeCustomization showEditorTabs={showEditorTabs} />
                </div>
            </DialogContent>
        </Dialog>
    )
}
