"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, ChevronDown, ChevronRight, Folder, File } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { DEMO_DOCUMENTS } from "@/contexts/demoContext"

/**
 * KnowledgeBaseCard - Card component for displaying and selecting a knowledge base.
 */
export function KnowledgeBaseCard({
    kb,
    isSelected,
    docCount,
    isRefreshing,
    isExpanded,
    isDemoMode,
    onToggle,
    onExpand,
    onRefresh,
    truncateText,
}) {
    const IconComponent = LucideIcons[kb.icon]
    const documents = isDemoMode ? (DEMO_DOCUMENTS[kb.id] || []) : []
    
    // Group documents by folder
    const folders = {}
    const rootDocs = []
    documents.forEach(doc => {
        if (doc.folder) {
            if (!folders[doc.folder]) folders[doc.folder] = []
            folders[doc.folder].push(doc)
        } else {
            rootDocs.push(doc)
        }
    })

    return (
        <Card
            className={`transition-all duration-200 ${
                isSelected
                    ? 'border-cyan-500 dark:border-cyan-400 border-2 bg-cyan-50 dark:bg-cyan-950/30'
                    : 'hover:border-cyan-300 dark:hover:border-cyan-600'
            }`}
        >
            <CardContent className="p-4 sm:p-5">
                <div 
                    className="flex items-start gap-3 sm:gap-4 cursor-pointer"
                    onClick={onToggle}
                >
                    <div className={`p-2 sm:p-3 rounded-lg shrink-0 ${
                        isSelected
                            ? 'bg-cyan-500 dark:bg-cyan-500'
                            : 'bg-cyan-100 dark:bg-cyan-900/50'
                    }`}>
                        <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 ${
                            isSelected
                                ? 'text-white'
                                : 'text-cyan-600 dark:text-cyan-400'
                        }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm sm:text-base truncate">{kb.title}</h3>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                    {docCount} docs
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onExpand()
                                    }}
                                >
                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6 shrink-0"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onRefresh()
                                    }}
                                    title={`Refresh documents in ${kb.title}`}
                                    disabled={isRefreshing}
                                >
                                    <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {truncateText(kb.content, 100)}
                        </p>
                    </div>
                </div>
                
                {/* Expandable Documents Section */}
                {isExpanded && isDemoMode && (
                    <div className="mt-4 pt-4 border-t">
                        <div className="space-y-2">
                            {/* Root documents */}
                            {rootDocs.map(doc => (
                                <div key={doc.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-muted/50">
                                    <File className="h-4 w-4 text-red-500 shrink-0" />
                                    <span className="truncate flex-1">{doc.name}</span>
                                    <span className="text-xs text-muted-foreground shrink-0">{doc.size}</span>
                                </div>
                            ))}
                            
                            {/* Folders with documents */}
                            {Object.entries(folders).map(([folderName, folderDocs]) => (
                                <div key={folderName} className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm font-medium py-1 px-2">
                                        <Folder className="h-4 w-4 text-yellow-500 shrink-0" />
                                        <span>{folderName}</span>
                                        <span className="text-xs text-muted-foreground">({folderDocs.length})</span>
                                    </div>
                                    <div className="ml-6 space-y-1">
                                        {folderDocs.map(doc => (
                                            <div key={doc.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-muted/50">
                                                <File className="h-4 w-4 text-red-500 shrink-0" />
                                                <span className="truncate flex-1">{doc.name}</span>
                                                <span className="text-xs text-muted-foreground shrink-0">{doc.size}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            
                            {documents.length === 0 && (
                                <p className="text-sm text-muted-foreground italic py-2">No documents in this knowledge base.</p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
