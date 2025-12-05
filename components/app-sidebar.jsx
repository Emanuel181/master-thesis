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
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"
import {NavUser} from "@/components/nav-user";
import {useSession} from "next-auth/react";

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
            title: "Workflow configuration",
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
    const { data: session, status } = useSession()
    console.log("Session:", session, "Status:", status)

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher team={data.team} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} onNavigate={onNavigate} />
            </SidebarContent>
            <SidebarFooter>
                {status === "loading" ? (
                    <div className="p-4 text-sm text-muted-foreground">Loading...</div>
                ) : session?.user ? (
                    <NavUser user={session.user}/>
                ) : (
                    <div className="p-4 text-sm text-muted-foreground">Not logged in</div>
                )}
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
