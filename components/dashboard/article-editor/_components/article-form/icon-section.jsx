"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, ChevronLeft, ChevronRight, Smile, Plus, Check, X, Pipette } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { IconDisplay } from "./icon-display"
import { CollapsibleSection } from "./collapsible-section"

const CUSTOM_COLORS_KEY = "vulniq-custom-icon-colors"

function loadCustomColors() {
    try {
        const saved = localStorage.getItem(CUSTOM_COLORS_KEY)
        return saved ? JSON.parse(saved) : []
    } catch {
        return []
    }
}

function saveCustomColors(colors) {
    try {
        localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(colors))
    } catch {
        // localStorage not available
    }
}

function getContrastBg(hex) {
    // Determine if we need light or dark bg behind the icon based on color luminance
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.6 ? "bg-white/40" : "bg-black/40"
}

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
    const [customColors, setCustomColors] = useState([])
    const [pickerColor, setPickerColor] = useState("#06b6d4")
    const [pickerOpen, setPickerOpen] = useState(false)

    // Load custom colors from localStorage on mount
    useEffect(() => {
        setCustomColors(loadCustomColors())
    }, [])

    const addCustomColor = useCallback(() => {
        const hex = pickerColor.toLowerCase()
        // Prevent duplicates
        if (customColors.some((c) => c.value === hex)) return
        if (iconColors.some((c) => c.value === hex)) return

        const newColor = {
            id: `custom-${hex}`,
            label: hex.toUpperCase(),
            value: hex,
            bg: getContrastBg(hex),
        }
        const updated = [...customColors, newColor]
        setCustomColors(updated)
        saveCustomColors(updated)
        updateField("iconColor", newColor.id)
        setPickerOpen(false)
    }, [pickerColor, customColors, iconColors, updateField])

    const removeCustomColor = useCallback((colorId) => {
        const updated = customColors.filter((c) => c.id !== colorId)
        setCustomColors(updated)
        saveCustomColors(updated)
        // If the removed color was selected, revert to white
        if (formState.iconColor === colorId) {
            updateField("iconColor", "white")
        }
    }, [customColors, formState.iconColor, updateField])

    // All colors: presets + custom
    const allColors = [...iconColors, ...customColors]

    // Find currently selected color to show in the preview
    const selectedColor = allColors.find((c) => c.id === formState.iconColor)

    return (
        <CollapsibleSection
            title="Article Icon"
            description="Select an icon to display on your article cover"
            icon={Smile}
            defaultOpen={false}
        >
            <div className="space-y-4">
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
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs text-muted-foreground">Color</Label>
                                    {selectedColor && (
                                        <div className="flex items-center gap-1.5">
                                            <div
                                                className="h-3 w-3 rounded-full ring-1 ring-border"
                                                style={{ backgroundColor: selectedColor.value }}
                                            />
                                            <span className="text-[10px] text-muted-foreground">
                                                {selectedColor.label}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {/* Preset colors */}
                                <div className="grid grid-cols-6 gap-2 p-0.5">
                                    {iconColors.slice(0, 12).map((color) => (
                                        <ColorSwatch
                                            key={color.id}
                                            color={color}
                                            isSelected={formState.iconColor === color.id}
                                            onClick={() => updateField("iconColor", color.id)}
                                            disabled={!canEdit}
                                        />
                                    ))}
                                </div>
                                <div className="grid grid-cols-6 gap-2 p-0.5">
                                    {iconColors.slice(12).map((color) => (
                                        <ColorSwatch
                                            key={color.id}
                                            color={color}
                                            isSelected={formState.iconColor === color.id}
                                            onClick={() => updateField("iconColor", color.id)}
                                            disabled={!canEdit}
                                        />
                                    ))}
                                </div>

                                {/* Custom colors row */}
                                {customColors.length > 0 && (
                                    <>
                                        <Label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                                            Custom
                                        </Label>
                                        <div className="grid grid-cols-6 gap-2 p-0.5">
                                            {customColors.map((color) => (
                                                <ColorSwatch
                                                    key={color.id}
                                                    color={color}
                                                    isSelected={formState.iconColor === color.id}
                                                    onClick={() => updateField("iconColor", color.id)}
                                                    disabled={!canEdit}
                                                    onRemove={() => removeCustomColor(color.id)}
                                                    removable
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Add custom color */}
                                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                                    <PopoverTrigger asChild>
                                        <button
                                            className={cn(
                                                "flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors",
                                                "px-2 py-1.5 rounded-md hover:bg-muted",
                                                !canEdit && "opacity-50 pointer-events-none"
                                            )}
                                            disabled={!canEdit}
                                        >
                                            <Plus className="h-3 w-3" />
                                            Add custom color
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3 space-y-3" align="start">
                                        <Label className="text-xs font-medium">Pick a color</Label>
                                        <div className="space-y-2">
                                            <input
                                                type="color"
                                                value={pickerColor}
                                                onChange={(e) => setPickerColor(e.target.value)}
                                                className="w-full h-32 rounded-lg cursor-pointer border border-border bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-lg [&::-moz-color-swatch]:border-none"
                                            />
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-8 w-8 rounded-md ring-1 ring-border shrink-0"
                                                    style={{ backgroundColor: pickerColor }}
                                                />
                                                <Input
                                                    value={pickerColor}
                                                    onChange={(e) => {
                                                        const val = e.target.value
                                                        if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                                                            setPickerColor(val)
                                                        }
                                                    }}
                                                    placeholder="#000000"
                                                    className="h-8 font-mono text-xs"
                                                    maxLength={7}
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="w-full"
                                            onClick={addCustomColor}
                                            disabled={!/^#[0-9a-fA-F]{6}$/.test(pickerColor)}
                                        >
                                            <Pipette className="h-3.5 w-3.5 mr-1.5" />
                                            Save color
                                        </Button>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </CollapsibleSection>
    )
}

/**
 * ColorSwatch - Individual color button with checkmark selection indicator
 */
function ColorSwatch({ color, isSelected, onClick, disabled, removable, onRemove }) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        className={cn(
                            "relative h-7 w-full rounded-md transition-all group",
                            isSelected
                                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                : "ring-1 ring-border/30 hover:ring-2 hover:ring-border"
                        )}
                        style={{ backgroundColor: color.value }}
                        onClick={onClick}
                        disabled={disabled}
                    >
                        {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/20">
                                <Check className="h-3 w-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                            </div>
                        )}
                        {removable && !isSelected && (
                            <div
                                className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onRemove?.()
                                }}
                            >
                                <X className="h-2 w-2" />
                            </div>
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent side="top">{color.label}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
