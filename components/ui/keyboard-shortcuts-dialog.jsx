"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandShortcut,
} from "@/components/ui/command"
import { Keyboard, ChevronRight } from "lucide-react"
import { formatShortcut } from "@/hooks/use-keyboard-shortcuts"
import { useIsMobile } from "@/hooks/use-mobile"

const shortcuts = [
    {
        category: "Navigation",
        items: [
            { keys: "mod+k", description: "Open command palette", action: "command-palette" },
            { keys: "mod+p", description: "Quick file switcher", action: "file-switcher" },
            { keys: "mod+g", description: "Go to line", action: "go-to-line" },
            { keys: "mod+1", description: "Go to home", action: "navigate-home" },
            { keys: "mod+2", description: "Go to code Input", action: "navigate-code" },
            { keys: "mod+3", description: "Go to knowledge Base", action: "navigate-kb" },
            { keys: "mod+4", description: "Go to results", action: "navigate-results" },
            { keys: "mod+5", description: "Go to profile", action: "navigate-profile" },
            { keys: "mod+6", description: "Go to write article", action: "navigate-article" },
        ]
    },
    {
        category: "Editor",
        items: [
            { keys: "mod+s", description: "Save / Lock code", action: "save" },
            { keys: "mod+z", description: "Undo", action: "undo" },
            { keys: "mod+shift+z", description: "Redo", action: "redo" },
            { keys: "mod+f", description: "Find in file", action: "find" },
            { keys: "mod+h", description: "Find and replace", action: "replace" },
            { keys: "mod+/", description: "Toggle comment", action: "comment" },
            { keys: "mod+shift+f", description: "Format code", action: "format" },
            { keys: "mod+=", description: "Zoom in", action: "zoom-in" },
            { keys: "mod+-", description: "Zoom out", action: "zoom-out" },
        ]
    },
    {
        category: "Article editor",
        items: [
            { keys: "mod+s", description: "Save article draft", action: "save-article" },
            { keys: "mod+enter", description: "Submit for review", action: "submit-article" },
            { keys: "/", description: "Slash commands menu", action: "slash-commands" },
            { keys: "mod+b", description: "Bold text", action: "bold" },
            { keys: "mod+i", description: "Italic text", action: "italic" },
            { keys: "mod+u", description: "Underline text", action: "underline" },
            { keys: "mod+shift+s", description: "Strikethrough", action: "strikethrough" },
            { keys: "mod+shift+h", description: "Highlight", action: "highlight" },
            { keys: "mod+shift+7", description: "Numbered list", action: "numbered-list" },
            { keys: "mod+shift+8", description: "Bullet list", action: "bullet-list" },
        ]
    },
    {
        category: "Actions",
        items: [
            { keys: "mod+shift+o", description: "Switch project (GitHub/GitLab)", action: "switch-project" },
            { keys: "mod+alt+n", description: "Open notifications", action: "notifications" },
            { keys: "mod+shift+a", description: "Open workflow configuration", action: "workflow" },
            { keys: "mod+shift+l", description: "Toggle dark/light mode", action: "theme-toggle" },
            { keys: "mod+,", description: "Open settings", action: "settings" },
            { keys: "esc", description: "Close dialog/panel", action: "close" },
        ]
    },
    {
        category: "File tree",
        items: [
            { keys: "mod+b", description: "Toggle file tree sidebar", action: "toggle-sidebar" },
            { keys: "mod+shift+e", description: "Focus file explorer", action: "focus-explorer" },
        ]
    },
]

export function KeyboardShortcutsDialog() {
    const [open, setOpen] = React.useState(false)
    const isMobile = useIsMobile()
    const router = useRouter()

    // Listen for open-keyboard-shortcuts event
    React.useEffect(() => {
        const handler = () => setOpen(true)
        window.addEventListener("open-keyboard-shortcuts", handler)
        return () => window.removeEventListener("open-keyboard-shortcuts", handler)
    }, [])

    // Execute action on mobile tap
    const handleAction = React.useCallback((action) => {
        setOpen(false)

        // Small delay to allow dialog to close
        setTimeout(() => {
            switch (action) {
                case "command-palette":
                    window.dispatchEvent(new CustomEvent("open-command-palette"))
                    break
                case "navigate-home":
                    router.push("/dashboard?active=Home")
                    break
                case "navigate-code":
                    router.push("/dashboard?active=Code input")
                    break
                case "navigate-kb":
                    router.push("/dashboard?active=Knowledge base")
                    break
                case "navigate-results":
                    router.push("/dashboard?active=Results")
                    break
                case "navigate-profile":
                    router.push("/profile")
                    break
                case "navigate-article":
                    router.push("/dashboard?active=Write article")
                    break
                case "theme-toggle":
                    document.documentElement.classList.toggle("dark")
                    break
                case "settings":
                    window.dispatchEvent(new CustomEvent("open-settings"))
                    break
                case "notifications":
                    window.dispatchEvent(new CustomEvent("open-notifications"))
                    break
                case "workflow":
                    window.dispatchEvent(new CustomEvent("open-workflow"))
                    break
                default:
                    // Other actions may require editor context
                    break
            }
        }, 100)
    }, [router])


    return (
        <CommandDialog 
            open={open} 
            onOpenChange={setOpen}
            title={isMobile ? "Quick Actions" : "Keyboard Shortcuts"}
            description={isMobile ? "Tap an action to execute" : "Quick access to common actions"}
        >
            <CommandInput placeholder={isMobile ? "Search actions..." : "Search shortcuts..."} />
            <CommandList className="max-h-[400px]">
                <CommandEmpty>
                    <div className="flex flex-col items-center gap-2 py-4">
                        <Keyboard className="h-8 w-8 opacity-40" />
                        <p>{isMobile ? "No actions found." : "No shortcuts found."}</p>
                    </div>
                </CommandEmpty>
                {shortcuts.map((section) => (
                    <CommandGroup key={section.category} heading={section.category}>
                        {section.items.map((shortcut) => (
                            <CommandItem
                                key={shortcut.keys}
                                value={`${shortcut.description} ${shortcut.keys}`}
                                className={isMobile ? "cursor-pointer" : "cursor-default"}
                                onSelect={isMobile ? () => handleAction(shortcut.action) : undefined}
                            >
                                <span className="flex-1">{shortcut.description}</span>
                                {isMobile ? (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <CommandShortcut>
                                        <kbd className="inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                                            {formatShortcut(shortcut.keys)}
                                        </kbd>
                                    </CommandShortcut>
                                )}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ))}
            </CommandList>
        </CommandDialog>
    )
}

export default KeyboardShortcutsDialog
