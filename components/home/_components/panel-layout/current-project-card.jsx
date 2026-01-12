"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github, FolderOpen, FolderX } from "lucide-react"
import { GitlabIcon } from "@/components/icons/gitlab"

/**
 * Current project card component.
 * Displays the currently loaded project with actions.
 */
export function CurrentProjectCard({
    currentRepo,
    onOpenInEditor,
    onUnload,
    className,
}) {
    return (
        <Card className={`flex flex-col transition-shadow hover:shadow-md shrink-0 ${className || ''}`}>
            <CardHeader className="py-2 px-2.5 sm:py-3 sm:px-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base">
                        <FolderOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">Current project</span>
                    </CardTitle>
                </div>
            </CardHeader>

            <CardContent className="pt-2 pb-2 px-2.5 sm:px-4">
                {currentRepo ? (
                    <div className="flex flex-col gap-2">
                        <div className="p-2.5 border rounded-lg bg-muted/20 transition-colors hover:bg-muted/30">
                            <div className="flex items-center gap-2 mb-1.5">
                                {currentRepo.provider === 'gitlab' ? (
                                    <GitlabIcon className="h-4 w-4" />
                                ) : (
                                    <Github className="h-4 w-4" />
                                )}
                                <span className="text-xs font-medium uppercase text-muted-foreground">
                                    {currentRepo.provider || 'github'}
                                </span>
                            </div>
                            <p className="font-medium text-sm">{currentRepo.owner}/{currentRepo.repo}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Currently loaded project</p>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 transition-colors"
                                onClick={onOpenInEditor}
                            >
                                <FolderOpen className="h-3 w-3 mr-2" />
                                Open in Editor
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="flex-1 h-8"
                                onClick={onUnload}
                            >
                                <FolderX className="h-3 w-3 mr-2" />
                                Unload
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-center">
                        <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center mb-1.5 border border-border/50">
                            <FolderX className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                        <h3 className="text-xs font-medium mb-0.5">No project loaded</h3>
                        <p className="text-[10px] text-muted-foreground max-w-[180px]">Import a repository from GitHub or GitLab to get started</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
