"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import {
  SearchIcon,
  Keyboard,
  Home,
  Code,
  BookOpen,
  FileText,
  Settings,
  Moon,
  Sun,
  User,
  LogOut,
  Workflow,
  MessageSquare,
  Wand2,
  WrapText,
  Map,
  ZoomIn,
  ZoomOut,
  Hash,
  Bell,
  FolderOpen,
} from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSettings } from "@/contexts/settingsContext"

// ============================================
// BASE COMMAND COMPONENTS (shadcn)
// ============================================

function Command({
  className,
  ...props
}) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
        className
      )}
      {...props} />
  );
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = true,
  ...props
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn("overflow-hidden p-0 shadow-lg", className)}
        showCloseButton={showCloseButton}>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

const CommandInput = React.forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex items-center border-b px-3">
      <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        ref={ref}
        data-slot="command-input"
        className={cn(
          "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props} />
    </div>
  );
})
CommandInput.displayName = "CommandInput"

function CommandList({
  className,
  children,
  ...props
}) {
  return (
    <ScrollArea className="max-h-[300px]">
      <CommandPrimitive.List
        data-slot="command-list"
        className={cn("overflow-hidden", className)}
        {...props}>
        {children}
      </CommandPrimitive.List>
    </ScrollArea>
  );
}

function CommandEmpty({
  ...props
}) {
  return (<CommandPrimitive.Empty data-slot="command-empty" className="py-6 text-center text-sm" {...props} />);
}

function CommandGroup({
  className,
  ...props
}) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
        className
      )}
      {...props} />
  );
}

function CommandSeparator({
  className,
  ...props
}) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1 h-px bg-border", className)}
      {...props} />
  );
}

function CommandItem({
  className,
  ...props
}) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props} />
  );
}

function CommandShortcut({
  className,
  ...props
}) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props} />
  );
}

// ============================================
// ADVANCED COMMAND PALETTE (merged from command-palette.jsx)
// ============================================

const CommandPaletteContext = React.createContext(null)

// Storage key for recent commands
const RECENT_COMMANDS_KEY = 'vulniq_recent_commands'
const MAX_RECENT_COMMANDS = 5

// Format shortcut for display
function formatShortcut(shortcut) {
  if (!shortcut) return ""
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
  return shortcut
    .replace(/mod/g, isMac ? "⌘" : "Ctrl")
    .replace(/shift/g, isMac ? "⇧" : "Shift")
    .replace(/alt/g, isMac ? "⌥" : "Alt")
    .replace(/\+/g, isMac ? "" : "+")
}

// Fuzzy search scoring function
function fuzzyMatch(text, query) {
  if (!query) return { match: true, score: 0, indices: [] }

  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()

  // Exact match gets highest score
  if (textLower === queryLower) {
    return { match: true, score: 100, indices: Array.from({ length: text.length }, (_, i) => i) }
  }

  // Contains match
  if (textLower.includes(queryLower)) {
    const startIdx = textLower.indexOf(queryLower)
    const indices = Array.from({ length: queryLower.length }, (_, i) => startIdx + i)
    return { match: true, score: 80, indices }
  }

  // Fuzzy match - check if all query chars appear in order
  let queryIdx = 0
  const indices = []
  let score = 0
  let consecutiveBonus = 0
  let lastMatchIdx = -1

  for (let i = 0; i < text.length && queryIdx < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIdx]) {
      indices.push(i)
      if (lastMatchIdx === i - 1) {
        consecutiveBonus += 5
      }
      if (i === 0 || text[i - 1] === ' ' || text[i - 1] === '-' || text[i - 1] === '_') {
        score += 10
      }
      lastMatchIdx = i
      queryIdx++
    }
  }

  if (queryIdx === queryLower.length) {
    score += 50 + consecutiveBonus - (indices[indices.length - 1] - indices[0])
    return { match: true, score: Math.max(score, 1), indices }
  }

  return { match: false, score: 0, indices: [] }
}

// Highlight matched characters
function HighlightedText({ text, indices }) {
  if (!indices || indices.length === 0) {
    return <span>{text}</span>
  }

  const indexSet = new Set(indices)
  return (
    <span>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className={indexSet.has(i) ? "text-primary font-semibold" : ""}
        >
          {char}
        </span>
      ))}
    </span>
  )
}

function useCommandPalette() {
  const context = React.useContext(CommandPaletteContext)
  if (!context) {
    throw new Error("useCommandPalette must be used within CommandPaletteProvider")
  }
  return context
}

