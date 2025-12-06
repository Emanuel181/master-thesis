"use client"

import * as React from "react"
import {
    BookOpen,
    Bot,
    ShieldCheck,
    SquareTerminal,
    FileText,
    MessageSquare,
    Home,
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

const data = {
    team: {
            name: "VulnIQ",
            logo: "https://amz-s3-pdfs-gp.s3.us-east-1.amazonaws.com/logo/logo.png",
            plan: "Agentic",
        },
    navMain: [
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
    ],
}

export function AppSidebar({ onNavigate, isCodeLocked = false, ...props }) {
    const { data: session, status } = useSession()
    console.log("Session:", session, "Status:", status)

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher team={data.team} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} onNavigate={onNavigate} isCodeLocked={isCodeLocked} />
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
                                >
                                    <MessageSquare />
                                    <span>Feedback</span>
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
