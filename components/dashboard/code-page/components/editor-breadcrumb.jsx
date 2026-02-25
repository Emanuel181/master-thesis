"use client"

import React from "react"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { FolderOpen, FileCode } from "lucide-react"

/**
 * EditorBreadcrumb — Shows the current file path as a breadcrumb
 * when editing a file from an imported project.
 */
export function EditorBreadcrumb({ filePath, repoName }) {
    if (!filePath) return null

    const segments = filePath.split("/").filter(Boolean)
    if (segments.length === 0) return null

    const fileName = segments[segments.length - 1]
    const folders = segments.slice(0, -1)

    return (
        <div className="hidden sm:flex items-center h-6 px-2 border-b bg-muted/20 shrink-0 overflow-hidden">
            <Breadcrumb>
                <BreadcrumbList className="flex-nowrap text-[10px] gap-1">
                    {/* Repo name */}
                    {repoName && (
                        <>
                            <BreadcrumbItem>
                                <BreadcrumbLink className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-default">
                                    <FolderOpen className="h-3 w-3" />
                                    <span className="max-w-[80px] truncate">{repoName}</span>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="text-muted-foreground/40" />
                        </>
                    )}

                    {/* Folder segments — show last 3 max */}
                    {folders.length > 3 && (
                        <>
                            <BreadcrumbItem>
                                <span className="text-[10px] text-muted-foreground">…</span>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="text-muted-foreground/40" />
                        </>
                    )}
                    {folders.slice(-3).map((folder, idx) => (
                        <React.Fragment key={idx}>
                            <BreadcrumbItem>
                                <span className="text-[10px] text-muted-foreground max-w-[80px] truncate">
                                    {folder}
                                </span>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="text-muted-foreground/40" />
                        </React.Fragment>
                    ))}

                    {/* File name */}
                    <BreadcrumbItem>
                        <span className="flex items-center gap-1 text-[10px] font-medium text-foreground">
                            <FileCode className="h-3 w-3" />
                            {fileName}
                        </span>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        </div>
    )
}

