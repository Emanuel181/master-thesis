"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
    Search,
    FileCode,
    Folder,
    Clock,
    X,
    FileText,
    FileType,
    File,
    Braces,
    Database,
    Settings,
    Image,
    FileSpreadsheet,
    ChevronRight,
} from "lucide-react"
import { formatShortcut } from "@/hooks/use-keyboard-shortcuts"

const QuickFileSwitcherContext = React.createContext(null)

export function useQuickFileSwitcher() {
    const context = React.useContext(QuickFileSwitcherContext)
    if (!context) {
        throw new Error("useQuickFileSwitcher must be used within QuickFileSwitcherProvider")
    }
    return context
}

// File extension to icon mapping
const FILE_ICONS = {
    // JavaScript/TypeScript
    js: { icon: FileCode, color: "text-yellow-500" },
    jsx: { icon: FileCode, color: "text-cyan-500" },
    ts: { icon: FileCode, color: "text-blue-500" },
    tsx: { icon: FileCode, color: "text-blue-400" },
    mjs: { icon: FileCode, color: "text-yellow-500" },
    cjs: { icon: FileCode, color: "text-yellow-500" },

    // Web
    html: { icon: FileCode, color: "text-orange-500" },
    css: { icon: FileType, color: "text-blue-400" },
    scss: { icon: FileType, color: "text-pink-500" },
    sass: { icon: FileType, color: "text-pink-500" },
    less: { icon: FileType, color: "text-indigo-400" },

    // Data
    json: { icon: Braces, color: "text-yellow-400" },
    yaml: { icon: Settings, color: "text-red-400" },
    yml: { icon: Settings, color: "text-red-400" },
    xml: { icon: FileCode, color: "text-orange-400" },
    csv: { icon: FileSpreadsheet, color: "text-green-500" },

    // Languages
    py: { icon: FileCode, color: "text-yellow-300" },
    rb: { icon: FileCode, color: "text-red-500" },
    go: { icon: FileCode, color: "text-cyan-400" },
    rs: { icon: FileCode, color: "text-orange-600" },
    java: { icon: FileCode, color: "text-red-400" },
    kt: { icon: FileCode, color: "text-purple-500" },
    swift: { icon: FileCode, color: "text-orange-500" },
    c: { icon: FileCode, color: "text-blue-600" },
    cpp: { icon: FileCode, color: "text-blue-500" },
    cs: { icon: FileCode, color: "text-green-600" },
    php: { icon: FileCode, color: "text-indigo-400" },

    // Docs
    md: { icon: FileText, color: "text-gray-400" },
    mdx: { icon: FileText, color: "text-yellow-400" },
    txt: { icon: FileText, color: "text-gray-500" },

    // Config
    env: { icon: Settings, color: "text-yellow-600" },
    gitignore: { icon: Settings, color: "text-orange-400" },
    eslintrc: { icon: Settings, color: "text-purple-400" },
    prettierrc: { icon: Settings, color: "text-pink-400" },

    // Database
    sql: { icon: Database, color: "text-blue-500" },
    prisma: { icon: Database, color: "text-teal-500" },

    // Images
    png: { icon: Image, color: "text-purple-400" },
    jpg: { icon: Image, color: "text-purple-400" },
    jpeg: { icon: Image, color: "text-purple-400" },
    gif: { icon: Image, color: "text-purple-400" },
    svg: { icon: Image, color: "text-orange-400" },
    ico: { icon: Image, color: "text-blue-400" },

    // Default
    default: { icon: File, color: "text-gray-400" },
}

// Get icon for file extension
function getFileIcon(filename) {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    // Check for special filenames
    if (filename.startsWith('.env')) return FILE_ICONS.env
    if (filename === '.gitignore') return FILE_ICONS.gitignore
    if (filename.includes('eslint')) return FILE_ICONS.eslintrc
    if (filename.includes('prettier')) return FILE_ICONS.prettierrc

    return FILE_ICONS[ext] || FILE_ICONS.default
}

