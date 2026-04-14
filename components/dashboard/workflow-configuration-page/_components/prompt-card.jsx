"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { RefreshCw, ScanSearch, Wrench, BugPlay, FileText, Check } from "lucide-react"

const AGENT_CONFIG = {
    reviewer: { icon: ScanSearch, color: "text-agent-reviewer", bg: "bg-agent-reviewer" },
    implementation: { icon: Wrench, color: "text-agent-implementation", bg: "bg-agent-implementation" },
    tester: { icon: BugPlay, color: "text-agent-tester", bg: "bg-agent-tester" },
    report: { icon: FileText, color: "text-agent-report", bg: "bg-agent-report" },
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
    const config = AGENT_CONFIG[agent] || { icon: ScanSearch, color: "text-muted-foreground", bg: "bg-muted" }
    const AgentIcon = config.icon
    const pageSize = 3
    
    // Ensure agentPrompts is always an array
    const promptsArray = Array.isArray(agentPrompts) ? agentPrompts : []
    const totalPages = Math.ceil(promptsArray.length / pageSize)
    const visiblePrompts = promptsArray.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

    return (
        <Card className="transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <AgentIcon className={`w-5 h-5 ${config.color}`} />
                    <CardTitle className="text-lg font-medium capitalize">{agent} agent</CardTitle>
                    {promptsArray.some(p => selectedPrompts[agent]?.includes(p.id)) && (
                        <Badge variant="default" className="text-[9px] h-4 bg-primary">
                            <Check className="h-2.5 w-2.5 mr-0.5" />
                            Active
                        </Badge>
                    )}
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh {agent} prompts</TooltipContent>
                </Tooltip>
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
                                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                        isSelected
                                            ? 'border-primary bg-primary/10 shadow-sm shadow-primary/10'
                                            : 'border-border/30 hover:border-muted-foreground/50 hover:shadow-sm'
                                    }`}
                                    onClick={() => onPromptSelect(agent, prompt.id)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                            {isSelected && (
                                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary mt-0.5 shrink-0">
                                                    <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                                                </span>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                                                    {prompt.title || "Untitled"}
                                                </p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {truncateText(prompt.text, 50)}
                                                </p>
                                            </div>
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
                            <div className="flex items-center justify-between pt-2 mt-2">
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