function CommandPaletteProvider({
  children,
  onNavigate,
  isCodeLocked,
  activeComponent = "Home",
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [recentCommands, setRecentCommands] = React.useState([])
  const inputRef = React.useRef(null)

  // Get settings from context
  const { settings, updateSettings } = useSettings()
  const router = useRouter()
  const pathname = usePathname()
  
  // Detect demo mode
  const isDemo = pathname?.startsWith('/demo')

  // Get current theme from settings
  const currentTheme = settings?.mode || "light"

  // Load recent commands from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_COMMANDS_KEY)
      if (saved) {
        setRecentCommands(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Failed to load recent commands:', e)
    }
  }, [])

  // Save recent command
  const saveRecentCommand = React.useCallback((commandId) => {
    setRecentCommands(prev => {
      const filtered = prev.filter(id => id !== commandId)
      const updated = [commandId, ...filtered].slice(0, MAX_RECENT_COMMANDS)
      try {
        localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(updated))
      } catch (e) {
        console.error('Failed to save recent commands:', e)
      }
      return updated
    })
  }, [])

  // Define all available commands with aliases and descriptions
  const allCommands = React.useMemo(() => [
    // Navigation
    {
      id: "nav-home",
      label: "Go to Home",
      icon: Home,
      category: "Navigation",
      shortcut: "mod+1",
      aliases: ["home", "dashboard", "main"],
      action: () => onNavigate?.({ title: "Home" }),
    },
    {
      id: "nav-code",
      label: "Go to Code Input",
      icon: Code,
      category: "Navigation",
      shortcut: "mod+2",
      aliases: ["code", "editor", "input", "gc"],
      action: () => onNavigate?.({ title: "Code input" }),
    },
    {
      id: "nav-knowledge",
      label: "Go to Knowledge Base",
      icon: BookOpen,
      category: "Navigation",
      shortcut: "mod+3",
      aliases: ["knowledge", "kb", "pdf", "docs", "documents", "gk"],
      action: () => onNavigate?.({ title: "Knowledge base" }),
    },
    {
      id: "nav-results",
      label: "Go to Results",
      icon: FileText,
      category: "Navigation",
      shortcut: "mod+4",
      aliases: ["results", "reports", "analysis", "gr"],
      action: () => onNavigate?.({ title: "Results" }),
    },
    {
      id: "nav-profile",
      label: "Go to Profile",
      icon: User,
      category: "Navigation",
      shortcut: "mod+5",
      aliases: ["profile", "account", "user", "me", "gp"],
      action: () => router.push(isDemo ? "/demo/profile" : "/profile"),
    },
    // Actions
    {
      id: "action-notifications",
      label: "Open Notifications",
      icon: Bell,
      category: "Actions",
      shortcut: "mod+alt+n",
      aliases: ["notifications", "alerts", "messages"],
      action: () => window.dispatchEvent(new CustomEvent("open-notifications")),
    },
    {
      id: "action-switch-project",
      label: "Switch Project (GitHub/GitLab)",
      icon: FolderOpen,
      category: "Actions",
      shortcut: "mod+shift+o",
      aliases: ["project", "switch", "open", "folder", "github", "gitlab", "import", "repo", "repository"],
      action: () => window.dispatchEvent(new CustomEvent("open-project-switcher")),
      contextOnly: "Code input",
    },
    {
      id: "action-workflow",
      label: "Open Workflow Configuration",
      icon: Workflow,
      category: "Actions",
      shortcut: "mod+shift+a",
      aliases: ["workflow", "agents", "config", "ai"],
      action: () => {
        if (isCodeLocked) {
          onNavigate?.({ title: "Workflow configuration" })
        }
      },
      disabled: !isCodeLocked,
      disabledReason: "Lock code first",
      contextOnly: "Code input",
    },
    {
      id: "action-feedback",
      label: "Send Feedback",
      icon: MessageSquare,
      category: "Actions",
      shortcut: "mod+shift+b",
      aliases: ["feedback", "report", "bug", "suggest"],
      action: () => window.dispatchEvent(new CustomEvent("open-feedback")),
    },
    {
      id: "action-shortcuts",
      label: "Keyboard Shortcuts",
      icon: Keyboard,
      category: "Actions",
      shortcut: "mod+/",
      aliases: ["shortcuts", "keys", "hotkeys", "help"],
      action: () => window.dispatchEvent(new CustomEvent("open-keyboard-shortcuts")),
    },
    // Editor Actions (context-aware)
    {
      id: "editor-format",
      label: "Format Code",
      icon: Wand2,
      category: "Editor",
      shortcut: "mod+shift+alt+f",
      aliases: ["format", "prettier", "beautify"],
      action: () => window.dispatchEvent(new CustomEvent("editor-format-code")),
      contextOnly: "Code input",
    },
    {
      id: "editor-minimap",
      label: "Toggle Minimap",
      icon: Map,
      category: "Editor",
      shortcut: "mod+m",
      aliases: ["minimap", "overview"],
      action: () => window.dispatchEvent(new CustomEvent("editor-toggle-minimap")),
      contextOnly: "Code input",
    },
    {
      id: "editor-wordwrap",
      label: "Toggle Word Wrap",
      icon: WrapText,
      category: "Editor",
      shortcut: "mod+alt+w",
      aliases: ["wrap", "wordwrap", "linewrap"],
      action: () => window.dispatchEvent(new CustomEvent("editor-toggle-wordwrap")),
      contextOnly: "Code input",
    },
    {
      id: "editor-goto-line",
      label: "Go to Line...",
      icon: Hash,
      category: "Editor",
      shortcut: "mod+g",
      aliases: ["goto", "line", "jump"],
      action: () => window.dispatchEvent(new CustomEvent("editor-go-to-line")),
      contextOnly: "Code input",
    },
    {
      id: "editor-zoom-in",
      label: "Zoom In",
      icon: ZoomIn,
      category: "Editor",
      shortcut: "mod+=",
      aliases: ["zoom", "bigger", "increase"],
      action: () => window.dispatchEvent(new CustomEvent("editor-zoom-in")),
      contextOnly: "Code input",
    },
    {
      id: "editor-zoom-out",
      label: "Zoom Out",
      icon: ZoomOut,
      category: "Editor",
      shortcut: "mod+-",
      aliases: ["zoom", "smaller", "decrease"],
      action: () => window.dispatchEvent(new CustomEvent("editor-zoom-out")),
      contextOnly: "Code input",
    },
    // Appearance
    {
      id: "theme-toggle",
      label: "Toggle Theme",
      icon: currentTheme === "dark" ? Sun : Moon,
      category: "Appearance",
      shortcut: "mod+shift+l",
      aliases: ["theme", "toggle", "mode", "dark", "light", "night", "day"],
      action: () => {
        const newTheme = currentTheme === "dark" ? "light" : "dark"
        setTimeout(() => {
          updateSettings({ ...settings, mode: newTheme })
        }, 50)
      },
    },
    // Settings
    {
      id: "settings-open",
      label: "Open Settings",
      icon: Settings,
      category: "Settings",
      shortcut: "mod+,",
      aliases: ["settings", "preferences", "options", "customize", "appearance"],
      action: () => {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("open-settings"))
        }, 100)
      },
    },
    // Session
    {
      id: "session-logout",
      label: "Sign Out",
      icon: LogOut,
      category: "Session",
      shortcut: "mod+shift+q",
      aliases: ["logout", "signout", "exit", "quit"],
      action: () => {
        if (isDemo) {
          router.push('/')
        } else {
          signOut({ callbackUrl: "/login" })
        }
      },
    },
  ], [currentTheme, settings, updateSettings, onNavigate, isCodeLocked, router, isDemo])

  // Filter commands based on context
  const contextCommands = React.useMemo(() => {
    return allCommands.filter(cmd => {
      if (cmd.hidden) return false
      if (cmd.contextOnly && cmd.contextOnly !== activeComponent) return false
      return true
    })
  }, [allCommands, activeComponent])

  // Filter and score commands based on search with fuzzy matching
  const filteredCommands = React.useMemo(() => {
    if (!search.trim()) {
      const recentCmds = recentCommands
        .map(id => contextCommands.find(cmd => cmd.id === id))
        .filter(Boolean)
        .map(cmd => ({ ...cmd, isRecent: true, matchResult: { match: true, score: 100, indices: [] } }))

      const otherCmds = contextCommands
        .filter(cmd => !recentCommands.includes(cmd.id))
        .map(cmd => ({ ...cmd, matchResult: { match: true, score: 0, indices: [] } }))

      return [...recentCmds, ...otherCmds]
    }

    const searchLower = search.toLowerCase().trim()

    return contextCommands
      .map(cmd => {
        const labelMatch = fuzzyMatch(cmd.label, searchLower)
        let aliasMatch = { match: false, score: 0, indices: [] }
        if (cmd.aliases) {
          for (const alias of cmd.aliases) {
            const match = fuzzyMatch(alias, searchLower)
            if (match.match && match.score > aliasMatch.score) {
              aliasMatch = { ...match, alias }
            }
          }
        }
        const categoryMatch = fuzzyMatch(cmd.category, searchLower)

        let bestMatch = labelMatch
        if (aliasMatch.score > bestMatch.score) bestMatch = aliasMatch
        if (categoryMatch.match && categoryMatch.score > bestMatch.score) {
          bestMatch = categoryMatch
        }

        return {
          ...cmd,
          matchResult: bestMatch,
          matchedAlias: aliasMatch.alias,
        }
      })
      .filter(cmd => cmd.matchResult.match)
      .sort((a, b) => b.matchResult.score - a.matchResult.score)
  }, [contextCommands, search, recentCommands])

  // Group commands by category
  const groupedCommands = React.useMemo(() => {
    const groups = {}
    const recent = filteredCommands.filter(cmd => cmd.isRecent && !search.trim())
    const others = filteredCommands.filter(cmd => !cmd.isRecent || search.trim())

    if (recent.length > 0) {
      groups["Recent"] = recent
    }

    others.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = []
      }
      groups[cmd.category].push(cmd)
    })

    return groups
  }, [filteredCommands, search])

  // Execute command and track recent
  const executeCommand = React.useCallback((command) => {
    if (command && !command.disabled) {
      saveRecentCommand(command.id)
      command.action()
      setOpen(false)
      setSearch("")
    }
  }, [saveRecentCommand])

  // Refs for stable access in event handlers
  const settingsRef = React.useRef(settings)
  const updateSettingsRef = React.useRef(updateSettings)
  const onNavigateRef = React.useRef(onNavigate)
  const routerRef = React.useRef(router)
  const isDemoRef = React.useRef(isDemo)

  React.useEffect(() => {
    settingsRef.current = settings
    updateSettingsRef.current = updateSettings
    onNavigateRef.current = onNavigate
    routerRef.current = router
    isDemoRef.current = isDemo
  }, [settings, updateSettings, onNavigate, router, isDemo])

  // Global shortcut to open command palette and other shortcuts
  React.useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const isMod = e.metaKey || e.ctrlKey

      // Ctrl+K or Cmd+K - Open command palette
      if (isMod && e.key.toLowerCase() === "k" && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        e.stopPropagation()
        setOpen(prev => !prev)
        return
      }

      // Ctrl+Shift+L or Cmd+Shift+L - Toggle theme
      if (isMod && e.shiftKey && !e.altKey && e.key.toLowerCase() === "l") {
        e.preventDefault()
        e.stopPropagation()
        const currentSettings = settingsRef.current
        const update = updateSettingsRef.current
        if (currentSettings && update) {
          const newTheme = currentSettings.mode === "dark" ? "light" : "dark"
          update({ ...currentSettings, mode: newTheme })
        }
        return
      }

      // Ctrl+, or Cmd+, - Open settings
      if (isMod && e.key === "," && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        e.stopPropagation()
        window.dispatchEvent(new CustomEvent("open-settings"))
        return
      }

      // Ctrl+/ or Cmd+/ - Open keyboard shortcuts
      if (isMod && (e.key === "/" || e.key === "?") && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        e.stopPropagation()
        window.dispatchEvent(new CustomEvent("open-keyboard-shortcuts"))
        return
      }


      // Ctrl+Shift+A or Cmd+Shift+A - Open workflow configuration (agents)
      if (isMod && e.shiftKey && !e.altKey && e.key.toLowerCase() === "a") {
        e.preventDefault()
        e.stopPropagation()
        onNavigateRef.current?.({ title: "Workflow configuration" })
        return
      }

      // Ctrl+Shift+O or Cmd+Shift+O - Open project switcher
      if (isMod && e.shiftKey && !e.altKey && e.key.toLowerCase() === "o") {
        e.preventDefault()
        e.stopPropagation()
        window.dispatchEvent(new CustomEvent("open-project-switcher"))
        return
      }

      // Ctrl+Alt+N or Cmd+Alt+N - Open notifications
      if (isMod && !e.shiftKey && e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault()
        e.stopPropagation()
        window.dispatchEvent(new CustomEvent("open-notifications"))
        return
      }

      // Ctrl+Shift+Alt+F or Cmd+Shift+Alt+F - Format code
      if (isMod && e.shiftKey && e.altKey && e.key.toLowerCase() === "f") {
        e.preventDefault()
        e.stopPropagation()
        window.dispatchEvent(new CustomEvent("editor-format-code"))
        return
      }

      // Ctrl+M or Cmd+M - Toggle minimap
      if (isMod && e.key.toLowerCase() === "m" && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        e.stopPropagation()
        window.dispatchEvent(new CustomEvent("editor-toggle-minimap"))
        return
      }

      // Ctrl+Alt+W or Cmd+Alt+W - Toggle word wrap
      if (isMod && !e.shiftKey && e.altKey && e.key.toLowerCase() === "w") {
        e.preventDefault()
        e.stopPropagation()
        window.dispatchEvent(new CustomEvent("editor-toggle-wordwrap"))
        return
      }

      // Ctrl+G or Cmd+G - Go to line
      if (isMod && e.key.toLowerCase() === "g" && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        e.stopPropagation()
        window.dispatchEvent(new CustomEvent("editor-go-to-line"))
        return
      }

      // Ctrl+= or Cmd+= - Zoom in
      if (isMod && (e.key === "=" || e.key === "+") && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        e.stopPropagation()
        window.dispatchEvent(new CustomEvent("editor-zoom-in"))
        return
      }

      // Ctrl+- or Cmd+- - Zoom out
      if (isMod && e.key === "-" && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        e.stopPropagation()
        window.dispatchEvent(new CustomEvent("editor-zoom-out"))
        return
      }

      // Ctrl+Shift+B or Cmd+Shift+B - Send feedback
      if (isMod && e.shiftKey && !e.altKey && e.key.toLowerCase() === "b") {
        e.preventDefault()
        e.stopPropagation()
        window.dispatchEvent(new CustomEvent("open-feedback"))
        return
      }

      // Ctrl+Shift+Q or Cmd+Shift+Q - Sign out
      if (isMod && e.shiftKey && !e.altKey && e.key.toLowerCase() === "q") {
        e.preventDefault()
        e.stopPropagation()
        if (isDemoRef.current) {
          routerRef.current?.push('/')
        } else {
          signOut({ callbackUrl: "/login" })
        }
        return
      }

      // Ctrl+1 to 5 - Navigation shortcuts
      if (isMod && !e.shiftKey && !e.altKey) {
        const nav = onNavigateRef.current
        if (e.key === "1") {
          e.preventDefault()
          e.stopPropagation()
          nav?.({ title: "Home" })
          return
        }
        if (e.key === "2") {
          e.preventDefault()
          e.stopPropagation()
          nav?.({ title: "Code input" })
          return
        }
        if (e.key === "3") {
          e.preventDefault()
          e.stopPropagation()
          nav?.({ title: "Knowledge base" })
          return
        }
        if (e.key === "4") {
          e.preventDefault()
          e.stopPropagation()
          nav?.({ title: "Results" })
          return
        }
        if (e.key === "5") {
          e.preventDefault()
          e.stopPropagation()
          routerRef.current?.push(isDemoRef.current ? "/demo/profile" : "/profile")
          return
        }
      }
    }

    document.addEventListener("keydown", handleGlobalKeyDown, { capture: true })
    return () => document.removeEventListener("keydown", handleGlobalKeyDown, { capture: true })
  }, [])

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setSearch("")
    }
  }, [open])


  const value = React.useMemo(() => ({
    open,
    setOpen,
    search,
    setSearch,
  }), [open, search])

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen} showCloseButton={false}>
        <CommandInput
          ref={inputRef}
          value={search}
          onValueChange={setSearch}
          placeholder="Type a command or search..."
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {Object.entries(groupedCommands).map(([category, cmds], index, arr) => (
            <React.Fragment key={category}>
              <CommandGroup heading={category}>
                {cmds.map((cmd) => {
                  const Icon = cmd.icon
                  return (
                    <CommandItem
                      key={cmd.id}
                      value={cmd.id}
                      onSelect={() => executeCommand(cmd)}
                      disabled={cmd.disabled}
                    >
                      {Icon && <Icon />}
                      <span>
                        <HighlightedText
                          text={cmd.label}
                          indices={cmd.matchResult?.indices || []}
                        />
                        </span>
                        {cmd.shortcut && (
                          <CommandShortcut>{formatShortcut(cmd.shortcut)}</CommandShortcut>
                        )}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                {index < arr.length - 1 && <CommandSeparator />}
              </React.Fragment>
            ))}
          </CommandList>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
  CommandPaletteProvider,
  useCommandPalette,
  formatShortcut,
  fuzzyMatch,
  HighlightedText,
}
