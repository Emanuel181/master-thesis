"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
    BookOpen,
    Bot,
    SquareTerminal,
    FileText,
    MessageSquare,
    Home,
    Keyboard,
    PenLine,
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
            logo: "/web-app-manifest-512x512.png",
            plan: "Agentic",
        },
}

// Demo user for demo mode
const DEMO_USER = {
    id: 'demo-user',
    name: 'Demo User',
    email: 'demo@vulniq.com',
    image: null,
};

export function AppSidebar({ onNavigate, isCodeLocked = false, activeComponent = "Home", ...props }) {
    const pathname = usePathname()
    const isDemo = pathname?.startsWith('/demo')
    const { data: session, status } = useSession()

    // Save user name to localStorage when session is loaded
    React.useEffect(() => {
        if (session?.user?.name) {
            localStorage.setItem("vulniq-user-name", session.user.name)
        }
    }, [session])

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
        {
            title: "Write Article",
            url: "/dashboard?active=Write Article",
            icon: PenLine,
        },
    ];

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher team={data.team} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navMain} onNavigate={onNavigate} isCodeLocked={isCodeLocked} activeComponent={activeComponent} />
            </SidebarContent>
            <SidebarFooter>
                {status === "loading" && !isDemo ? (
                    <div className="p-4 text-sm text-muted-foreground">Loading...</div>
                ) : (session?.user || isDemo) ? (
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
                        <NavUser user={isDemo ? DEMO_USER : session.user} isDemo={isDemo} />
                    </>
                ) : (
                    <div className="p-4 text-sm text-muted-foreground">Not logged in</div>
                )}
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
