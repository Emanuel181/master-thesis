'use client'

import React, { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/dashboard/sidebar/app-sidebar"
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

import { CodeInput } from "@/components/dashboard/code-page/code-input";
import { ModelsDialog } from "@/components/dashboard/workflow-configuration-page/models-dialog";
import KnowledgeBaseVisualization from "@/components/dashboard/knowledge-base-page/knowledge-base-visualization";
import { ThemeToggle } from "@/components/theme-toggle";
import { CustomizationDialog } from "@/components/customization-dialog";
import { useSettings } from "@/contexts/settingsContext";
import { ProjectProvider, useProject } from "@/contexts/projectContext";

import { Results } from "@/components/dashboard/results-page/results";
import { FeedbackDialog } from "@/components/dashboard/sidebar/feedback-dialog";
import { HomePage } from "@/components/home/home-page";

// Helper to load saved code state
const loadSavedCodeState = () => {
    if (typeof window === 'undefined') return { code: '', codeType: '', isLocked: false };
    try {
        const saved = localStorage.getItem('vulniq_code_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                code: parsed.code || '',
                codeType: parsed.codeType || '',
                isLocked: parsed.isLocked || false
            };
        }
    } catch (err) {
        console.error("Error loading code state:", err);
    }
    return { code: '', codeType: '', isLocked: false };
};

// Inner component that can use useProject context
function DashboardContent({ settings, mounted }) {
    const { projectClearCounter } = useProject();
    const searchParams = useSearchParams()
    const [breadcrumbs, setBreadcrumbs] = useState([{ label: "Home", href: "/" }])
    const [activeComponent, setActiveComponent] = useState("Home")
    const [isModelsDialogOpen, setIsModelsDialogOpen] = useState(false)
    const [initialCode, setInitialCode] = useState(() => loadSavedCodeState().code);
    const [codeType, setCodeType] = useState(() => loadSavedCodeState().codeType);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isCodeLocked, setIsCodeLocked] = useState(() => loadSavedCodeState().isLocked);

    // Clear code state when project is cleared
    useEffect(() => {
        if (projectClearCounter > 0) {
            setInitialCode('');
            setCodeType('');
            setIsCodeLocked(false);
        }
    }, [projectClearCounter]);

    // Save code to localStorage when it changes
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const state = {
                code: initialCode,
                codeType: codeType,
                isLocked: isCodeLocked,
            };
            localStorage.setItem('vulniq_code_state', JSON.stringify(state));
        } catch (err) {
            console.error("Error saving code state to localStorage:", err);
        }
    }, [initialCode, codeType, isCodeLocked]);

    // Sidebar state based on sidebarMode setting
    const [sidebarOpen, setSidebarOpen] = useState(settings.sidebarMode !== 'icon')

    // Update sidebar state when sidebarMode setting changes
    useEffect(() => {
        if (mounted) {
            setSidebarOpen(settings.sidebarMode !== 'icon')
        }
    }, [settings.sidebarMode, mounted])

    // Handle navigation from URL params
    useEffect(() => {
        const active = searchParams.get('active')
        const workflow = searchParams.get('workflow')
        if (active) {
            setActiveComponent(active)
            if (active === "Home") {
                setBreadcrumbs([{ label: 'Home', href: '#' }])
            } else {
                const newBreadcrumbs = [
                    { label: 'Home', href: '#' },
                    { label: active, href: '#' }
                ]
                setBreadcrumbs(newBreadcrumbs)
            }
        }
        if (workflow === 'true') {
            setIsModelsDialogOpen(true)
        }
    }, [searchParams])

    const handleNavigation = (item) => {
        if (item.title === "Workflow configuration") {
            if (!isCodeLocked) {
                // Don't allow workflow configuration if code is not locked
                return;
            }
            setIsModelsDialogOpen(true)
            return
        }
        if (item.title === "Feedback") {
            setIsFeedbackOpen(true)
            return
        }

        if (item.title === "Home") {
            setBreadcrumbs([{ label: 'Home', href: '#' }])
        } else {
            const newBreadcrumbs = [
                { label: 'Home', href: '#' },
                { label: item.title, href: item.url }
            ]

            if (item.parent) {
                newBreadcrumbs.splice(1, 0, { label: item.parent, href: '#' })
            }

            setBreadcrumbs(newBreadcrumbs)
        }
        setActiveComponent(item.title)
    }

    const renderComponent = () => {
        switch (activeComponent) {
            case "Code input":
                return <CodeInput code={initialCode} setCode={setInitialCode} codeType={codeType} setCodeType={setCodeType} isLocked={isCodeLocked} onLockChange={setIsCodeLocked} />
            case "Knowledge base":
                return <KnowledgeBaseVisualization />
            case "Results":
                return <Results initialCode={initialCode} />
            case "Home":
                return <HomePage />
            default:
                return <CodeInput code={initialCode} setCode={setInitialCode} codeType={codeType} setCodeType={setCodeType} isLocked={isCodeLocked} onLockChange={setIsCodeLocked} />
        }
    }


    return (
        <SidebarProvider
            className="h-screen overflow-hidden"
            open={sidebarOpen}
            onOpenChange={setSidebarOpen}
        >
            <AppSidebar onNavigate={handleNavigation} isCodeLocked={isCodeLocked}/>
            <SidebarInset className="flex flex-col overflow-hidden">
                <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className={`flex items-center justify-between w-full gap-2 px-2 sm:px-4 ${activeComponent === "Home" ? "pr-4 sm:pr-7" : ""}`}>
                        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                            <SidebarTrigger className="-ml-1 flex-shrink-0" />
                            <Separator
                                orientation="vertical"
                                className="mr-1 sm:mr-2 data-[orientation=vertical]:h-4"
                            />
                            <Breadcrumb className="min-w-0">
                                <BreadcrumbList className="flex-nowrap">
                                    {breadcrumbs.map((crumb, index) => (
                                        <React.Fragment key={index}>
                                            <BreadcrumbItem className={index === 0 ? "hidden md:block" : "truncate"}>
                                                <BreadcrumbLink
                                                    href="#"
                                                    className="truncate max-w-[100px] sm:max-w-none cursor-pointer"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleNavigation({ title: crumb.label });
                                                    }}
                                                >
                                                    {crumb.label}
                                                </BreadcrumbLink>
                                            </BreadcrumbItem>
                                            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator className="hidden sm:block" />}
                                        </React.Fragment>
                                    ))}
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <CustomizationDialog showEditorTabs={activeComponent === "Code input"} />
                            <ThemeToggle />
                        </div>
                    </div>
                </header>
                <div className={`flex-1 flex flex-col overflow-hidden w-full ${
                    settings.contentLayout === 'centered' && activeComponent !== 'Home' ? 'mx-auto max-w-5xl px-2 sm:px-4' : 'px-2 sm:px-4'
                }`}>
                    {renderComponent()}
                </div>
            </SidebarInset>
            <ModelsDialog isOpen={isModelsDialogOpen} onOpenChange={setIsModelsDialogOpen} codeType={codeType} onCodeTypeChange={setCodeType} />
            <FeedbackDialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
        </SidebarProvider>
    );
}

export default function Page() {
    const { settings, mounted } = useSettings();

    return (
        <ProjectProvider>
            <DashboardContent settings={settings} mounted={mounted} />
        </ProjectProvider>
    );
}
