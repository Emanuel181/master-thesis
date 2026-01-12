"use client"

import React from "react"
import { PenLine, FileText, PanelLeft, Loader2, Send, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
                    <div className="rounded-full bg-muted p-6 mb-4">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">No article selected</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-[300px]">
                        Select an article from the sidebar to edit, or create a new one to get
                        started.
                    </p>
                    <div className="flex items-center gap-3">
                        {!sidebarOpen && (
                            <Button variant="outline" onClick={() => setSidebarOpen(true)}>
                                <PanelLeft className="h-4 w-4 mr-2" />
                                Open Sidebar
                            </Button>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    )
}
