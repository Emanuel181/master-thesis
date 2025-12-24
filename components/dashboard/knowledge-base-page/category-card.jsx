"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DescriptionDialog } from "./description-dialog";
import { Edit, Trash2, Eye, FileText } from "lucide-react";
import { getCategoryColorClasses } from "./add-category-dialog";
import { cn } from "@/lib/utils";

const MAX_DESC_WORDS = 20;

// Helper to truncate text (fallback if backend doesn't provide shortDescription)
const truncateDescription = (text, maxWords = MAX_DESC_WORDS) => {
    if (!text) return '';
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    return `${words.slice(0, maxWords).join(" ")}...`;
};

export function CategoryCard({ useCase, onSelect, isSelected, onEdit, onDelete }) {
    // Use backend-provided shortDescription if available, otherwise truncate
    const fullDescription = useCase.fullDescription || useCase.description || '';
    const displayDescription = useCase.shortDescription || truncateDescription(fullDescription);
    const isLongDescription = fullDescription.length > displayDescription.length ||
        (fullDescription.split(/\s+/).length > MAX_DESC_WORDS);

    // Get color classes
    const colorClasses = getCategoryColorClasses(useCase.color || 'default');

    const handleCardClick = (e) => {
        // Prevent card selection if the click is on buttons or 'Show More' button's container
        if (e.target.closest('.action-button') || e.target.closest('.show-more-button-container')) {
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

    return (
        <Card
            className={cn(
                "cursor-pointer transition-all hover:shadow-md bg-zinc-900/90 dark:bg-zinc-900/90 border-zinc-800",
                isSelected
                    ? `ring-[3px] ring-primary/60 shadow-lg border-transparent`
                    : "ring-1 ring-zinc-700/50 hover:ring-2 hover:ring-primary/30",
                colorClasses.class
            )}
            onClick={handleCardClick}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        {/* Color indicator dot */}
                        {useCase.color && useCase.color !== 'default' && (
                            <div className={cn(
                                "h-2.5 w-2.5 rounded-full shrink-0",
                                colorClasses.ring.replace('ring-', 'bg-')
                            )} />
                        )}
                        <CardTitle className="text-sm font-medium">{useCase.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="action-button h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={handleEdit}
                        >
                            <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="action-button h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                        {useCase.icon && <div className="text-muted-foreground ml-1">{useCase.icon}</div>}
                    </div>
                </div>
                {displayDescription && (
                    <CardDescription className="text-xs break-words whitespace-pre-wrap line-clamp-3">
                        {displayDescription}
                    </CardDescription>
                )}
            </CardHeader>

            <CardContent className="pb-2">
                {isLongDescription && (
                    <div className="show-more-button-container">
                        <DescriptionDialog title={useCase.name} description={fullDescription}>
                            <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1">
                                <Eye className="h-3 w-3" />
                                View Full
                            </Button>
                        </DescriptionDialog>
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-2 border-t border-border/30">
                <div className="flex items-center gap-2 w-full">
                    <Badge variant="secondary" className="text-xs gap-1">
                        <FileText className="h-3 w-3" />
                        {useCase.count} {useCase.count === 1 ? "document" : "documents"}
                    </Badge>
                    {useCase.formattedTotalSize && (
                        <Badge variant="outline" className="text-xs">
                            {useCase.formattedTotalSize}
                        </Badge>
                    )}
                </div>
            </CardFooter>
        </Card>
    )
}