// Fuzzy match with character highlighting
function fuzzyMatch(text, query) {
    if (!query) return { match: true, score: 0, indices: [] }

    const textLower = text.toLowerCase()
    const queryLower = query.toLowerCase()

    // Exact match
    if (textLower === queryLower) {
        return { match: true, score: 100, indices: Array.from({ length: text.length }, (_, i) => i) }
    }

    // Contains match
    if (textLower.includes(queryLower)) {
        const startIdx = textLower.indexOf(queryLower)
        const indices = Array.from({ length: queryLower.length }, (_, i) => startIdx + i)
        return { match: true, score: 80 + (startIdx === 0 ? 10 : 0), indices }
    }

    // Fuzzy match
    let queryIdx = 0
    const indices = []
    let score = 0
    let consecutiveBonus = 0
    let lastMatchIdx = -1

    for (let i = 0; i < text.length && queryIdx < queryLower.length; i++) {
        if (textLower[i] === queryLower[queryIdx]) {
            indices.push(i)
            if (lastMatchIdx === i - 1) consecutiveBonus += 5
            if (i === 0 || /[_\-./\\]/.test(text[i - 1])) score += 10
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
function HighlightedText({ text, indices, className = "" }) {
    if (!indices || indices.length === 0) {
        return <span className={className}>{text}</span>
    }

    const indexSet = new Set(indices)
    return (
        <span className={className}>
            {text.split('').map((char, i) => (
                <span
                    key={i}
                    className={indexSet.has(i) ? "text-primary font-semibold bg-primary/10 rounded-sm" : ""}
                >
                    {char}
                </span>
            ))}
        </span>
    )
}

// Get all files recursively from project structure
function getAllFiles(structure, path = "") {
    const files = []

    const processNode = (node, currentPath) => {
        const nodePath = currentPath ? `${currentPath}/${node.name}` : node.name

        if (node.type === "file" || !node.children) {
            files.push({
                name: node.name,
                path: nodePath,
                node: node,
                content: node.content || null,
            })
        }

        if (node.children) {
            node.children.forEach(child => processNode(child, nodePath))
        }
    }

    if (Array.isArray(structure)) {
        structure.forEach(node => processNode(node, path))
    } else if (structure?.children) {
        structure.children.forEach(node => processNode(node, path))
    }

    return files
}

// Get path breadcrumbs
function getBreadcrumbs(path) {
    const parts = path.split('/')
    if (parts.length <= 2) return null
    return parts.slice(0, -1) // All except filename
}

export function QuickFileSwitcherProvider({ children, projectStructure, onFileSelect, onFileSelectNewTab, recentFiles = [] }) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const [selectedIndex, setSelectedIndex] = React.useState(0)
    const [previewContent, setPreviewContent] = React.useState(null)
    const inputRef = React.useRef(null)
    const itemRefs = React.useRef({})

    // Get all files from project structure
    const allFiles = React.useMemo(() => {
        return getAllFiles(projectStructure)
    }, [projectStructure])

    // Filter and score files based on search with fuzzy matching
    const filteredFiles = React.useMemo(() => {
        if (!search.trim()) {
            // Show recent files first, then all files
            const recentSet = new Set(recentFiles.map(f => f.path))
            const recent = recentFiles.slice(0, 5).map(f => ({
                ...f,
                matchResult: { match: true, score: 100, indices: [] },
                pathMatchResult: { match: true, score: 0, indices: [] },
            }))
            const others = allFiles
                .filter(f => !recentSet.has(f.path))
                .slice(0, 20)
                .map(f => ({
                    ...f,
                    matchResult: { match: true, score: 0, indices: [] },
                    pathMatchResult: { match: true, score: 0, indices: [] },
                }))
            return { recent, others }
        }

        const searchLower = search.toLowerCase().trim()

        const matches = allFiles
            .map(file => {
                const nameMatch = fuzzyMatch(file.name, searchLower)
                const pathMatch = fuzzyMatch(file.path, searchLower)

                // Use best score
                const bestScore = Math.max(nameMatch.score, pathMatch.score * 0.8)

                return {
                    ...file,
                    matchResult: nameMatch,
                    pathMatchResult: pathMatch,
                    bestScore,
                }
            })
            .filter(file => file.matchResult.match || file.pathMatchResult.match)
            .sort((a, b) => b.bestScore - a.bestScore)
            .slice(0, 25)

        return { recent: [], others: matches }
    }, [allFiles, search, recentFiles])

    const allFilteredFiles = React.useMemo(() => {
        return [...filteredFiles.recent, ...filteredFiles.others]
    }, [filteredFiles])

    // Reset selection when search changes
    React.useEffect(() => {
        setSelectedIndex(0)
    }, [search])

    // Scroll selected item into view
    React.useEffect(() => {
        const selectedElement = itemRefs.current[selectedIndex]
        if (selectedElement) {
            selectedElement.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            })
        }
    }, [selectedIndex])

    // Update preview when selection changes
    React.useEffect(() => {
        const file = allFilteredFiles[selectedIndex]
        if (file?.content) {
            // Show first 10 lines of content
            const lines = file.content.split('\n').slice(0, 10)
            setPreviewContent(lines.join('\n'))
        } else {
            setPreviewContent(null)
        }
    }, [selectedIndex, allFilteredFiles])

    // Handle file selection
    const selectFile = React.useCallback((file, newTab = false) => {
        if (file) {
            if (newTab && onFileSelectNewTab) {
                onFileSelectNewTab(file.node)
            } else {
                onFileSelect?.(file.node)
            }
            setOpen(false)
            setSearch("")
        }
    }, [onFileSelect, onFileSelectNewTab])

    // Handle keyboard navigation with circular wrapping
    const handleKeyDown = React.useCallback((e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault()
            setSelectedIndex(i => {
                if (i >= allFilteredFiles.length - 1) return 0
                return i + 1
            })
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setSelectedIndex(i => {
                if (i <= 0) return allFilteredFiles.length - 1
                return i - 1
            })
        } else if (e.key === "Enter") {
            e.preventDefault()
            const file = allFilteredFiles[selectedIndex]
            // Ctrl+Enter or Cmd+Enter opens in new tab
            selectFile(file, e.ctrlKey || e.metaKey)
        } else if (e.key === "Escape") {
            setOpen(false)
            setSearch("")
        }
    }, [allFilteredFiles, selectedIndex, selectFile])

    // Focus input when opened
    // Focus input when opened
    React.useEffect(() => {
        if (open) {
            itemRefs.current = {}
            setTimeout(() => inputRef.current?.focus(), 0)
        } else {
            setSearch("")
            setSelectedIndex(0)
            setPreviewContent(null)
        }
    }, [open])

    // Clear search
    const clearSearch = React.useCallback(() => {
        setSearch("")
        inputRef.current?.focus()
    }, [])

    const value = React.useMemo(() => ({
        open,
        setOpen,
        search,
        setSearch,
    }), [open, search])

    return (
        <QuickFileSwitcherContext.Provider value={value}>
            {children}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    className="sm:max-w-[650px] p-0 gap-0 overflow-hidden"
                    onKeyDown={handleKeyDown}
                >
                    <DialogTitle className="sr-only">Quick File Switcher</DialogTitle>
                    <DialogDescription className="sr-only">
                        Search and open files. Use arrow keys to navigate and Enter to open.
                    </DialogDescription>

                    <div className="flex items-center border-b px-3">
                        <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                        <Input
                            ref={inputRef}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search files by name or path..."
                            className="h-12 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        />
                        {search && (
                            <button
                                onClick={clearSearch}
                                className="p-1 hover:bg-accent rounded-sm"
                                title="Clear search"
                            >
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        )}
                    </div>

                    <div className="flex">
                        <ScrollArea className="max-h-[400px] overflow-y-auto flex-1">
                            {allFilteredFiles.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    <FileCode className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                    <p className="font-medium">No files found</p>
                                    <p className="text-xs mt-1 text-muted-foreground/70">
                                        {search ? `No matches for "${search}"` : "Import a repository to see files"}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-2">
                                    {filteredFiles.recent.length > 0 && (
                                        <div className="mb-2">
                                            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                                <Clock className="h-3 w-3" />
                                                Recent
                                            </div>
                                            {filteredFiles.recent.map((file, index) => (
                                                <FileItem
                                                    key={`recent-${file.path}`}
                                                    ref={(el) => { itemRefs.current[index] = el }}
                                                    file={file}
                                                    isSelected={selectedIndex === index}
                                                    search={search}
                                                    onClick={() => selectFile(file)}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {filteredFiles.others.length > 0 && (
                                        <div>
                                            {filteredFiles.recent.length > 0 && (
                                                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                                    <Folder className="h-3 w-3" />
                                                    Files
                                                </div>
                                            )}
                                            {filteredFiles.others.map((file, index) => {
                                                const actualIndex = filteredFiles.recent.length + index
                                                return (
                                                    <FileItem
                                                        key={`file-${file.path}`}
                                                        ref={(el) => { itemRefs.current[actualIndex] = el }}
                                                        file={file}
                                                        isSelected={selectedIndex === actualIndex}
                                                        search={search}
                                                        onClick={() => selectFile(file)}
                                                    />
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>

                        {/* Preview panel */}
                        {previewContent && (
                            <div className="w-[250px] border-l bg-muted/30 p-2 hidden md:block">
                                <div className="text-xs font-medium text-muted-foreground mb-2">Preview</div>
                                <pre className="text-xs text-muted-foreground overflow-hidden font-mono leading-relaxed">
                                    {previewContent}
                                </pre>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground bg-muted/50">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <kbd className="rounded border bg-background px-1">↑↓</kbd>
                                Navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="rounded border bg-background px-1">↵</kbd>
                                Open
                            </span>
                            {onFileSelectNewTab && (
                                <span className="flex items-center gap-1">
                                    <kbd className="rounded border bg-background px-1">{formatShortcut("mod+↵")}</kbd>
                                    New tab
                                </span>
                            )}
                        </div>
                        <span className="flex items-center gap-1">
                            {formatShortcut("mod+p")} to toggle
                        </span>
                    </div>
                </DialogContent>
            </Dialog>
        </QuickFileSwitcherContext.Provider>
    )
}

// File item component with ref forwarding
const FileItem = React.forwardRef(function FileItem({ file, isSelected, search, onClick }, ref) {
    const fileIcon = getFileIcon(file.name)
    const Icon = fileIcon.icon
    const breadcrumbs = getBreadcrumbs(file.path)

    return (
        <button
            ref={ref}
            className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors border-l-[3px]",
                isSelected
                    ? "bg-accent border-l-primary/50 text-foreground"
                    : "hover:bg-accent/50 border-l-transparent text-muted-foreground"
            )}
            onClick={onClick}
        >
            <Icon className={cn("mr-2 h-4 w-4 shrink-0", fileIcon.color)} />
            <div className="flex-1 min-w-0 text-left">
                <div className="font-medium truncate">
                    <HighlightedText
                        text={file.name}
                        indices={file.matchResult?.indices || []}
                    />
                </div>
                {breadcrumbs && (
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-0.5 mt-0.5">
                        {breadcrumbs.map((part, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <ChevronRight className="h-2.5 w-2.5 opacity-50" />}
                                <span className="opacity-70">{part}</span>
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>
        </button>
    )
})

export default QuickFileSwitcherProvider

