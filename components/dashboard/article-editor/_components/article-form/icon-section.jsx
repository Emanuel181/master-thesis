"use client"

import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { IconDisplay } from "./icon-display"

/**
 * IconSection - Icon selection with position and color options
 */
export function IconSection({
    formState,
    updateField,
    canEdit,
    iconSearch,
    setIconSearch,
    iconPage,
    setIconPage,
    paginatedIcons,
    totalIconPages,
    iconPositions,
    iconColors,
    onToggleIcon,
}) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">Article Icon</CardTitle>
                <CardDescription className="text-xs">
                    Select an icon to display on your article cover
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search icons..."
                        value={iconSearch}
                        onChange={(e) => setIconSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                    {paginatedIcons.map((icon) => (
                        <TooltipProvider key={icon.name}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={formState.iconName === icon.name ? "default" : "outline"}
                                        size="icon"
                                        className={cn(
                                            "h-11 w-full",
                                            formState.iconName === icon.name && "ring-2 ring-primary/20"
                                        )}
                                        onClick={() => onToggleIcon(icon.name)}
                                        disabled={!canEdit}
                                    >
                                        <IconDisplay name={icon.name} className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{icon.name}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                </div>
                {totalIconPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setIconPage((p) => Math.max(1, p - 1))}
                            disabled={iconPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                            {iconPage} / {totalIconPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setIconPage((p) => Math.min(totalIconPages, p + 1))}
                            disabled={iconPage === totalIconPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Icon Position & Color Selector - only shown when icon is selected */}
                {formState.iconName && (
                    <>
                        <Separator />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Icon Position */}
                            <div className="space-y-3">
                                <Label className="text-xs text-muted-foreground">Position</Label>
                                <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-lg">
                                    {iconPositions.map((pos) => (
                                        <TooltipProvider key={pos.id}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        className={cn(
                                                            "h-8 w-full rounded-md transition-all flex",
                                                            pos.class,
                                                            "p-1",
                                                            formState.iconPosition === pos.id
                                                                ? "bg-background shadow-sm ring-2 ring-primary"
                                                                : "hover:bg-background/50"
                                                        )}
                                                        onClick={() => updateField("iconPosition", pos.id)}
                                                        disabled={!canEdit}
                                                    >
                                                        <div
                                                            className={cn(
                                                                "w-2 h-2 rounded-full transition-colors",
                                                                formState.iconPosition === pos.id
                                                                    ? "bg-primary"
                                                                    : "bg-muted-foreground/40"
                                                            )}
                                                        />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">{pos.label}</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                                </div>
                            </div>

                            {/* Icon Color */}
                            <div className="space-y-3">
                                <Label className="text-xs text-muted-foreground">Color</Label>
                                <div className="grid grid-cols-6 gap-1.5">
                                    {iconColors.slice(0, 12).map((color) => (
                                        <TooltipProvider key={color.id}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        className={cn(
                                                            "h-7 w-full rounded-md transition-all border-2",
                                                            formState.iconColor === color.id
                                                                ? "border-primary ring-2 ring-primary/20 scale-110"
                                                                : "border-transparent hover:scale-105"
                                                        )}
                                                        style={{ backgroundColor: color.value }}
                                                        onClick={() => updateField("iconColor", color.id)}
                                                        disabled={!canEdit}
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent side="top">{color.label}</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                                </div>
                                <div className="grid grid-cols-6 gap-1.5">
                                    {iconColors.slice(12).map((color) => (
                                        <TooltipProvider key={color.id}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        className={cn(
                                                            "h-7 w-full rounded-md transition-all border-2",
                                                            formState.iconColor === color.id
                                                                ? "border-primary ring-2 ring-primary/20 scale-110"
                                                                : "border-transparent hover:scale-105"
                                                        )}
                                                        style={{ backgroundColor: color.value }}
                                                        onClick={() => updateField("iconColor", color.id)}
                                                        disabled={!canEdit}
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent side="top">{color.label}</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
