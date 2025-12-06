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
} from "@/components/ui/sidebar"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export function NavMain({ items, onNavigate, isCodeLocked = false }) {
    const renderIcon = (icon) => {
        if (!icon) return null;
        const IconComponent = icon;
        return <IconComponent />;
    };

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
                                    disabled={item.title === "Workflow configuration" && !isCodeLocked}
                                >
                                    {renderIcon(item.icon)}
                                    <span>{item.title}</span>
                                </SidebarMenuButton>
                                {item.title === "Workflow configuration" && !isCodeLocked && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-sidebar-accent opacity-70 hover:opacity-100 transition-opacity">
                                                <Info className="h-3 w-3" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" align="center">
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
    );
}
