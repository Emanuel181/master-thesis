"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, Edit, Trash2, ChevronUp, ChevronDown, GripVertical } from "lucide-react"
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/**
 * Sortable prompt item component with drag-and-drop support.
 * Displays prompt info with actions for view, edit, delete, and reorder.
 */
export function SortablePromptItem({ 
    prompt, 
    agent, 
    selectedPrompts, 
    setSelectedPrompts, 
    truncateText, 
    setViewFullTextPrompt, 
    openEditDialog, 
    setDeleteDialog, 
    onMoveUp, 
    onMoveDown, 
    isFirst, 
    isLast 
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: prompt.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 200ms ease',
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1000 : 'auto',
        scale: isDragging ? 1.02 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group border border-border/50 rounded-lg p-2.5 hover:bg-accent/10 hover:border-primary/30 hover:shadow-sm transition-colors duration-200 cursor-pointer ${isDragging ? 'shadow-xl bg-background border-primary/50 ring-2 ring-primary/20' : ''}`}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1.5 -ml-1 hover:bg-accent/50 rounded-md touch-none select-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground/60" />
                    </div>
                    <Checkbox
                        className="h-3.5 w-3.5 rounded-sm border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        checked={selectedPrompts.has(`${agent}-${prompt.id}`)}
                        onCheckedChange={(checked) => {
                            setSelectedPrompts(prev => {
                                const newSet = new Set(prev)
                                if (checked) {
                                    newSet.add(`${agent}-${prompt.id}`)
                                } else {
                                    newSet.delete(`${agent}-${prompt.id}`)
                                }
                                return newSet
                            })
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0" onClick={() => setViewFullTextPrompt(prompt)}>
                        <h4 className="font-medium text-xs truncate text-foreground/90">{prompt.title || "Untitled"}</h4>
                        <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">{truncateText(prompt.text, 35)}</p>
                    </div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
                    {!isFirst && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-accent"
                            onClick={(e) => {
                                e.stopPropagation()
                                onMoveUp(prompt.id)
                            }}
                            title="Move up"
                        >
                            <ChevronUp className="h-3 w-3 text-muted-foreground" />
                        </Button>
                    )}
                    {!isLast && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-accent"
                            onClick={(e) => {
                                e.stopPropagation()
                                onMoveDown(prompt.id)
                            }}
                            title="Move down"
                        >
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-accent"
                        onClick={(e) => {
                            e.stopPropagation()
                            setViewFullTextPrompt(prompt)
                        }}
                        title="View"
                    >
                        <Eye className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-accent"
                        onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(agent, prompt)
                        }}
                        title="Edit"
                    >
                        <Edit className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                            e.stopPropagation()
                            setDeleteDialog({ type: 'single', agent, id: prompt.id })
                        }}
                        title="Delete"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
