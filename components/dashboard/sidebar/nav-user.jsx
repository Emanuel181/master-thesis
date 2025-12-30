"use client"

import {
    IconDotsVertical,
    IconLogout,
    IconUserCircle,
} from "@tabler/icons-react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import { clearDemoStorage, isDemoPath } from "@/lib/demo-mode"

// SECURITY: Clear all app state from localStorage on logout
// Clears only production keys - demo state is handled separately
const clearAllAppState = (isDemo = false) => {
    try {
        if (isDemo) {
            // In demo mode, use the centralized demo cleanup
            clearDemoStorage();
        } else {
            // Production mode: clear production keys only
            localStorage.removeItem('vulniq_project_state');
            localStorage.removeItem('vulniq_code_state');
            localStorage.removeItem('vulniq_editor_tabs');
            localStorage.removeItem('vulniq_editor_language');
            localStorage.removeItem('app-settings');
        }
    } catch (err) {
        console.error("Error clearing app state on logout:", err);
    }
};

const handleLogout = () => {
    clearAllAppState(false); // Production logout
    signOut({ callbackUrl: "/login" });
};

export function NavUser({
                            user,
                            isDemo = false,
                        }){
    const { isMobile } = useSidebar()
    const router = useRouter()
    const pathname = usePathname()
    
    // SECURITY: Derive demo mode from pathname for reliable detection
    const inDemoMode = isDemo || isDemoPath(pathname)

    const handleDemoLogout = () => {
        clearAllAppState(true); // Demo logout
        toast.success('Demo logout successful! Redirecting...');
        setTimeout(() => {
            router.push('/');
        }, 1000);
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={user.image} alt={user.name} />
                                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{user.name}</span>
                                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
                            </div>
                            <IconDotsVertical className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={user.image} alt={user.name} />
                                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{user.name}</span>
                                    <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => router.push(isDemo ? "/demo/profile" : "/profile")}>
                                <IconUserCircle />
                                Account
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={isDemo ? handleDemoLogout : handleLogout}>
                            <IconLogout />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
