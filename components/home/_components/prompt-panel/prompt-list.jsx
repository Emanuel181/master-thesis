"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, ChevronLeft, ChevronRight, GripVertical } from "lucide-react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortablePromptItem } from "./sortable-prompt-item"

/**
 * Prompt list component with drag-and-drop reordering.
 * Displays prompts for a specific agent with pagination.
 */
export function PromptList({
    agent,
    prompts,
    paginatedPrompts,
    currentPage,
    totalPages,
    totalCount,
    selectedPrompts,
    setSelectedPrompts,
    truncateText,
    setViewFullTextPrompt,
    openEditDialog,
    setDeleteDialog,
    onMoveUp,
    onMoveDown,
    onDragStart,
    onDragEnd,
    onPageChange,
    activeId,
    activeDragAgent,
}) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const startIndex = (currentPage - 1) * 5 // PROMPTS_PER_PAGE

    if (!prompts || prompts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    <Plus className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-xs text-muted-foreground">No prompts yet</p>
                <p className="text-[10px] text-muted-foreground/60">Click &ldquo;Add&rdquo; to create one</p>
            </div>
        )
    }

    return (
        <>
            <ScrollArea className="flex-1 min-h-0">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={(event) => onDragStart(event, agent)}
                    onDragEnd={(event) => onDragEnd(event, agent)}
                >
                    <SortableContext
                        items={paginatedPrompts.map(p => p.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-1.5 pr-2">
                            {paginatedPrompts.map((prompt, index) => (
                                <SortablePromptItem
                                    key={prompt.id}
                                    prompt={prompt}
                                    agent={agent}
                                    selectedPrompts={selectedPrompts}
                                    setSelectedPrompts={setSelectedPrompts}
                                    truncateText={truncateText}
                                    setViewFullTextPrompt={setViewFullTextPrompt}
                                    openEditDialog={openEditDialog}
                                    setDeleteDialog={setDeleteDialog}
                                    onMoveUp={(promptId) => onMoveUp(agent, promptId)}
                                    onMoveDown={(promptId) => onMoveDown(agent, promptId)}
                                    isFirst={startIndex + index === 0}
                                    isLast={startIndex + index === totalCount - 1}
                                />
                            ))}
                        </div>
                    </SortableContext>
                    <DragOverlay>
                        {activeId && activeDragAgent === agent ? (
                            <div className="border border-primary/50 rounded-lg p-2.5 bg-background shadow-xl ring-2 ring-primary/20">
                                <div className="flex items-center gap-2">
                                    <GripVertical className="h-4 w-4 text-muted-foreground/60" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-xs truncate text-foreground/90">
                                            {prompts?.find(p => p.id === activeId)?.title || "Untitled"}
                                        </h4>
                                        <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
                                            {truncateText(prompts?.find(p => p.id === activeId)?.text || "", 35)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </ScrollArea>

            {/* Pagination Controls */}
            <PromptPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
                agent={agent}
            />
        </>
    )
}

/**
 * Pagination controls for prompt list
 */
function PromptPagination({ currentPage, totalPages, onPageChange, agent }) {
    const showPagination = totalPages > 1

    return (
        <div className={`flex items-center justify-center gap-2 mt-3 pt-2 border-t flex-shrink-0 ${showPagination ? '' : 'invisible'}`}>
            <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onPageChange(agent, Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[60px] text-center">
                {currentPage} / {totalPages || 1}
            </span>
            <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onPageChange(agent, Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
