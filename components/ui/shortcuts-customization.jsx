"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
    Keyboard,
    Search,
    X,
    AlertTriangle,
    RotateCcw,
    Info,
    Lightbulb,
} from "lucide-react"
import { toast } from "sonner"

// Storage key
const SHORTCUTS_STORAGE_KEY = 'vulniq_custom_shortcuts'
const SHORTCUT_HINTS_KEY = 'vulniq_shortcut_hints'
const KEYBINDING_PRESET_KEY = 'vulniq_keybinding_preset'

// Default shortcuts
const DEFAULT_SHORTCUTS = {
    'command-palette': { keys: 'mod+k', label: 'Open Command Palette', category: 'Navigation' },
    'quick-file-switcher': { keys: 'mod+p', label: 'Quick File Switcher', category: 'Navigation' },
    'go-to-line': { keys: 'mod+g', label: 'Go to Line', category: 'Editor' },
    'go-home': { keys: 'mod+1', label: 'Go to Home', category: 'Navigation' },
    'go-code': { keys: 'mod+2', label: 'Go to Code Input', category: 'Navigation' },
    'go-knowledge': { keys: 'mod+3', label: 'Go to Knowledge Base', category: 'Navigation' },
    'go-results': { keys: 'mod+4', label: 'Go to Results', category: 'Navigation' },
    'save': { keys: 'mod+s', label: 'Save / Lock Code', category: 'Editor' },
    'undo': { keys: 'mod+z', label: 'Undo', category: 'Editor' },
    'redo': { keys: 'mod+shift+z', label: 'Redo', category: 'Editor' },
    'find': { keys: 'mod+f', label: 'Find in File', category: 'Editor' },
    'replace': { keys: 'mod+h', label: 'Find and Replace', category: 'Editor' },
    'comment': { keys: 'mod+/', label: 'Toggle Comment', category: 'Editor' },
    'format': { keys: 'mod+shift+f', label: 'Format Code', category: 'Editor' },
    'zoom-in': { keys: 'mod+=', label: 'Zoom In', category: 'Editor' },
    'zoom-out': { keys: 'mod+-', label: 'Zoom Out', category: 'Editor' },
    'workflow': { keys: 'mod+w', label: 'Open Workflow', category: 'Actions' },
    'theme-toggle': { keys: 'mod+shift+l', label: 'Toggle Theme', category: 'Actions' },
    'settings': { keys: 'mod+,', label: 'Open Settings', category: 'Actions' },
    'toggle-sidebar': { keys: 'mod+b', label: 'Toggle Sidebar', category: 'View' },
    'focus-explorer': { keys: 'mod+shift+e', label: 'Focus File Explorer', category: 'View' },
}

// Vim preset overrides
const VIM_PRESET = {
    'command-palette': { keys: ':', label: 'Command Mode' },
    'save': { keys: ':w', label: 'Write/Save' },
    'undo': { keys: 'u', label: 'Undo' },
    'redo': { keys: 'ctrl+r', label: 'Redo' },
}

// Emacs preset overrides
const EMACS_PRESET = {
    'save': { keys: 'ctrl+x ctrl+s', label: 'Save' },
    'undo': { keys: 'ctrl+/', label: 'Undo' },
    'find': { keys: 'ctrl+s', label: 'Incremental Search' },
    'go-to-line': { keys: 'meta+g meta+g', label: 'Go to Line' },
}

const ShortcutsContext = React.createContext(null)

export function useShortcuts() {
    const context = React.useContext(ShortcutsContext)
    if (!context) {
        throw new Error("useShortcuts must be used within ShortcutsProvider")
    }
    return context
}

