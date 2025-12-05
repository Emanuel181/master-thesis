'use client'

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import ProfileHeader from "@/components/profile-page/profile-header"
import ProfileContent from "@/components/profile-page/profile-content"
import { ThemeToggle } from "@/components/theme-toggle"
import { CustomizationDialog } from "@/components/customization-dialog"
import { useSettings } from "@/contexts/settingsContext"
import { useSession } from "next-auth/react"

export default function ProfilePage() {
    const { settings, mounted } = useSettings()
    const { data: session } = useSession()
    const router = useRouter()

    // 1. Add State Management here
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleNavigation = (item) => {
        router.push('/dashboard')
    }

    const defaultSidebarOpen = useMemo(() => {
        return mounted ? settings.sidebarMode !== 'icon' : true
    }, [settings.sidebarMode, mounted])

    const sidebarKey = `${settings.sidebarMode}-${mounted}`

    // 2. Handlers to control the flow
    const handleEditStart = () => setIsEditing(true);
    const handleEditCancel = () => setIsEditing(false);

    // Called when the child component successfully saves data
    const handleSaveSuccess = () => {
        setIsEditing(false); // Switch back to Read-Only
        setIsSaving(false);
    };

    return (
        <SidebarProvider
            key={sidebarKey}
            className="h-screen overflow-hidden"
            defaultOpen={defaultSidebarOpen}
        >
            <AppSidebar onNavigate={handleNavigation} />
            <SidebarInset className="flex flex-col overflow-hidden">
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center justify-between w-full gap-2 px-4">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="-ml-1" />
                            <Separator
                                orientation="vertical"
                                className="mr-2 data-[orientation=vertical]:h-4"
                            />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href="/dashboard">
                                            Home
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbLink href="/profile">
                                            Profile
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                        <div className="flex items-center gap-2">
                            <CustomizationDialog />
                            <ThemeToggle />
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-auto relative">
                    <div className={`container mx-auto space-y-6 px-4 py-10 ${
                        settings.contentLayout === 'centered' ? 'max-w-5xl' : ''
                    }`}>

                        {/* 3. Pass state and handlers to Header */}
                        <ProfileHeader
                            user={session?.user}
                            isEditing={isEditing}
                            onEdit={handleEditStart}
                            onCancel={handleEditCancel}
                            isSaving={isSaving}
                        />

                        {/* 4. Pass state and handlers to Content */}
                        <ProfileContent
                            isEditing={isEditing}
                            onCancel={handleEditCancel}
                            onUpdateSavingState={setIsSaving}
                            onSaveSuccess={handleSaveSuccess}
                        />
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}