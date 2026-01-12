"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * SearchInput - Reusable search input with icon
 * 
 * @param {string} value - Current search value
 * @param {function} onChange - Callback when value changes
 * @param {string} [placeholder="Search..."] - Placeholder text
 * @param {string} [className] - Additional CSS classes for the container
 * @param {string} [inputClassName] - Additional CSS classes for the input
 * @param {string} [size="default"] - Size variant: "sm" | "default"
 * @param {boolean} [showClear=false] - Whether to show clear button when value exists
 * @param {function} [onClear] - Callback when clear button is clicked
 * @param {boolean} [disabled=false] - Whether the input is disabled
 */
export function SearchInput({
    value,
    onChange,
    placeholder = "Search...",
    className,
    inputClassName,
    size = "default",
    showClear = false,
    onClear,
    disabled = false,
}) {
    const handleChange = (e) => {
        onChange(e.target.value)
    }

    const handleClear = () => {
        onChange("")
        onClear?.()
    }

    const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"
    const inputHeight = size === "sm" ? "h-7" : "h-8"
    const inputPadding = size === "sm" ? "pl-7" : "pl-8"
    const textSize = size === "sm" ? "text-[10px]" : "text-xs"
    const iconLeft = size === "sm" ? "left-2" : "left-2.5"

    return (
        <div className={cn("relative", className)}>
            <Search 
                className={cn(
                    "absolute top-1/2 -translate-y-1/2 text-muted-foreground/50",
                    iconSize,
                    iconLeft
                )} 
            />
            <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                disabled={disabled}
                className={cn(
                    inputHeight,
                    inputPadding,
                    textSize,
                    showClear && value && "pr-8",
                    inputClassName
                )}
            />
            {showClear && value && (
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0",
                        "hover:bg-muted/50"
                    )}
                    onClick={handleClear}
                    disabled={disabled}
                    aria-label="Clear search"
                >
                    <X className="h-3 w-3 text-muted-foreground" />
                </Button>
            )}
        </div>
    )
}
