"use client"

import { Maximize2, Info, PenLine, Clock, Lightbulb, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { CollapsibleSection } from "./collapsible-section"

/**
 * ContentSection - Content editor section with fullscreen button, word count & tips
 */
export function ContentSection({
    selectedArticle,
    canEdit,
    lastSavedAt,
    onOpenFullscreen,
}) {
    // Derive approximate word count from readTime
    const readTimeStr = selectedArticle?.readTime || ""
    const readMinutes = parseInt(readTimeStr) || 0
    const approxWords = readMinutes * 200
    const hasContent = !!(selectedArticle?.content || selectedArticle?.contentMarkdown)

    return (
        <CollapsibleSection
            title="Content"
            description="Write your article content"
            icon={PenLine}
            defaultOpen={true}
            badge={hasContent ? (
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Has content
                </Badge>
            ) : null}
        >
            <div className="space-y-4">
                {/* Stats row */}
                {hasContent && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {readMinutes > 0 && (
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{selectedArticle.readTime}</span>
                            </div>
                        )}
                        {approxWords > 0 && (
                            <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                <span>~{approxWords.toLocaleString()} words</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Auto-save info */}
                <Alert className="border-border/50">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                        Your progress is automatically saved every 30 seconds while editing.
                        {lastSavedAt && (
                            <span className="block mt-1 text-muted-foreground">
                                Last saved: {lastSavedAt.toLocaleTimeString()}
                            </span>
                        )}
                    </AlertDescription>
                </Alert>

                {/* Open Editor CTA Card */}
                <button
                    onClick={onOpenFullscreen}
                    disabled={!canEdit}
                    className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-lg border-2 border-dashed transition-colors text-left",
                        canEdit
                            ? "border-primary/30 hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                            : "border-border opacity-50 cursor-not-allowed"
                    )}
                >
                    <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                        <Maximize2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">Open Editor</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Full writing experience with rich text tools
                        </p>
                    </div>
                </button>

                {/* Writing tips */}
                {!hasContent && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-2 rounded-lg bg-muted/40 p-3"
                    >
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Lightbulb className="h-3 w-3" />
                            Writing tips
                        </div>
                        <ul className="space-y-1.5 text-[11px] text-muted-foreground/80">
                            <li className="flex items-start gap-1.5">
                                <span className="shrink-0 mt-0.5">•</span>
                                <span>Aim for 800–1500 words for optimal engagement</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                                <span className="shrink-0 mt-0.5">•</span>
                                <span>Break up text with headings, images, and code blocks</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                                <span className="shrink-0 mt-0.5">•</span>
                                <span>Start with a clear problem statement or hook</span>
                            </li>
                        </ul>
                    </motion.div>
                )}
            </div>
        </CollapsibleSection>
    )
}
