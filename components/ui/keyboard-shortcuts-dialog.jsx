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
} from "@/components/ui/command"
import { 
    Search, 
    ChevronRight, 
    Home, 
    Code, 
    Database, 
    BarChart3, 
    User, 
    FileText,
    Settings,
    Bell,
    Workflow,
    Moon,
    Sun,
    Save,
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Highlighter,
    Strikethrough,
    FolderTree,
    PanelLeft,
} from "lucide-react"
import { useTheme } from "next-themes"

const quickActions = [
    {
        category: "Navigation",
        items: [
            { icon: Home, description: "Go to Home", action: "navigate-home" },
            { icon: Code, description: "Go to Code Input", action: "navigate-code" },
            { icon: Database, description: "Go to Knowledge Base", action: "navigate-kb" },
            { icon: BarChart3, description: "Go to Results", action: "navigate-results" },
            { icon: User, description: "Go to Profile", action: "navigate-profile" },
            { icon: FileText, description: "Go to Write Article", action: "navigate-article" },
        ]
    },
    {
        category: "Actions",
        items: [
            { icon: Bell, description: "Open Notifications", action: "notifications" },
            { icon: Workflow, description: "Open Workflow Configuration", action: "workflow" },
            { icon: Settings, description: "Open Settings", action: "settings" },
            { icon: Moon, description: "Toggle Dark/Light Mode", action: "theme-toggle" },
        ]
    },
    {
        category: "Editor Actions",
        items: [
            { icon: Save, description: "Save / Lock Code", action: "save" },
            { icon: PanelLeft, description: "Toggle Sidebar", action: "toggle-sidebar" },
            { icon: FolderTree, description: "Focus File Explorer", action: "focus-explorer" },
        ]
    },
    {
        category: "Article Editor",
        items: [
            { icon: Save, description: "Save Article Draft", action: "save-article" },
            { icon: Bold, description: "Bold Text", action: "bold" },
            { icon: Italic, description: "Italic Text", action: "italic" },
            { icon: Underline, description: "Underline Text", action: "underline" },
            { icon: Strikethrough, description: "Strikethrough", action: "strikethrough" },
            { icon: Highlighter, description: "Highlight Text", action: "highlight" },
            { icon: ListOrdered, description: "Numbered List", action: "numbered-list" },
            { icon: List, description: "Bullet List", action: "bullet-list" },
        ]
    },
]

export function KeyboardShortcutsDialog() {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()
    const { setTheme, theme } = useTheme()

    // Listen for open-keyboard-shortcuts event and Ctrl+Shift+K shortcut
    React.useEffect(() => {
        const handler = () => setOpen(true)
        window.addEventListener("open-keyboard-shortcuts", handler)
        
        const handleKeyDown = (e) => {
            if (e.key === "K" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
                e.preventDefault()
                setOpen(true)
            }
        }
        document.addEventListener("keydown", handleKeyDown)
        
        return () => {
            window.removeEventListener("open-keyboard-shortcuts", handler)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [])

    // Execute action on tap/click
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
                    setTheme(theme === "dark" ? "light" : "dark")
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
                case "toggle-sidebar":
                    window.dispatchEvent(new CustomEvent("toggle-sidebar"))
                    break
                case "focus-explorer":
                    window.dispatchEvent(new CustomEvent("focus-explorer"))
                    break
                case "save":
                case "save-article":
                    window.dispatchEvent(new CustomEvent("save-action"))
                    break
                case "bold":
                case "italic":
                case "underline":
                case "strikethrough":
                case "highlight":
                case "numbered-list":
                case "bullet-list":
                    window.dispatchEvent(new CustomEvent("editor-action", { detail: { action } }))
                    break
                default:
                    break
            }
        }, 100)
    }, [router, setTheme, theme])


    return (
        <CommandDialog 
            open={open} 
            onOpenChange={setOpen}
            title="Quick Actions"
            description="Search and execute actions"
        >
            <CommandInput placeholder="Search actions..." />
            <CommandList className="max-h-[400px]">
                <CommandEmpty>
                    <div className="flex flex-col items-center gap-2 py-4">
                        <Search className="h-8 w-8 opacity-40" />
                        <p>No actions found.</p>
                    </div>
                </CommandEmpty>
                {quickActions.map((section) => (
                    <CommandGroup key={section.category} heading={section.category}>
                        {section.items.map((item) => {
                            const Icon = item.icon
                            return (
                                <CommandItem
                                    key={item.action}
                                    value={item.description}
                                    className="cursor-pointer"
                                    onSelect={() => handleAction(item.action)}
                                >
                                    <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span className="flex-1">{item.description}</span>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </CommandItem>
                            )
                        })}
                    </CommandGroup>
                ))}
            </CommandList>
        </CommandDialog>
    )
}

export default KeyboardShortcutsDialog
