"use client"

import * as React from "react"
import {
    BookOpen,
    Bot,
    ShieldCheck,
    SquareTerminal,
    FileText,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { TeamSwitcher } from "@/components/team-switcher"
import { ModeToggle } from "@/components/mode-toggle"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"

const data = {
    team: {
            name: "Code security enhancer",
            logo: ShieldCheck,
            plan: "Agentic",
        },
    navMain: [
        {
            title: "Code input",
            icon: SquareTerminal,
            isActive: true,
            url: "#",
        },
        {
            title: "Models",
            url: "#",
            icon: Bot,
        },
        {
            title: "Knowledge base",
            url: "#",
            icon: BookOpen,
        },
        {
            title: "Results",
            url: "#",
            icon: FileText,
        },
    ],
}

export function AppSidebar({ onNavigate, ...props }) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher team={data.team} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} onNavigate={onNavigate} />
            </SidebarContent>
            <SidebarFooter>
                <div className="p-2">
                    <ModeToggle />
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
