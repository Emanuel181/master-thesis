'use client'

import React, { useState } from "react"
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

import { CodeInput } from "@/components/code-input";
import { ModelsDialog } from "@/components/models-dialog";
import { Documentation } from "@/components/documentation";

export default function Page() {
    const [breadcrumbs, setBreadcrumbs] = useState([{ label: "Home", href: "/" }])
    const [activeComponent, setActiveComponent] = useState("Code input")
    const [isModelsDialogOpen, setIsModelsDialogOpen] = useState(false)

    const handleNavigation = (item) => {
        if (item.title === "Models") {
            setIsModelsDialogOpen(true)
            return
        }

        const newBreadcrumbs = [
            { label: 'Home', href: '#' },
            { label: item.title, href: item.url }
        ]

        if (item.parent) {
            newBreadcrumbs.splice(1, 0, { label: item.parent, href: '#' })
        }

        setBreadcrumbs(newBreadcrumbs)
        setActiveComponent(item.title)
    }

    const renderComponent = () => {
        switch (activeComponent) {
            case "Code input":
                return <CodeInput />
            case "Documentation":
                return <Documentation />
            default:
                return <CodeInput />
        }
    }

    return (
        <SidebarProvider>
            <AppSidebar onNavigate={handleNavigation} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                {breadcrumbs.map((crumb, index) => (
                                    <React.Fragment key={index}>
                                        <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                                            <BreadcrumbLink href={crumb.href}>
                                                {crumb.label}
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                                    </React.Fragment>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                {renderComponent()}
            </SidebarInset>
            <ModelsDialog isOpen={isModelsDialogOpen} onOpenChange={setIsModelsDialogOpen} />
        </SidebarProvider>
    )
}
