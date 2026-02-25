"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
    LayoutDashboard,
    ChevronUp,
    ChevronDown,
    RotateCcw,
    GripVertical,
    Home,
    BarChart3,
    Activity,
    FolderGit2,
} from "lucide-react"

const SECTION_META = {
    welcome: { label: "Welcome banner", icon: Home },
    stats: { label: "Stats overview", icon: BarChart3 },
    activity: { label: "Scans & findings", icon: Activity },
    repos: { label: "Repos & prompts", icon: FolderGit2 },
}

/**
 * LayoutCustomizer — popover that lets users reorder home page sections.
 */
export function LayoutCustomizer({
    sectionOrder,
    onMoveUp,
    onMoveDown,
    onReset,
    repoSwapped,
    rightSwapped,
    columnsSwapped,
    onSwapRepos,
    onSwapRight,
    onSwapColumns,
}) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Customize</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-0">
                <div className="p-3 pb-2">
                    <p className="text-xs font-semibold">Layout order</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        Reorder sections on your home page
                    </p>
                </div>
                <Separator />
                <div className="p-2 space-y-0.5">
                    {sectionOrder.map((id, idx) => {
                        const meta = SECTION_META[id]
                        if (!meta) return null
                        const Icon = meta.icon
                        const isFirst = idx === 0
                        const isLast = idx === sectionOrder.length - 1

                        return (
                            <div
                                key={id}
                                className="flex items-center gap-1.5 p-1.5 rounded-md hover:bg-accent group"
                            >
                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-xs flex-1 truncate">{meta.label}</span>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5"
                                        disabled={isFirst}
                                        onClick={() => onMoveUp(id)}
                                    >
                                        <ChevronUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5"
                                        disabled={isLast}
                                        onClick={() => onMoveDown(id)}
                                    >
                                        <ChevronDown className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <Separator />
                <div className="p-2 space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground px-1.5 mb-1">
                        Panel swaps
                    </p>
                    <SwapToggle
                        label="Swap left / right columns"
                        active={columnsSwapped}
                        onClick={onSwapColumns}
                    />
                    <SwapToggle
                        label="Swap GitHub / GitLab"
                        active={repoSwapped}
                        onClick={onSwapRepos}
                    />
                    <SwapToggle
                        label="Swap prompts / project"
                        active={rightSwapped}
                        onClick={onSwapRight}
                    />
                </div>
                <Separator />
                <div className="p-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
                        onClick={onReset}
                    >
                        <RotateCcw className="h-3 w-3 mr-1.5" />
                        Reset to default
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

function SwapToggle({ label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-1.5 rounded-md hover:bg-accent text-left"
        >
            <span className="text-xs">{label}</span>
            <div
                className={`w-7 h-4 rounded-full transition-colors flex items-center px-0.5 ${
                    active ? "bg-primary" : "bg-muted"
                }`}
            >
                <div
                    className={`w-3 h-3 rounded-full bg-background shadow-sm transition-transform ${
                        active ? "translate-x-3" : "translate-x-0"
                    }`}
                />
            </div>
        </button>
    )
}

