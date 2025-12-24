"use client"

import * as React from "react"
import {
    BookOpen,
    Bot,
    SquareTerminal,
    FileText,
    MessageSquare,
    Home,
    Keyboard,
} from "lucide-react"

import { NavMain } from "./nav-main"
import { TeamSwitcher } from "./team-switcher"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import {NavUser} from "./nav-user";
import {useSession} from "next-auth/react";
import { usePrompts } from "@/contexts/promptsContext"
import { useUseCases } from "@/contexts/useCasesContext"
import { useProject } from "@/contexts/projectContext"

const data = {
    team: {
            name: "VulnIQ",
            logo: "/web-app-manifest-512x512.png",
            plan: "Agentic",
        },
}

export function AppSidebar({ onNavigate, isCodeLocked = false, ...props }) {
    const { data: session, status } = useSession()

    // Get counts from contexts for badges
    const { prompts } = usePrompts()
    const { useCases } = useUseCases()
    const { projectStructure } = useProject()

    // Calculate badge counts
    const badges = React.useMemo(() => {
        // Count total prompts
        const promptCount = prompts ? Object.values(prompts).reduce((sum, arr) => sum + (arr?.length || 0), 0) : 0

        // Count knowledge base categories
        const kbCount = useCases?.length || 0

        // Count files in project (rough count)
        let fileCount = 0
        const countFiles = (node) => {
            if (!node) return
            if (node.type === 'file') fileCount++
            if (node.children) node.children.forEach(countFiles)
        }
        if (projectStructure?.children) {
            projectStructure.children.forEach(countFiles)
        } else if (Array.isArray(projectStructure)) {
            projectStructure.forEach(countFiles)
        }

        return {
            prompts: promptCount,
            knowledgeBase: kbCount,
            files: fileCount,
            results: 0, // Results not implemented yet
        }
    }, [prompts, useCases, projectStructure])

    const navMain = [
        {
            title: "Home",
            icon: Home,
            isActive: true,
            url: "/dashboard?active=Home",
        },
        {
            title: "Code input",
            icon: SquareTerminal,
            url: "/dashboard?active=Code input",
        },
        {
            title: "Workflow configuration",
            url: "/dashboard?workflow=true",
            icon: Bot,
        },
        {
            title: "Knowledge base",
            url: "/dashboard?active=Knowledge base",
            icon: BookOpen,
        },
        {
            title: "Results",
            url: "/dashboard?active=Results",
            icon: FileText,
        },
    ];

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher team={data.team} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navMain} onNavigate={onNavigate} isCodeLocked={isCodeLocked} badges={badges} />
            </SidebarContent>
            <SidebarFooter>
                {status === "loading" ? (
                    <div className="p-4 text-sm text-muted-foreground">Loading...</div>
                ) : session?.user ? (
                    <>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={() => onNavigate({ title: "Feedback" })}
                                    tooltip="Send Feedback"
                                >
                                    <MessageSquare />
                                    <span>Feedback</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={() => window.dispatchEvent(new CustomEvent("open-keyboard-shortcuts"))}
                                    tooltip="Keyboard Shortcuts (⌘K)"
                                    className="justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <Keyboard className="size-4" />
                                        <span>Shortcuts</span>
                                    </div>
                                    <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground sm:inline-flex group-data-[collapsible=icon]:hidden">
                                        ⌘K
                                    </kbd>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                        <NavUser user={session.user}/>
                    </>
                ) : (
                    <div className="p-4 text-sm text-muted-foreground">Not logged in</div>
                )}
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
