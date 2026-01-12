"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Trash2, MessageSquare } from "lucide-react"
import { PromptList } from "./prompt-list"
import { AddPromptDialog } from "./prompt-dialogs"

const agents = ["reviewer", "implementation", "tester", "report"]

/**
 * Prompt panel component.
 * Displays prompts organized by agent tabs with CRUD operations.
 */
export function PromptPanel({
    prompts,
    currentAgent,
    setCurrentAgent,
    isRefreshing,
    onRefresh,
    // Add dialog props
    isDialogOpen,
    setIsDialogOpen,
    newTitle,
    setNewTitle,
    newPrompt,
    setNewPrompt,
    onAddPrompt,
    // Selection props
    selectedPrompts,
    setSelectedPrompts,
    setDeleteDialog,
    // Pagination props
    getPaginatedPrompts,
    setAgentPage,
    // Drag props
    activeId,
    activeDragAgent,
    onDragStart,
    onDragEnd,
    // Other props
    truncateText,
    setViewFullTextPrompt,
    openEditDialog,
    onMoveUp,
    onMoveDown,
    className,
}) {
    return (
        <Card className={`flex flex-col overflow-hidden transition-shadow hover:shadow-md flex-1 min-h-[420px] ${className || ''}`}>
            <CardHeader className="py-2 px-2.5 sm:py-3 sm:px-4 flex-shrink-0">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base">
                        <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">Agent prompts</span>
                    </CardTitle>
                    <div className="flex gap-1 flex-shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            title="Refresh prompts"
                        >
                            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                        {selectedPrompts.size > 0 && (
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs gap-1"
                                onClick={() => setDeleteDialog({ type: 'selected', count: selectedPrompts.size })}
                                title="Delete selected prompts"
                            >
                                <Trash2 className="h-3 w-3" />
                                <span className="hidden xs:inline">Delete ({selectedPrompts.size})</span>
                                <span className="xs:hidden">×{selectedPrompts.size}</span>
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 overflow-hidden py-2 px-2.5 sm:px-4">
                <Tabs value={currentAgent} onValueChange={setCurrentAgent} className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-4 h-7 sm:h-8 flex-shrink-0">
                        {agents.map((agent) => (
                            <TabsTrigger key={agent} value={agent} className="capitalize text-[9px] sm:text-[10px] md:text-xs px-0.5 sm:px-1 truncate">
                                <span className="truncate">{agent}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {agents.map((agent) => {
                        const { items, currentPage, totalPages, totalCount } = getPaginatedPrompts(agent)
                        
                        return (
                            <TabsContent key={agent} value={agent} className="flex-1 overflow-hidden mt-2 flex flex-col min-h-0">
                                <div className="flex justify-between items-center gap-1 mb-2 flex-shrink-0">
                                    <Button 
                                        size="sm" 
                                        variant="destructive" 
                                        className="h-7 px-2 text-[10px]" 
                                        onClick={() => setDeleteDialog({ type: 'category', agent })}
                                    >
                                        Delete all
                                    </Button>

                                    <AddPromptDialog
                                        isOpen={isDialogOpen}
                                        onOpenChange={setIsDialogOpen}
                                        agent={agent}
                                        title={newTitle}
                                        setTitle={setNewTitle}
                                        prompt={newPrompt}
                                        setPrompt={setNewPrompt}
                                        onAdd={onAddPrompt}
                                    />
                                </div>

                                <PromptList
                                    agent={agent}
                                    prompts={prompts[agent]}
                                    paginatedPrompts={items}
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalCount={totalCount}
                                    selectedPrompts={selectedPrompts}
                                    setSelectedPrompts={setSelectedPrompts}
                                    truncateText={truncateText}
                                    setViewFullTextPrompt={setViewFullTextPrompt}
                                    openEditDialog={openEditDialog}
                                    setDeleteDialog={setDeleteDialog}
                                    onMoveUp={onMoveUp}
                                    onMoveDown={onMoveDown}
                                    onDragStart={onDragStart}
                                    onDragEnd={onDragEnd}
                                    onPageChange={setAgentPage}
                                    activeId={activeId}
                                    activeDragAgent={activeDragAgent}
                                />
                            </TabsContent>
                        )
                    })}
                </Tabs>
            </CardContent>
        </Card>
    )
}
