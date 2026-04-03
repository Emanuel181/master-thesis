"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"

/**
 * AgentCard - Reusable card component for configuring an AI agent.
 * Used in the Agents Configuration tab.
 */
export function AgentCard({
    agentId,
    title,
    description,
    icon: Icon,
    iconColor,
    status, // "complete" | "partial" | "empty"
    // Model props
    selectedModel,
    onModelChange,
    models,
    allModels, // Full list of models for displaying friendly name
    modelSearchTerm,
    onModelSearchChange,
    modelPage,
    onModelPageChange,
    totalModelPages,
    // Prompt props
    selectedPrompt,
    onPromptChange,
    prompts,
    promptSearchTerm,
    onPromptSearchChange,
    promptPage,
    onPromptPageChange,
    totalPromptPages,
    // Refresh
    isRefreshing,
    onRefresh,
}) {
    // Get friendly name for selected model
    const getModelDisplayName = (modelId) => {
        if (!modelId) return null
        const modelList = allModels || models
        const model = modelList.find(m => (typeof m === 'string' ? m : m.id) === modelId)
        if (!model) return modelId
        return typeof model === 'string' ? model : model.name
    }

    return (
        <Card className={`transition-all duration-200 ${
            status === "complete" ? 'border-emerald-500/30' : status === "partial" ? 'border-yellow-500/20' : ''
        }`}>
            <CardHeader className={`flex flex-row items-center justify-between pb-2 rounded-t-lg transition-colors duration-300 ${
                status === "complete" ? 'bg-gradient-to-r from-emerald-500/5 to-transparent' : ''
            }`}>
                <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-medium">{title}</CardTitle>
                    <div className="flex items-center gap-1.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span
                                    className={`h-2.5 w-2.5 rounded-full shrink-0 transition-colors duration-300 ${
                                        status === "complete"
                                            ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                                            : status === "partial"
                                            ? "bg-yellow-500 shadow-sm shadow-yellow-500/50"
                                            : "bg-muted-foreground/30"
                                    }`}
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                {status === "complete"
                                    ? "Fully configured"
                                    : status === "partial"
                                    ? "Partially configured"
                                    : "Not configured"}
                            </TooltipContent>
                        </Tooltip>
                        <span className={`text-[10px] font-medium ${
                            status === "complete"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : status === "partial"
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-muted-foreground"
                        }`}>
                            {status === "complete" ? "Ready" : status === "partial" ? "Partial" : "Setup needed"}
                        </span>
                    </div>
                </div>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Model Select */}
                        <div>
                            <Label htmlFor={`${agentId}-model`} className="text-xs font-medium mb-1 block">
                                Model
                            </Label>
                            <Select 
                                id={`${agentId}-model`} 
                                value={selectedModel} 
                                onValueChange={onModelChange}
                            >
                                <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Select model">
                                        {selectedModel && getModelDisplayName(selectedModel)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent 
                                    className="z-[9999]"
                                    sideOffset={5}
                                    position="popper"
                                >
                                    <div onWheelCapture={(e) => e.stopPropagation()}>
                                        <div className="p-2 border-b">
                                            <Input
                                                placeholder="Search models..."
                                                value={modelSearchTerm}
                                                onChange={(e) => onModelSearchChange(e.target.value)}
                                                className="h-7 text-xs"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        <div className="max-h-[150px] overflow-y-auto">
                                            {models.map((model, idx) => {
                                                const modelId = typeof model === 'string' ? model : model.id
                                                const modelName = typeof model === 'string' ? model : model.name
                                                const modelDesc = typeof model === 'object' ? model.description : null
                                                return (
                                                    <SelectItem
                                                        key={`${agentId}-model-${modelPage}-${idx}`}
                                                        value={modelId}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span>{modelName}</span>
                                                            {modelDesc && (
                                                                <span className="text-[10px] text-muted-foreground">{modelDesc}</span>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                )
                                            })}
                                            {models.length === 0 && (
                                                <div className="p-2 text-xs text-muted-foreground text-center">
                                                    No models found
                                                </div>
                                            )}
                                        </div>
                                        {totalModelPages > 1 && (
                                            <div className="flex items-center justify-between px-2 py-1.5 border-t">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onModelPageChange(Math.max(0, modelPage - 1))
                                                    }}
                                                    disabled={modelPage === 0}
                                                >
                                                    <ChevronLeft className="h-3 w-3" />
                                                </Button>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {modelPage + 1} / {totalModelPages}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onModelPageChange(Math.min(totalModelPages - 1, modelPage + 1))
                                                    }}
                                                    disabled={modelPage >= totalModelPages - 1}
                                                >
                                                    <ChevronRight className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* System Prompt Select */}
                        <div>
                            <Label htmlFor={`${agentId}-system-prompt`} className="text-xs font-medium mb-1 block">
                                System prompt
                            </Label>
                            <div className="flex items-center gap-1">
                                <Select
                                    id={`${agentId}-system-prompt`}
                                    value={selectedPrompt}
                                    onValueChange={onPromptChange}
                                >
                                    <SelectTrigger className="h-8 flex-1">
                                        <SelectValue placeholder="Select prompt" />
                                    </SelectTrigger>
                                    <SelectContent 
                                        className="z-[9999]"
                                        sideOffset={5}
                                        position="popper"
                                    >
                                        <div onWheelCapture={(e) => e.stopPropagation()}>
                                            <div className="p-2 border-b">
                                                <Input
                                                    placeholder="Search prompts..."
                                                    value={promptSearchTerm}
                                                    onChange={(e) => onPromptSearchChange(e.target.value)}
                                                    className="h-7 text-xs"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                            <div className="max-h-[150px] overflow-y-auto">
                                                <SelectItem value="none">No prompt</SelectItem>
                                                {prompts.map((prompt) => (
                                                    <SelectItem 
                                                        key={`${agentId}-prompt-${promptPage}-${prompt.id}`} 
                                                        value={prompt.id}
                                                    >
                                                        {prompt.title || "Untitled"}
                                                    </SelectItem>
                                                ))}
                                                {prompts.length === 0 && promptSearchTerm && (
                                                    <div className="p-2 text-xs text-muted-foreground text-center">
                                                        No prompts found
                                                    </div>
                                                )}
                                            </div>
                                            {totalPromptPages > 1 && (
                                                <div className="flex items-center justify-between px-2 py-1.5 border-t">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onPromptPageChange(Math.max(0, promptPage - 1))
                                                        }}
                                                        disabled={promptPage === 0}
                                                    >
                                                        <ChevronLeft className="h-3 w-3" />
                                                    </Button>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {promptPage + 1} / {totalPromptPages}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onPromptPageChange(Math.min(totalPromptPages - 1, promptPage + 1))
                                                        }}
                                                        disabled={promptPage >= totalPromptPages - 1}
                                                    >
                                                        <ChevronRight className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </SelectContent>
                                </Select>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0"
                                            onClick={onRefresh}
                                            disabled={isRefreshing}
                                        >
                                            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Refresh prompts</TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </CardContent>
        </Card>
    )
}
