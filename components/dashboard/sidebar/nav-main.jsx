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

// Active indicator dot component
function ActiveIndicator({ isActive, isCollapsed }) {
    if (!isActive) return null

    if (isCollapsed) {
        // For collapsed sidebar - show a small dot on the right
        return (
            <span className="absolute right-0 top-1/2 -translate-y-1/2 flex h-1.5 w-1.5">
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary"></span>
            </span>
        )
    }

    // For expanded sidebar - show a dot/indicator on the right
    return (
        <span className="ml-auto flex h-2 w-2 items-center justify-center">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
        </span>
    )
}

export function NavMain({ items, onNavigate, isCodeLocked = false, activeComponent = "Home" }) {
    const renderIcon = (icon) => {
        if (!icon) return null
        const IconComponent = icon
        return <IconComponent />
    }

    const { state } = useSidebar()
    const isCollapsed = state === "collapsed"

    // Check if an item is the active page
    const isItemActive = (title) => {
        return title === activeComponent
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
                                    tooltip={item.title}
                                    onClick={() => onNavigate(item)}
                                    disabled={item.title === "Workflow configuration" && !isCodeLocked ? true : undefined}
                                    data-active={isItemActive(item.title)}
                                    className={cn(
                                        isItemActive(item.title) && "bg-sidebar-accent text-sidebar-accent-foreground"
                                    )}
                                >
                                    {renderIcon(item.icon)}
                                    <span className="flex-1">{item.title}</span>
                                    <ActiveIndicator isActive={isItemActive(item.title)} isCollapsed={isCollapsed} />
                                </SidebarMenuButton>
                                {item.title === "Workflow configuration" && !isCodeLocked && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button className={`absolute ${isCollapsed ? "-right-1 top-0" : "right-2 top-1/2 -translate-y-1/2"} p-1 rounded-md hover:bg-sidebar-accent opacity-70 hover:opacity-100 transition-opacity`}>
                                                <Info className="h-3 w-3" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side={isCollapsed ? "top" : "right"} align="center">
                                            <p>Workflow configuration is only available after locking your code</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </SidebarMenuItem>
                        )
                    )}
                </SidebarMenu>
            </SidebarGroup>
        </TooltipProvider>
    )
}
