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
    // Model props
    selectedModel,
    onModelChange,
    models,
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
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">{title}</CardTitle>
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
                                    <SelectValue placeholder="Select model" />
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
                                            {models.map((model, idx) => (
                                                <SelectItem 
                                                    key={`${agentId}-model-${modelPage}-${idx}`} 
                                                    value={model}
                                                >
                                                    {model}
                                                </SelectItem>
                                            ))}
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
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={onRefresh}
                                    disabled={isRefreshing}
                                    title="Refresh prompts"
                                >
                                    <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </CardContent>
        </Card>
    )
}
