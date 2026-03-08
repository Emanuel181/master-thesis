"use client"

import React, { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Upload,
    FolderInput,
    ClipboardPaste,
    Code,
    FileCode,
    Keyboard,
} from "lucide-react"

/**
 * EditorEmptyState — Shown when there's no code and no file selected.
 * Provides drag-drop zone, quick actions, and language chips.
 */
export function EditorEmptyState({
    onImport,
    onPasteClick,
    displayLanguages = [],
    onFileDrop,
}) {
    const [isDragOver, setIsDragOver] = useState(false)

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)
    }, [])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)

        // Handle text drops
        const text = e.dataTransfer.getData("text/plain")
        if (text && text.trim()) {
            onFileDrop?.(text)
            return
        }

        // Handle file drops
        const files = e.dataTransfer.files
        if (files.length > 0) {
            const file = files[0]
            const reader = new FileReader()
            reader.onload = (event) => {
                const content = event.target?.result
                if (typeof content === "string") {
                    onFileDrop?.(content, file.name)
                }
            }
            reader.readAsText(file)
        }
    }, [onFileDrop])

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
            {/* Drag-drop zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full max-w-md rounded-lg border-2 border-dashed transition-colors p-6 sm:p-8 flex flex-col items-center text-center gap-4 ${
                    isDragOver
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/40"
                }`}
            >
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <Code className="h-6 w-6 text-muted-foreground" />
                </div>

                <div>
                    <h3 className="text-sm font-semibold">Start editing</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        Paste code, drop a file, or import a repository
                    </p>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={onPasteClick}
                    >
                        <ClipboardPaste className="h-3.5 w-3.5" />
                        Paste code
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={onImport}
                    >
                        <FolderInput className="h-3.5 w-3.5" />
                        Import repo
                    </Button>
                </div>

                {/* Keyboard hint */}
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Keyboard className="h-3 w-3" />
                    <span>
                        <kbd className="px-1 py-0.5 rounded bg-muted border text-[9px] font-mono">Ctrl</kbd>
                        {" + "}
                        <kbd className="px-1 py-0.5 rounded bg-muted border text-[9px] font-mono">V</kbd>
                        {" to paste"}
                    </span>
                </div>
            </div>

            {/* Language quick-select */}
            <div className="mt-4 sm:mt-6 flex flex-col items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    Language
                </span>
                <div className="flex flex-wrap justify-center gap-1.5">
                    {displayLanguages.map((lang) => (
                        <Badge
                            key={lang.prism}
                            variant="outline"
                            className="cursor-default text-[10px] px-2 py-0.5 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                        >
                            {lang.name}
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
    )
}

