"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DescriptionDialog } from "./description-dialog";
import { Edit, Trash2, Eye } from "lucide-react";
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
                "cursor-pointer transition-all hover:shadow-md flex flex-col bg-card/80",
                isSelected
                    ? `ring-[3px] ring-primary/60 shadow-lg border-transparent`
                    : "ring-1 ring-border hover:ring-2 hover:ring-primary/30",
                colorClasses.class
            )}
            onClick={handleCardClick}
        >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
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
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
                <div className="text-xs text-muted-foreground break-words whitespace-pre-wrap flex-grow">
                    {displayDescription}
                </div>
                {isLongDescription && (
                    <div className="show-more-button-container mt-2 self-start">
                        <DescriptionDialog title={useCase.name} description={fullDescription}>
                            <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1">
                                <Eye className="h-3 w-3" />
                                View Full
                            </Button>
                        </DescriptionDialog>
                    </div>
                )}
                <div className="mt-2 text-xs font-semibold pt-2 border-t border-border/20">
                    {useCase.count} {useCase.count === 1 ? "document" : "documents"}
                </div>
            </CardContent>
        </Card>
    )
}