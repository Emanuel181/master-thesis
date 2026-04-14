"use client"

import * as React from "react"
import { usePathname } from "@/i18n/navigation"
import {
    BookOpen,
    Bot,
    SquareTerminal,
    FileText,
    MessageSquare,
    Home,
    PenLine,
    ShieldCheck,
    FileEdit,
    Heart,
    Users,
    GitBranch,
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
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@/components/ui/sidebar"
import { NavUser } from "./nav-user";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

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

export function AppSidebar({ onNavigate, activeComponent = "Home", ...props }) {
    const pathname = usePathname()
    const isDemo = pathname?.startsWith('/demo')
    const { data: session, status } = useSession()
    const [isAdmin, setIsAdmin] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)
    const t = useTranslations('dashboard');

    React.useEffect(() => { setMounted(true) }, [])

    // Check if user is admin
    React.useEffect(() => {
        const controller = new AbortController();

        const checkAdminStatus = async () => {
            if (!session?.user?.email || isDemo) {
                setIsAdmin(false);
                return;
            }

            try {
                const response = await fetch('/api/auth/admin-check', {
                    signal: controller.signal,
                });
                if (response.ok) {
                    const data = await response.json();
                    setIsAdmin(data.isAdmin);
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Error checking admin status:', error);
                    setIsAdmin(false);
                }
            }
        };

        checkAdminStatus();
        return () => controller.abort();
    }, [session, isDemo]);

    // Save user name to localStorage when session is loaded
    React.useEffect(() => {
        if (session?.user?.name) {
            try { localStorage.setItem("vulniq-user-name", session.user.name) } catch { /* ignore */ }
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
            title: "Code inspection",
            icon: SquareTerminal,
            url: "/dashboard?active=Code inspection",
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
            title: "Code Graph",
            url: "/dashboard?active=Code Graph",
            icon: GitBranch,
        },
        {
            title: "Write article",
            url: "/dashboard?active=Write article",
            icon: PenLine,
        },
    ];

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher team={data.team} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navMain} onNavigate={onNavigate} activeComponent={activeComponent} />

                {/* Admin Section - Only visible to admin users, only after mount to avoid hydration mismatch */}
                {mounted && isAdmin && (
                    <SidebarGroup>
                        <SidebarGroupLabel className="flex items-center gap-2">
                            <ShieldCheck className="size-4" />
                            Admin
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip="Review Articles">
                                        <Link href="/admin/articles">
                                            <FileEdit className="size-4" />
                                            <span>Review Articles</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip="Manage Users">
                                        <Link href="/admin/users">
                                            <Users className="size-4" />
                                            <span>Users</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild tooltip="Manage Supporters">
                                        <Link href="/admin/supporters">
                                            <Heart className="size-4" />
                                            <span>Supporters</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
            <SidebarFooter>
                {mounted && status === "loading" && !isDemo ? (
                    <div className="p-4 text-sm text-muted-foreground">Loading...</div>
                ) : mounted && (session?.user || isDemo) ? (
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
