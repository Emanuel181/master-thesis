"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Search, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * SearchInput - A search input with clear button, loading state, and keyboard hint
 */
export function SearchInput({
    value,
    onChange,
    onClear,
    placeholder = "Search...",
    className,
    inputClassName,
    loading = false,
    shortcutHint,
    autoFocus = false,
    disabled = false,
    ...props
}) {
    const inputRef = React.useRef(null)

    const handleClear = React.useCallback(() => {
        onChange?.({ target: { value: "" } })
        onClear?.()
        inputRef.current?.focus()
    }, [onChange, onClear])

    // Handle keyboard shortcut to focus
    React.useEffect(() => {
        if (!shortcutHint) return

        const handleKeyDown = (e) => {
            // Check for shortcut match (e.g., "mod+f" or "/")
            if (shortcutHint === "/" && e.key === "/" && !e.ctrlKey && !e.metaKey) {
                const target = e.target
                const isInput = target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable

                if (!isInput) {
                    e.preventDefault()
                    inputRef.current?.focus()
                }
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [shortcutHint])

    return (
        <div className={cn("relative", className)}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
                ref={inputRef}
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={cn(
                    "pl-9 pr-9",
                    shortcutHint && !value && "pr-16",
                    inputClassName
                )}
                autoFocus={autoFocus}
                disabled={disabled || loading}
                {...props}
            />

            {/* Right side - loading, clear button, or shortcut hint */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {loading ? (
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                ) : value ? (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-0.5 hover:bg-accent rounded-sm transition-colors"
                        title="Clear search"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                ) : shortcutHint ? (
                    <kbd className="hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                        {shortcutHint}
                    </kbd>
                ) : null}
            </div>
        </div>
    )
}

/**
 * SearchInputWithResults - SearchInput with integrated empty/results state
 */
export function SearchInputWithResults({
    value,
    onChange,
    onClear,
    placeholder,
    loading,
    shortcutHint,
    results,
    emptyMessage = "No results found",
    emptyIcon: EmptyIcon,
    children,
    className,
    ...props
}) {
    const hasResults = results && results.length > 0
    const hasSearch = value && value.trim().length > 0

    return (
        <div className={cn("space-y-2", className)}>
            <SearchInput
                value={value}
                onChange={onChange}
                onClear={onClear}
                placeholder={placeholder}
                loading={loading}
                shortcutHint={shortcutHint}
                {...props}
            />

            {loading ? (
                <div className="py-8 text-center">
                    <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Searching...</p>
                </div>
            ) : hasSearch && !hasResults ? (
                <div className="py-8 text-center text-muted-foreground">
                    {EmptyIcon && <EmptyIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />}
                    <p className="text-sm">{emptyMessage}</p>
                    {value && (
                    <p className="text-xs mt-1 opacity-70">
                        No matches for &ldquo;{value}&rdquo;
                    </p>
                    )}
                </div>
            ) : (
                children
            )}
        </div>
    )
}

export default SearchInput

