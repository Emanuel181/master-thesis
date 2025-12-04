'use client'

import React from "react"
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
import ProfileHeader from "@/components/examples/profile-page/components/profile-header"
import ProfileContent from "@/components/examples/profile-page/components/profile-content"
import { ThemeToggle } from "@/components/theme-toggle"
import { CustomizationDialog } from "@/components/customization-dialog"

export default function ProfilePage() {
    return (
        <SidebarProvider className="h-screen overflow-hidden">
            <AppSidebar />
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
                    <div className="container mx-auto space-y-6 px-4 py-10">
                        <ProfileHeader />
                        <ProfileContent />
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

