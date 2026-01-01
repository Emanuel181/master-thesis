"use client"

import * as React from "react"
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandShortcut,
} from "@/components/ui/command"
import { Keyboard } from "lucide-react"
import { formatShortcut } from "@/hooks/use-keyboard-shortcuts"

const shortcuts = [
    {
        category: "Navigation",
        items: [
            { keys: "mod+k", description: "Open command palette" },
            { keys: "mod+p", description: "Quick file switcher" },
            { keys: "mod+g", description: "Go to line" },
            { keys: "mod+1", description: "Go to Home" },
            { keys: "mod+2", description: "Go to Code Input" },
            { keys: "mod+3", description: "Go to Knowledge Base" },
            { keys: "mod+4", description: "Go to Results" },
            { keys: "mod+5", description: "Go to Profile" },
        ]
    },
    {
        category: "Editor",
        items: [
            { keys: "mod+s", description: "Save / Lock code" },
            { keys: "mod+z", description: "Undo" },
            { keys: "mod+shift+z", description: "Redo" },
            { keys: "mod+f", description: "Find in file" },
            { keys: "mod+h", description: "Find and replace" },
            { keys: "mod+/", description: "Toggle comment" },
            { keys: "mod+shift+f", description: "Format code" },
            { keys: "mod+=", description: "Zoom in" },
            { keys: "mod+-", description: "Zoom out" },
        ]
    },
    {
        category: "Actions",
        items: [
            { keys: "mod+shift+o", description: "Switch project (GitHub/GitLab)" },
            { keys: "mod+alt+n", description: "Open notifications" },
            { keys: "mod+shift+a", description: "Open workflow configuration" },
            { keys: "mod+shift+l", description: "Toggle dark/light mode" },
            { keys: "mod+,", description: "Open settings" },
            { keys: "esc", description: "Close dialog/panel" },
        ]
    },
    {
        category: "File Tree",
        items: [
            { keys: "mod+b", description: "Toggle file tree sidebar" },
            { keys: "mod+shift+e", description: "Focus file explorer" },
        ]
    },
]

export function KeyboardShortcutsDialog() {
    const [open, setOpen] = React.useState(false)

    // Listen for open-keyboard-shortcuts event
    React.useEffect(() => {
        const handler = () => setOpen(true)
        window.addEventListener("open-keyboard-shortcuts", handler)
        return () => window.removeEventListener("open-keyboard-shortcuts", handler)
    }, [])


    return (
        <CommandDialog 
            open={open} 
            onOpenChange={setOpen}
            title="Keyboard Shortcuts"
            description="Quick access to common actions"
        >
            <CommandInput placeholder="Search shortcuts..." />
            <CommandList className="max-h-[400px]">
                <CommandEmpty>
                    <div className="flex flex-col items-center gap-2 py-4">
                        <Keyboard className="h-8 w-8 opacity-40" />
                        <p>No shortcuts found.</p>
                    </div>
                </CommandEmpty>
                {shortcuts.map((section) => (
                    <CommandGroup key={section.category} heading={section.category}>
                        {section.items.map((shortcut) => (
                            <CommandItem
                                key={shortcut.keys}
                                value={`${shortcut.description} ${shortcut.keys}`}
                                className="cursor-default"
                            >
                                <span className="flex-1">{shortcut.description}</span>
                                <CommandShortcut>
                                    <kbd className="inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                                        {formatShortcut(shortcut.keys)}
                                    </kbd>
                                </CommandShortcut>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ))}
            </CommandList>
        </CommandDialog>
    )
}

export default KeyboardShortcutsDialog
