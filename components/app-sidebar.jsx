"use client"

import * as React from "react"
import {
    BookOpen,
    Bot,
    Frame,
    ShieldCheck ,
    Map,
    PieChart,
    Settings2,
    SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"

const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
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
            title: "Documentation",
            url: "#",
            icon: BookOpen,
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
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
