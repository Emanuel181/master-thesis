"use client"

import { ChevronRight, Info } from "lucide-react"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Badge component for counts
function CountBadge({ count, className }) {
    if (!count || count <= 0) return null

    return (
        <span
            className={cn(
                "ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary",
                className
            )}
        >
            {count > 99 ? "99+" : count}
        </span>
    )
}

export function NavMain({ items, onNavigate, isCodeLocked = false, badges = {} }) {
    const renderIcon = (icon) => {
        if (!icon) return null
        const IconComponent = icon
        return <IconComponent />
    }

    const { state } = useSidebar()

    // Get badge count for an item (only show for Home)
    const getBadgeCount = (title) => {
        const badgeMap = {
            Home: badges.prompts,
            // Removed badges from Code input and Knowledge base
        }
        return badgeMap[title] || 0
    }

    return (
        <TooltipProvider>
            <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarMenu>
                    {items.map((item) =>
                        item.items && item.items.length > 0 ? (
                            <Collapsible
                                key={item.title}
                                asChild
                                defaultOpen={item.isActive}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip={item.title}>
                                            {renderIcon(item.icon)}
                                            <span>{item.title}</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {item.items?.map((subItem) => (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton
                                                        onClick={() =>
                                                            onNavigate({ ...subItem, parent: item.title })
                                                        }
                                                    >
                                                        <span>{subItem.title}</span>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        ) : (
                            <SidebarMenuItem key={item.title} className="relative">
                                <SidebarMenuButton
                                    tooltip=""
                                    onClick={() => onNavigate(item)}
                                    disabled={item.title === "Workflow configuration" && !isCodeLocked ? true : undefined}
                                >
                                    {renderIcon(item.icon)}
                                    <span className="flex-1">{item.title}</span>
                                    {state !== "collapsed" && (
                                        <CountBadge count={getBadgeCount(item.title)} />
                                    )}
                                </SidebarMenuButton>
                                {item.title === "Workflow configuration" && !isCodeLocked && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button className={`absolute ${state === "collapsed" ? "-right-1 top-0" : "right-2 top-1/2 -translate-y-1/2"} p-1 rounded-md hover:bg-sidebar-accent opacity-70 hover:opacity-100 transition-opacity`}>
                                                <Info className="h-3 w-3" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side={state === "collapsed" ? "top" : "right"} align="center">
                                            <p>Workflow configuration is only available after locking your code</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {/* Show badge as dot in collapsed state */}
                                {state === "collapsed" && getBadgeCount(item.title) > 0 && (
                                    <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                                    </span>
                                )}
                            </SidebarMenuItem>
                        )
                    )}
                </SidebarMenu>
            </SidebarGroup>
        </TooltipProvider>
    )
}
