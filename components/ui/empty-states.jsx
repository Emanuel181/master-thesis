"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    FileCode,
    FolderOpen,
    Upload,
    BookOpen,
    Github,
    FileText,
    Search,
    Inbox,
    FolderPlus,
    Keyboard,
} from "lucide-react"
import { formatShortcut } from "@/hooks/use-keyboard-shortcuts"

// Generic Empty State Component
export function EmptyState({
    icon: Icon = Inbox,
    title,
    description,
    action,
    actionLabel,
    secondaryAction,
    secondaryActionLabel,
    shortcutHint,
    className,
    children,
}) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-12 px-4 text-center",
            className
        )}>
            <div className="rounded-full bg-muted p-4 mb-4">
                <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            {title && (
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
            )}
            {description && (
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    {description}
                </p>
            )}
            {shortcutHint && (
                <p className="text-xs text-muted-foreground/70 mb-4 flex items-center gap-1.5">
                    <Keyboard className="h-3 w-3" />
                    Press <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">{formatShortcut(shortcutHint)}</kbd> {actionLabel?.toLowerCase() || "to get started"}
                </p>
            )}
            {children}
            {(action || secondaryAction) && (
                <div className="flex items-center gap-3">
                    {action && (
                        <Button onClick={action}>
                            {actionLabel || "Get started"}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button variant="outline" onClick={secondaryAction}>
                            {secondaryActionLabel || "Learn more"}
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

// No Files Empty State
export function NoFilesEmptyState({ onImport }) {
    return (
        <EmptyState
            icon={FolderOpen}
            title="No files yet"
            description="Import a repository from GitHub or GitLab to start analyzing your code."
            action={onImport}
            actionLabel="Import Repository"
        >
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <Github className="h-4 w-4" />
                <span>or</span>
                <span>GitLab</span>
            </div>
        </EmptyState>
    )
}

// No Prompts Empty State
export function NoPromptsEmptyState({ onAdd, agentName }) {
    return (
        <EmptyState
            icon={FileText}
            title={`No ${agentName} prompts`}
            description={`Add custom prompts to guide the ${agentName} agent's analysis.`}
            action={onAdd}
            actionLabel="Add Prompt"
        />
    )
}

// No Categories Empty State (Knowledge base)
export function NoCategoriesEmptyState({ onAdd }) {
    return (
        <EmptyState
            icon={BookOpen}
            title="No categories yet"
            description="Create your first knowledge base category to organize security documentation and reference materials."
            action={onAdd}
            actionLabel="Create Category"
        >
            <div className="grid grid-cols-3 gap-4 mb-6 text-xs text-muted-foreground">
                <div className="flex flex-col items-center gap-1">
                    <div className="rounded-lg bg-muted p-2">
                        <FolderPlus className="h-4 w-4" />
                    </div>
                    <span>Organize</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <div className="rounded-lg bg-muted p-2">
                        <Upload className="h-4 w-4" />
                    </div>
                    <span>Upload PDFs</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <div className="rounded-lg bg-muted p-2">
                        <Search className="h-4 w-4" />
                    </div>
                    <span>Reference</span>
                </div>
            </div>
        </EmptyState>
    )
}

// No Documents Empty State
export function NoDocumentsEmptyState({ onUpload, categoryName }) {
    return (
        <EmptyState
            icon={FileCode}
            title="No documents"
            description={`Upload PDF documents to the "${categoryName}" category to build your knowledge base.`}
            action={onUpload}
            actionLabel="Upload Document"
        />
    )
}

// No Search Results Empty State
export function NoSearchResultsEmptyState({ searchTerm, onClear }) {
    return (
        <EmptyState
            icon={Search}
            title="No results found"
            description={`No matches for "${searchTerm}". Try adjusting your search terms.`}
            action={onClear}
            actionLabel="Clear Search"
        />
    )
}

// No Repos Empty State
export function NoReposEmptyState({ onConnect, provider = "GitHub" }) {
    return (
        <EmptyState
            icon={Github}
            title={`No ${provider} repositories`}
            description={`Connect your ${provider} account to import repositories for analysis.`}
            action={onConnect}
            actionLabel={`Connect ${provider}`}
        />
    )
}

// Code Editor Empty State
export function CodeEditorEmptyState({ onImport, onPaste }) {
    return (
        <EmptyState
            icon={FileCode}
            title="Ready to analyze"
            description="Import a repository or paste code directly to start your security analysis."
        >
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
                <Button onClick={onImport} className="w-full sm:w-auto">
                    <Github className="mr-2 h-4 w-4" />
                    Import Repository
                </Button>
                <span className="text-sm text-muted-foreground">or</span>
                <Button variant="outline" onClick={onPaste} className="w-full sm:w-auto">
                    <FileCode className="mr-2 h-4 w-4" />
                    Paste Code
                </Button>
            </div>
        </EmptyState>
    )
}

// Generic Error State
export function ErrorState({ title, description, onRetry, error }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="rounded-full bg-destructive/10 p-4 mb-4">
                <svg
                    className="h-8 w-8 text-destructive"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">{title || "Something went wrong"}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
                {description || "An unexpected error occurred. Please try again."}
            </p>
            {error && process.env.NODE_ENV === "development" && (
                <pre className="text-xs text-left bg-muted p-2 rounded mb-4 max-w-md overflow-auto">
                    {error.message || String(error)}
                </pre>
            )}
            {onRetry && (
                <Button onClick={onRetry} variant="outline">
                    Try Again
                </Button>
            )}
        </div>
    )
}

export default EmptyState

