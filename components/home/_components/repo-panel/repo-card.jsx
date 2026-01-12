"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

/**
 * Individual repository card component.
 * Displays repository info and import button.
 */
export function RepoCard({ repo, isImporting, importProgress, onImport, disabled }) {
    return (
        <div
            className={`flex items-center justify-between gap-2 p-2 border border-border/50 rounded-lg transition-all duration-200 ${
                isImporting 
                    ? 'bg-primary/5 border-primary/30 shadow-sm' 
                    : 'hover:bg-accent/10 hover:border-primary/30 hover:shadow-sm'
            }`}
        >
            <div className="flex-1 min-w-0 overflow-hidden">
                <p className="font-medium text-xs sm:text-sm truncate text-foreground/90">
                    {repo.full_name}
                </p>
                <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
                    {repo.shortDescription || "No description"}
                </p>
            </div>

            <Button
                size="sm"
                className="h-7 px-3 text-xs flex-shrink-0 ml-1 min-w-[70px]"
                onClick={() => onImport(repo)}
                disabled={disabled}
            >
                {isImporting ? (
                    <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        {importProgress}%
                    </>
                ) : (
                    'Import'
                )}
            </Button>
        </div>
    )
}
