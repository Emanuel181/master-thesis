"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DescriptionDialog } from "./description-dialog";
import { Edit, Trash2 } from "lucide-react";

const MAX_DESC_WORDS = 20;

export function CategoryCard({ useCase, onSelect, isSelected, onEdit, onDelete }) {
    const words = useCase.description.split(/\s+/);
    const isLongDescription = words.length > MAX_DESC_WORDS;

    const description = isLongDescription
        ? `${words.slice(0, MAX_DESC_WORDS).join(" ")}...`
        : useCase.description;

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
            className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary shadow-lg" : "ring-1 ring-border"
            } flex flex-col`}
            onClick={handleCardClick}
        >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{useCase.name}</CardTitle>
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
                    {description}
                </div>
                {isLongDescription && (
                    <div className="show-more-button-container mt-2 self-start">
                        <DescriptionDialog title={useCase.name} description={useCase.description}>
                            <Button variant="link" size="sm" className="text-primary h-auto p-0">
                                Show More
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