export function ShortcutsProvider({ children }) {
    const [customShortcuts, setCustomShortcuts] = React.useState({})
    const [hintsEnabled, setHintsEnabled] = React.useState(false)
    const [preset, setPreset] = React.useState('default')
    const [recentlyUsed, setRecentlyUsed] = React.useState([])

    // Load from localStorage
    React.useEffect(() => {
        try {
            const savedShortcuts = localStorage.getItem(SHORTCUTS_STORAGE_KEY)
            const savedHints = localStorage.getItem(SHORTCUT_HINTS_KEY)
            const savedPreset = localStorage.getItem(KEYBINDING_PRESET_KEY)

            if (savedShortcuts) setCustomShortcuts(JSON.parse(savedShortcuts))
            if (savedHints === 'true') setHintsEnabled(true)
            if (savedPreset) setPreset(savedPreset)
        } catch (e) {
            console.error('Failed to load shortcut settings:', e)
        }
    }, [])

    // Get effective shortcuts (custom overrides default)
    const shortcuts = React.useMemo(() => {
        let base = { ...DEFAULT_SHORTCUTS }

        // Apply preset
        if (preset === 'vim') {
            Object.entries(VIM_PRESET).forEach(([id, override]) => {
                if (base[id]) base[id] = { ...base[id], ...override }
            })
        } else if (preset === 'emacs') {
            Object.entries(EMACS_PRESET).forEach(([id, override]) => {
                if (base[id]) base[id] = { ...base[id], ...override }
            })
        }

        // Apply custom overrides
        Object.entries(customShortcuts).forEach(([id, keys]) => {
            if (base[id]) base[id] = { ...base[id], keys }
        })

        return base
    }, [customShortcuts, preset])

    // Detect conflicts
    const conflicts = React.useMemo(() => {
        const keyMap = {}
        const conflictList = []

        Object.entries(shortcuts).forEach(([id, { keys }]) => {
            const normalizedKey = keys.toLowerCase().replace(/\s/g, '')
            if (keyMap[normalizedKey]) {
                conflictList.push({
                    keys: normalizedKey,
                    ids: [keyMap[normalizedKey], id]
                })
            } else {
                keyMap[normalizedKey] = id
            }
        })

        return conflictList
    }, [shortcuts])

    // Update a shortcut
    const updateShortcut = React.useCallback((id, keys) => {
        setCustomShortcuts(prev => {
            const next = { ...prev, [id]: keys }
            try { localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(next)) } catch (e) {}
            return next
        })
    }, [])

    // Reset a shortcut to default
    const resetShortcut = React.useCallback((id) => {
        setCustomShortcuts(prev => {
            const next = { ...prev }
            delete next[id]
            try { localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(next)) } catch (e) {}
            return next
        })
    }, [])

    // Reset all shortcuts
    const resetAllShortcuts = React.useCallback(() => {
        setCustomShortcuts({})
        try { localStorage.setItem(SHORTCUTS_STORAGE_KEY, '{}') } catch (e) {}
    }, [])

    // Toggle hints
    const toggleHints = React.useCallback(() => {
        setHintsEnabled(prev => {
            const next = !prev
            try { localStorage.setItem(SHORTCUT_HINTS_KEY, String(next)) } catch (e) {}
            return next
        })
    }, [])

    // Change preset
    const changePreset = React.useCallback((newPreset) => {
        setPreset(newPreset)
        try { localStorage.setItem(KEYBINDING_PRESET_KEY, newPreset) } catch (e) {}
    }, [])

    // Track shortcut usage
    const trackUsage = React.useCallback((id) => {
        setRecentlyUsed(prev => {
            const filtered = prev.filter(i => i !== id)
            return [id, ...filtered].slice(0, 10)
        })
    }, [])

    // Get shortcut by ID
    const getShortcut = React.useCallback((id) => {
        return shortcuts[id]
    }, [shortcuts])

    // Format shortcut for display
    const formatShortcut = React.useCallback((keys) => {
        if (!keys) return ''
        const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
        return keys
            .replace(/mod/gi, isMac ? '⌘' : 'Ctrl')
            .replace(/ctrl/gi, isMac ? '⌃' : 'Ctrl')
            .replace(/alt/gi, isMac ? '⌥' : 'Alt')
            .replace(/shift/gi, isMac ? '⇧' : 'Shift')
            .replace(/\+/g, ' + ')
    }, [])

    const value = React.useMemo(() => ({
        shortcuts,
        customShortcuts,
        conflicts,
        hintsEnabled,
        preset,
        recentlyUsed,
        updateShortcut,
        resetShortcut,
        resetAllShortcuts,
        toggleHints,
        changePreset,
        trackUsage,
        getShortcut,
        formatShortcut,
    }), [
        shortcuts,
        customShortcuts,
        conflicts,
        hintsEnabled,
        preset,
        recentlyUsed,
        updateShortcut,
        resetShortcut,
        resetAllShortcuts,
        toggleHints,
        changePreset,
        trackUsage,
        getShortcut,
        formatShortcut,
    ])

    return (
        <ShortcutsContext.Provider value={value}>
            {children}
        </ShortcutsContext.Provider>
    )
}

