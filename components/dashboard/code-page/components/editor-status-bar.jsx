"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, CheckIcon } from "lucide-react"

/**
 * EditorStatusBar — VS Code-style bottom bar showing cursor position,
 * language selector, encoding, and line count.
 */
export function EditorStatusBar({
    cursorPosition = { lineNumber: 1, column: 1 },
    language,
    setLanguage,
    displayLanguages = [],
    lineCount = 1,
    tabSize = 4,
    isViewOnly = false,
}) {
    return (
        <div className="hidden sm:flex items-center justify-between h-6 px-2 border-t bg-muted/30 text-[10px] text-muted-foreground select-none shrink-0">
            {/* Left side */}
            <div className="flex items-center gap-3">
                {/* Cursor position */}
                <span className="tabular-nums">
                    Ln {cursorPosition.lineNumber}, Col {cursorPosition.column}
                </span>

                {/* Total lines */}
                <span className="tabular-nums">
                    {lineCount} line{lineCount !== 1 ? "s" : ""}
                </span>

                {isViewOnly && (
                    <span className="text-muted-foreground/70 font-medium">Read-only</span>
                )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
                {/* Tab size */}
                <span>Spaces: {tabSize}</span>

                {/* Encoding */}
                <span>UTF-8</span>

                {/* Language selector */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                        >
                            {language?.name || "Unknown"}
                            <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 max-h-64 overflow-y-auto">
                        <DropdownMenuLabel className="text-xs">Language</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {displayLanguages.map((lang) => (
                            <DropdownMenuItem
                                key={lang.prism}
                                onClick={() => setLanguage(lang)}
                                className="text-xs gap-2"
                            >
                                {lang.prism === language?.prism && (
                                    <CheckIcon className="h-3 w-3" />
                                )}
                                {lang.prism !== language?.prism && (
                                    <span className="w-3" />
                                )}
                                {lang.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}

