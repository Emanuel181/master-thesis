"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DescriptionDialog } from "./description-dialog";
import { Edit, Trash2, Eye, FileText, RefreshCw, Shield, Database, Lock, Code, Bug, Server, Globe, Key, MoreHorizontal } from "lucide-react";
import { getCategoryColorClasses } from "./add-category-dialog";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MAX_DESC_WORDS = 15;

// Helper to truncate text (fallback if backend doesn't provide shortDescription)
const truncateDescription = (text, maxWords = MAX_DESC_WORDS) => {
    if (!text) return '';
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    return `${words.slice(0, maxWords).join(" ")}...`;
};

// Get an appropriate icon based on category name
const getCategoryIcon = (name) => {
    const lowerName = name?.toLowerCase() || '';
    if (lowerName.includes('sql') || lowerName.includes('injection')) return Database;
    if (lowerName.includes('xss') || lowerName.includes('script')) return Code;
    if (lowerName.includes('auth')) return Key;
    if (lowerName.includes('api') || lowerName.includes('server')) return Server;
    if (lowerName.includes('web') || lowerName.includes('http')) return Globe;
    if (lowerName.includes('vuln') || lowerName.includes('bug')) return Bug;
    if (lowerName.includes('secure') || lowerName.includes('encrypt')) return Lock;
    return Shield; // Default security icon
};

export function CategoryCard({ useCase, onSelect, isSelected, onEdit, onDelete, onRefresh, isRefreshing, isChecked, onCheckChange, allSelectedIds = [] }) {
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Use backend-provided shortDescription if available, otherwise truncate
    const fullDescription = useCase.fullDescription || useCase.description || '';
    const displayDescription = useCase.shortDescription || truncateDescription(fullDescription);
    const isLongDescription = fullDescription.length > displayDescription.length ||
        (fullDescription.split(/\s+/).length > MAX_DESC_WORDS);

    // Get color classes
    const colorClasses = getCategoryColorClasses(useCase.color || 'default');
    
    // Get category icon
    const CategoryIcon = getCategoryIcon(useCase.name);

    const handleCardClick = (e) => {
        // Prevent card selection if the click is on buttons or 'Show More' button's container
        if (e.target.closest('.action-button') || e.target.closest('.show-more-button-container') || e.target.closest('.checkbox-container')) {
            e.stopPropagation();
            return;
        }
        onSelect(useCase.id);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        onEdit(useCase);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(useCase);
    };

    const handleRefresh = (e) => {
        e.stopPropagation();
        onRefresh?.(useCase);
    };

    // Drag handlers
    const handleDragStart = (e) => {
        setIsDragging(true);

        // If this card is checked and there are multiple selections, drag all selected items
        // Otherwise just drag this single item
        const idsToMove = (isChecked && allSelectedIds.length > 1)
            ? allSelectedIds
            : [useCase.id];

        e.dataTransfer.setData("application/json", JSON.stringify({
            useCaseIds: idsToMove,
        }));
        e.dataTransfer.effectAllowed = "move";

        // Set a custom drag image or text
        if (idsToMove.length > 1) {
            const dragImage = document.createElement('div');
            dragImage.textContent = `Moving ${idsToMove.length} items`;
            dragImage.style.cssText = 'position: absolute; top: -1000px; background: hsl(var(--primary)); color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px;';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            setTimeout(() => document.body.removeChild(dragImage), 0);
        }
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    return (
        <Card
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={cn(
                "group cursor-pointer transition-all duration-200 bg-card relative overflow-hidden",
                isSelected
                    ? `shadow-md shadow-primary/5 border-primary`
                    : "border hover:border-primary/30 hover:shadow-sm",
                colorClasses.class,
                isDragging && "opacity-60 scale-[0.98] shadow-lg ring-2 ring-primary/50 cursor-grabbing",
                isChecked && !isDragging && "ring-2 ring-primary"
            )}
            onClick={handleCardClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Checkbox for multi-select - absolute top-left */}
            {onCheckChange && (
                <div
                    className={cn(
                        "checkbox-container absolute left-2 top-2 z-10 transition-opacity",
                        isHovered || isChecked ? "opacity-100" : "opacity-0"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => onCheckChange(useCase.id, checked)}
                        className="h-4 w-4 bg-background border-2"
                    />
                </div>
            )}

            {/* Actions - absolute top-right */}
            <div className="absolute right-2 top-2 z-10 flex items-center">
                {/* Inline buttons - visible on wider cards (md and up) */}
                <div className="hidden md:flex items-center gap-0.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="action-button h-7 w-7 text-muted-foreground hover:text-primary hover:bg-background/80"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="action-button h-7 w-7 text-muted-foreground hover:text-primary hover:bg-background/80"
                        onClick={handleEdit}
                    >
                        <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="action-button h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-background/80"
                        onClick={handleDelete}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>

                {/* Dropdown menu - visible on narrower cards (below md) */}
                <div className="md:hidden">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="action-button h-7 w-7 text-muted-foreground hover:text-primary hover:bg-background/80"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
                                <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                                Refresh
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleEdit}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <CardHeader className={cn("pb-2 pt-3 px-3 pr-12 md:pr-24", onCheckChange && "pl-8")}>
                {/* Icon + Title row */}
                <div className="flex items-center gap-2 mb-1 w-full">
                    <div className={cn(
                        "shrink-0 p-1.5 rounded-lg transition-colors",
                        isSelected
                            ? "bg-primary/15 text-primary"
                            : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary/80"
                    )}>
                        <CategoryIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                            {useCase.color && useCase.color !== 'default' && (
                                <div className={cn(
                                    "h-2 w-2 rounded-full shrink-0",
                                    colorClasses.ring.replace('ring-', 'bg-')
                                )} />
                            )}
                            <p className="text-sm font-semibold truncate">{useCase.name}</p>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {displayDescription && (
                    <CardDescription className="text-xs line-clamp-2 leading-relaxed">
                        {displayDescription}
                    </CardDescription>
                )}
            </CardHeader>

            <CardFooter className="pt-0 pb-3 px-3 flex-wrap gap-2">
                {/* Stats badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge
                        variant="secondary"
                        className={cn(
                            "text-[10px] gap-1 px-2 py-0.5 font-medium",
                            isSelected && "bg-primary/10 text-primary border-primary/20"
                        )}
                    >
                        <FileText className="h-3 w-3" />
                        {useCase.pdfCount ?? useCase.count ?? 0}
                    </Badge>
                    {useCase.formattedTotalSize && (
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-[10px] px-2 py-0.5 font-medium",
                                isSelected && "border-primary/30 text-primary/80"
                            )}
                        >
                            {useCase.formattedTotalSize}
                        </Badge>
                    )}
                </div>

                {/* View full button */}
                {isLongDescription && (
                    <div className="show-more-button-container">
                        <DescriptionDialog title={useCase.name} description={fullDescription}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-primary"
                            >
                                <Eye className="h-3 w-3" />
                                View full description
                            </Button>
                        </DescriptionDialog>
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}