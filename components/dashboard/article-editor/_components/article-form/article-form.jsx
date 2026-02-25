"use client"

import React, { useMemo } from "react"
import { PenLine, FileText, PanelLeft, Loader2, Send, Save, Maximize2, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

import { CoverSection } from "./cover-section"
import { IconSection } from "./icon-section"
import { DetailsSection } from "./details-section"
import { ContentSection } from "./content-section"

/**
 * ArticleForm - Main article editing form with all sections
 */
export function ArticleForm({
    selectedArticle,
    sidebarOpen,
    setSidebarOpen,
    formState,
    updateField,
    canEdit,
    canSubmit,
    submittingId,
    statusConfig,
    onSave,
    onSubmitForReview,
    onOpenFullscreen,
    // Icon props
    iconSearch,
    setIconSearch,
    iconPage,
    setIconPage,
    paginatedIcons,
    totalIconPages,
    onToggleIcon,
    // Constants
    presetGradients,
    categories,
    iconPositions,
    iconColors,
    // Auto-save
    lastSavedAt,
    onCoverImageUpload,
}) {
    const currentStatusConfig = statusConfig[selectedArticle?.status] || statusConfig.DRAFT

    // Compute article completeness for progress hints
    const completeness = useMemo(() => {
        if (!selectedArticle) return { steps: [], count: 0, total: 4 }
        const steps = [
            { label: "Title", done: !!formState.title?.trim() },
            { label: "Excerpt", done: !!formState.excerpt?.trim() },
            { label: "Cover", done: !!(formState.gradient || formState.coverImage) },
            { label: "Content", done: !!(selectedArticle.content || selectedArticle.contentMarkdown) },
        ]
        return { steps, count: steps.filter(s => s.done).length, total: steps.length }
    }, [selectedArticle, formState.title, formState.excerpt, formState.gradient, formState.coverImage])

    return (
        <Card className="flex-1 flex flex-col min-h-0 min-w-0">
            <CardHeader className="pb-2 sm:pb-3 shrink-0 border-b px-3 sm:px-6">
                {/* Mobile: Stack layout */}
                <div className="flex flex-col gap-2">
                    {/* Top row: Sidebar toggle + Title */}
                    <div className="flex items-center gap-2 min-w-0">
                        {/* Show open sidebar button when sidebar is closed OR always on mobile */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className={cn("h-8 w-8 shrink-0", sidebarOpen && "md:hidden")}
                                        onClick={() => setSidebarOpen(!sidebarOpen)}
                                    >
                                        <PanelLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {sidebarOpen ? "Close sidebar" : "Open sidebar"}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <div className="min-w-0 flex-1">
                            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                <PenLine className="h-4 w-4 shrink-0" />
                                <span className="truncate">
                                    {selectedArticle ? "Edit Article" : "Write article"}
                                </span>
                            </CardTitle>
                            {selectedArticle && (
                                <CardDescription className="truncate max-w-full sm:max-w-[300px]">
                                    {selectedArticle.title || "Untitled"}
                                </CardDescription>
                            )}
                        </div>
                        {/* Desktop: Actions inline */}
                        {selectedArticle && (
                            <div className="hidden sm:flex items-center gap-2">
                                <Badge
                                    className={cn(
                                        "font-normal text-xs shrink-0",
                                        currentStatusConfig.color
                                    )}
                                >
                                    {React.createElement(currentStatusConfig.icon || FileText, {
                                        className: "h-3 w-3 mr-1",
                                    })}
                                    {currentStatusConfig.label || "Unknown"}
                                </Badge>
                                {canEdit && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={onSave}
                                        className="h-8 text-sm px-3"
                                    >
                                        <Save className="h-3 w-3 mr-1" />
                                        Save
                                    </Button>
                                )}
                                {canSubmit && (
                                    <Button
                                        size="sm"
                                        onClick={() => onSubmitForReview(selectedArticle)}
                                        disabled={submittingId === selectedArticle.id}
                                        className="h-8 text-sm px-3"
                                    >
                                        {submittingId === selectedArticle.id ? (
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        ) : (
                                            <Send className="h-3 w-3 mr-1" />
                                        )}
                                        Submit
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                    {/* Mobile: Actions row below */}
                    {selectedArticle && (
                        <div className="flex sm:hidden items-center justify-between gap-2">
                            <Badge
                                className={cn(
                                    "font-normal text-[10px] shrink-0",
                                    currentStatusConfig.color
                                )}
                            >
                                {React.createElement(currentStatusConfig.icon || FileText, {
                                    className: "h-2.5 w-2.5 mr-1",
                                })}
                                {currentStatusConfig.label || "Unknown"}
                            </Badge>
                            <div className="flex items-center gap-1.5">
                                {canEdit && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={onSave}
                                        className="h-7 text-xs px-2"
                                    >
                                        <Save className="h-3 w-3 mr-1" />
                                        Save
                                    </Button>
                                )}
                                {canSubmit && (
                                    <Button
                                        size="sm"
                                        onClick={() => onSubmitForReview(selectedArticle)}
                                        disabled={submittingId === selectedArticle.id}
                                        className="h-7 text-xs px-2"
                                    >
                                        {submittingId === selectedArticle.id ? (
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        ) : (
                                            <Send className="h-3 w-3 mr-1" />
                                        )}
                                        Submit
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {/* Progress hints */}
                {selectedArticle && (
                    <div className="flex items-center gap-2 pt-2 mt-1 border-t border-border/40">
                        <TooltipProvider delayDuration={200}>
                            <div className="flex items-center gap-1">
                                {completeness.steps.map((step) => (
                                    <Tooltip key={step.label}>
                                        <TooltipTrigger asChild>
                                            <div className={cn(
                                                "h-1.5 w-6 rounded-full transition-colors",
                                                step.done ? "bg-emerald-500" : "bg-muted"
                                            )} />
                                        </TooltipTrigger>
                                        <TooltipContent className="text-xs">
                                            {step.label}: {step.done ? "✓" : "Missing"}
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                        </TooltipProvider>
                        <span className={cn(
                            "text-[10px] font-medium",
                            completeness.count === completeness.total
                                ? "text-emerald-500"
                                : "text-muted-foreground"
                        )}>
                            {completeness.count === completeness.total
                                ? "Ready to publish"
                                : `${completeness.count}/${completeness.total} complete`}
                        </span>
                    </div>
                )}
            </CardHeader>

            {selectedArticle ? (
                <CardContent className="flex-1 min-h-0 p-0">
                    <ScrollArea className="h-full">
                        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
                            <CoverSection
                                formState={formState}
                                updateField={updateField}
                                canEdit={canEdit}
                                presetGradients={presetGradients}
                                iconPositions={iconPositions}
                                iconColors={iconColors}
                                onCoverImageUpload={onCoverImageUpload}
                            />

                            <IconSection
                                formState={formState}
                                updateField={updateField}
                                canEdit={canEdit}
                                iconSearch={iconSearch}
                                setIconSearch={setIconSearch}
                                iconPage={iconPage}
                                setIconPage={setIconPage}
                                paginatedIcons={paginatedIcons}
                                totalIconPages={totalIconPages}
                                iconPositions={iconPositions}
                                iconColors={iconColors}
                                onToggleIcon={onToggleIcon}
                            />

                            <DetailsSection
                                formState={formState}
                                updateField={updateField}
                                canEdit={canEdit}
                                categories={categories}
                            />

                            <ContentSection
                                selectedArticle={selectedArticle}
                                canEdit={canEdit}
                                lastSavedAt={lastSavedAt}
                                onOpenFullscreen={onOpenFullscreen}
                            />
                        </div>
                    </ScrollArea>
                </CardContent>
            ) : (
                <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center"
                    >
                        <div className="relative mb-6">
                            <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-8 ring-4 ring-primary/10">
                                <PenLine className="h-12 w-12 text-primary" />
                            </div>
                            <motion.div
                                animate={{ y: [0, -4, 0] }}
                                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary/30"
                            />
                            <motion.div
                                animate={{ y: [0, 3, 0] }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.5 }}
                                className="absolute -bottom-1 -left-2 h-3 w-3 rounded-full bg-primary/20"
                            />
                        </div>
                        <h3 className="font-semibold text-lg mb-1">Ready to write?</h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-[300px]">
                            Select an article from the sidebar to start editing, or create a new one to share your ideas.
                        </p>
                        <div className="flex items-center gap-3">
                            {!sidebarOpen && (
                                <Button variant="outline" onClick={() => setSidebarOpen(true)}>
                                    <PanelLeft className="h-4 w-4 mr-2" />
                                    Open Sidebar
                                </Button>
                            )}
                        </div>
                    </motion.div>
                </CardContent>
            )}
        </Card>
    )
}
