"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DescriptionDialog } from "./description-dialog";
import { Edit, Trash2, Eye, FileText, RefreshCw, Shield, Database, Lock, Code, Bug, Server, Globe, Key } from "lucide-react";
import { getCategoryColorClasses } from "./add-category-dialog";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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

export function CategoryCard({ useCase, onSelect, isSelected, onEdit, onDelete, onRefresh, isRefreshing }) {
    const [isHovered, setIsHovered] = useState(false);
    
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

    const handleRefresh = (e) => {
        e.stopPropagation();
        onRefresh?.(useCase);
    };

    return (
        <Card
            className={cn(
                "group cursor-pointer transition-all duration-200 bg-card relative",
                isSelected
                    ? `shadow-md shadow-primary/5 border-primary`
                    : "border hover:border-primary/30 hover:shadow-sm",
                colorClasses.class
            )}
            onClick={handleCardClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <CardHeader className="pb-3 pt-4">
                <div className="flex items-start justify-between gap-2">
                    {/* Left: Icon + Title */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Category Icon */}
                        <div className={cn(
                            "shrink-0 p-2 rounded-lg transition-colors",
                            isSelected 
                                ? "bg-primary/15 text-primary" 
                                : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary/80"
                        )}>
                            <CategoryIcon className="h-4 w-4" />
                        </div>
                        
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                {/* Color indicator dot */}
                                {useCase.color && useCase.color !== 'default' && (
                                    <div className={cn(
                                        "h-2 w-2 rounded-full shrink-0",
                                        colorClasses.ring.replace('ring-', 'bg-')
                                    )} />
                                )}
                                <CardTitle className="text-sm font-semibold truncate leading-tight">
                                    {useCase.name}
                                </CardTitle>
                            </div>
                            {displayDescription && (
                                <CardDescription className="text-xs break-words whitespace-pre-wrap line-clamp-2 mt-1.5 leading-relaxed">
                                    {displayDescription}
                                </CardDescription>
                            )}
                        </div>
                    </div>
                    
                    {/* Right: Action buttons - show on hover or when selected */}
                    <div className={cn(
                        "flex items-center gap-0.5 transition-opacity shrink-0",
                        isHovered || isSelected ? "opacity-100" : "opacity-0"
                    )}>
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="action-button h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                    >
                                        <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">Refresh</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="action-button h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                        onClick={handleEdit}
                                    >
                                        <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">Edit</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="action-button h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        onClick={handleDelete}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">Delete</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardHeader>

            <CardFooter className="pt-0 pb-3 px-4">
                <div className="flex items-center justify-between w-full gap-2">
                    {/* Stats badges */}
                    <div className="flex items-center gap-1.5">
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
                </div>
            </CardFooter>
        </Card>
    )
}