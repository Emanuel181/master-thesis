"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, ScanSearch, Wrench, BugPlay, FileText } from "lucide-react"

const AGENT_CONFIG = {
    reviewer: { icon: ScanSearch, color: "text-blue-500", bg: "bg-blue-500" },
    implementation: { icon: Wrench, color: "text-green-500", bg: "bg-green-500" },
    tester: { icon: BugPlay, color: "text-orange-500", bg: "bg-orange-500" },
    report: { icon: FileText, color: "text-purple-500", bg: "bg-purple-500" },
}

/**
 * PromptCard - Card component for displaying and selecting prompts for an agent.
 * Used in the Prompts Configuration tab.
 */
export function PromptCard({
    agent,
    agentPrompts,
    selectedPrompts,
    currentPage,
    isRefreshing,
    onPromptSelect,
    onViewPrompt,
    onRefresh,
    onPageChange,
    truncateText,
}) {
    const config = AGENT_CONFIG[agent] || { icon: ScanSearch, color: "text-gray-500", bg: "bg-gray-500" }
    const AgentIcon = config.icon
    const pageSize = 3
    
    // Ensure agentPrompts is always an array
    const promptsArray = Array.isArray(agentPrompts) ? agentPrompts : []
    const totalPages = Math.ceil(promptsArray.length / pageSize)
    const visiblePrompts = promptsArray.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <AgentIcon className={`w-5 h-5 ${config.color}`} />
                    <CardTitle className="text-lg font-medium capitalize">{agent} agent</CardTitle>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onRefresh}
                    title={`Refresh ${agent} prompts`}
                    disabled={isRefreshing}
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                {promptsArray.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic py-2">
                        No prompts configured.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {visiblePrompts.map((prompt) => {
                            const isSelected = selectedPrompts[agent]?.includes(prompt.id)
                            return (
                                <div 
                                    key={prompt.id} 
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                        isSelected 
                                            ? 'border-primary bg-primary/10' 
                                            : 'hover:border-muted-foreground/50'
                                    }`}
                                    onClick={() => onPromptSelect(agent, prompt.id)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{prompt.title || "Untitled"}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                {truncateText(prompt.text, 50)}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="shrink-0 h-7"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onViewPrompt(prompt)
                                            }}
                                        >
                                            View
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-2 border-t mt-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                                    disabled={currentPage === 0}
                                >
                                    ← Prev
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                    {currentPage + 1} / {totalPages}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
                                    disabled={currentPage >= totalPages - 1}
                                >
                                    Next →
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