// Shortcut hint toast component
export function ShortcutHint({ shortcutId, action }) {
    const { hintsEnabled, getShortcut, formatShortcut } = useShortcuts()

    React.useEffect(() => {
        if (!hintsEnabled) return

        const shortcut = getShortcut(shortcutId)
        if (shortcut) {
            toast.info(
                <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    <span>Tip: Use <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">{formatShortcut(shortcut.keys)}</kbd> for {action || shortcut.label}</span>
                </div>,
                { duration: 3000 }
            )
        }
    }, [hintsEnabled, shortcutId, action, getShortcut, formatShortcut])

    return null
}

// Key recorder component
function KeyRecorder({ value, onChange, onCancel }) {
    const [recording, setRecording] = React.useState(false)
    const inputRef = React.useRef(null)

    React.useEffect(() => {
        if (!recording) return

        const handleKeyDown = (e) => {
            e.preventDefault()

            const key = []
            if (e.ctrlKey || e.metaKey) key.push('mod')
            if (e.altKey) key.push('alt')
            if (e.shiftKey) key.push('shift')

            if (!['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
                key.push(e.key.toLowerCase())
            }

            if (key.length > 0 && key[key.length - 1] !== 'mod' && key[key.length - 1] !== 'alt' && key[key.length - 1] !== 'shift') {
                const shortcut = key.join('+')
                onChange(shortcut)
                setRecording(false)
            }
        }

        const handleKeyUp = (e) => {
            // Allow escape to cancel
            if (e.key === 'Escape') {
                setRecording(false)
                onCancel?.()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [recording, onChange, onCancel])

    return (
        <div className="relative">
            <Input
                ref={inputRef}
                value={recording ? 'Press keys...' : value}
                readOnly
                className={cn(
                    "font-mono text-sm cursor-pointer",
                    recording && "ring-2 ring-primary"
                )}
                onClick={() => setRecording(true)}
                onBlur={() => setRecording(false)}
            />
            {recording && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
                    <span className="text-xs text-muted-foreground animate-pulse">Press shortcut keys...</span>
                </div>
            )}
        </div>
    )
}

// Shortcut customization dialog
export function ShortcutCustomizationDialog({ open, onOpenChange }) {
    const {
        shortcuts,
        customShortcuts,
        conflicts,
        hintsEnabled,
        preset,
        updateShortcut,
        resetShortcut,
        resetAllShortcuts,
        toggleHints,
        changePreset,
        formatShortcut,
    } = useShortcuts()

    const [search, setSearch] = React.useState('')
    const [editingId, setEditingId] = React.useState(null)

    const categories = React.useMemo(() => {
        const cats = {}
        Object.entries(shortcuts).forEach(([id, shortcut]) => {
            const cat = shortcut.category || 'Other'
            if (!cats[cat]) cats[cat] = []
            cats[cat].push({ id, ...shortcut })
        })
        return cats
    }, [shortcuts])

    const filteredCategories = React.useMemo(() => {
        if (!search.trim()) return categories

        const searchLower = search.toLowerCase()
        const filtered = {}

        Object.entries(categories).forEach(([cat, items]) => {
            const matchingItems = items.filter(item =>
                item.label.toLowerCase().includes(searchLower) ||
                item.keys.toLowerCase().includes(searchLower) ||
                cat.toLowerCase().includes(searchLower)
            )
            if (matchingItems.length > 0) {
                filtered[cat] = matchingItems
            }
        })

        return filtered
    }, [categories, search])

    const hasCustomShortcuts = Object.keys(customShortcuts).length > 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Keyboard className="h-5 w-5" />
                        Customize Keyboard Shortcuts
                    </DialogTitle>
                    <DialogDescription>
                        Click on a shortcut to customize it. Press Escape to cancel.
                    </DialogDescription>
                </DialogHeader>

                {/* Settings row */}
                <div className="flex items-center justify-between gap-4 py-2 border-b">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="preset" className="text-xs">Preset:</Label>
                            <Select value={preset} onValueChange={changePreset}>
                                <SelectTrigger id="preset" className="w-[120px] h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">Default</SelectItem>
                                    <SelectItem value="vim">Vim</SelectItem>
                                    <SelectItem value="emacs">Emacs</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="hints"
                                checked={hintsEnabled}
                                onCheckedChange={toggleHints}
                            />
                            <Label htmlFor="hints" className="text-xs cursor-pointer">
                                Show hints
                            </Label>
                        </div>
                    </div>
                    {hasCustomShortcuts && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={resetAllShortcuts}
                        >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reset All
                        </Button>
                    )}
                </div>

                {/* Conflicts warning */}
                {conflicts.length > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-md text-xs text-yellow-600">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>
                            {conflicts.length} shortcut conflict{conflicts.length > 1 ? 's' : ''} detected
                        </span>
                    </div>
                )}

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search shortcuts..."
                        className="pl-9"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                    )}
                </div>

                {/* Shortcuts list */}
                <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="space-y-4 py-2">
                        {Object.entries(filteredCategories).map(([category, items]) => (
                            <div key={category}>
                                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                                    {category}
                                </h3>
                                <div className="space-y-1">
                                    {items.map((item) => {
                                        const isEditing = editingId === item.id
                                        const isCustomized = customShortcuts[item.id]
                                        const hasConflict = conflicts.some(c => c.ids.includes(item.id))

                                        return (
                                            <div
                                                key={item.id}
                                                className={cn(
                                                    "flex items-center justify-between p-2 rounded-md",
                                                    isEditing && "bg-accent",
                                                    hasConflict && "bg-yellow-500/10"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">{item.label}</span>
                                                    {isCustomized && (
                                                        <Badge variant="secondary" className="text-xs h-4">
                                                            Custom
                                                        </Badge>
                                                    )}
                                                    {hasConflict && (
                                                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <KeyRecorder
                                                                value={formatShortcut(item.keys)}
                                                                onChange={(keys) => {
                                                                    updateShortcut(item.id, keys)
                                                                    setEditingId(null)
                                                                }}
                                                                onCancel={() => setEditingId(null)}
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => setEditingId(null)}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <kbd
                                                                className="inline-flex h-7 items-center rounded border bg-muted px-2 font-mono text-xs cursor-pointer hover:bg-accent"
                                                                onClick={() => setEditingId(item.id)}
                                                            >
                                                                {formatShortcut(item.keys)}
                                                            </kbd>
                                                            {isCustomized && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7"
                                                                    onClick={() => resetShortcut(item.id)}
                                                                    title="Reset to default"
                                                                >
                                                                    <RotateCcw className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Click a shortcut to edit
                    </span>
                    <span>
                        {Object.keys(customShortcuts).length} customized
                    </span>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ShortcutsProvider

