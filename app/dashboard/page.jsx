'use client'

import React, { useState, useEffect, Suspense, useCallback } from "react"
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

// New feature imports
import { CommandPaletteProvider, useCommandPalette } from "@/components/ui/command";
import { NotificationProvider, NotificationCenter } from "@/components/ui/notification-center";
import { UnsavedChangesProvider } from "@/components/ui/unsaved-changes-provider";
import { OnboardingProvider } from "@/components/ui/onboarding";
import { ErrorBoundary, PageErrorBoundary } from "@/components/ui/error-boundary";
import { PageTransition } from "@/components/ui/page-transitions";
import { QuickFileSwitcherProvider } from "@/components/ui/quick-file-switcher";
import { SharedDndProvider } from "@/components/ui/dnd-provider";
import { KeyboardShortcutsDialog } from "@/components/ui/keyboard-shortcuts-dialog";
import { Button } from "@/components/ui/button";
import { Keyboard, PersonStanding } from "lucide-react";
import { useAccessibility } from "@/contexts/accessibilityContext";

// Command palette trigger button component
function CommandPaletteTrigger() {
    const { setOpen } = useCommandPalette()

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={() => setOpen(true)}
            title="Command Palette (Ctrl+K)"
        >
            <Keyboard className="h-5 w-5" />
        </Button>
    )
}

// Accessibility button component for dashboard
function AccessibilityTrigger() {
    const { openPanel } = useAccessibility()

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={openPanel}
            title="Accessibility Options"
        >
            <PersonStanding className="h-5 w-5" />
        </Button>
    )
}

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
    const { projectClearCounter, projectStructure, setSelectedFile } = useProject();
    const { setForceHideFloating } = useAccessibility();
    const searchParams = useSearchParams()
    const [breadcrumbs, setBreadcrumbs] = useState([{ label: "Home", href: "/" }])
    const [activeComponent, setActiveComponent] = useState("Home")
    const [isModelsDialogOpen, setIsModelsDialogOpen] = useState(false)
    const [initialCode, setInitialCode] = useState(() => loadSavedCodeState().code);
    const [codeType, setCodeType] = useState(() => loadSavedCodeState().codeType);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isCodeLocked, setIsCodeLocked] = useState(() => loadSavedCodeState().isLocked);

    // Hide floating accessibility button on dashboard (use header icon instead)
    useEffect(() => {
        setForceHideFloating(true);
        return () => setForceHideFloating(false);
    }, [setForceHideFloating]);

    // Listen for open-feedback event (from command palette shortcut)
    useEffect(() => {
        const handleOpenFeedback = () => setIsFeedbackOpen(true);
        window.addEventListener("open-feedback", handleOpenFeedback);
        return () => window.removeEventListener("open-feedback", handleOpenFeedback);
    }, []);

    // Clear code state when project is cleared
    // This intentionally responds to projectClearCounter changes from context
    /* eslint-disable react-hooks/set-state-in-effect -- intentional: responding to external clear signal */
    useEffect(() => {
        if (projectClearCounter > 0) {
            setInitialCode('');
            setCodeType('');
            setIsCodeLocked(false);
        }
    }, [projectClearCounter]);
    /* eslint-enable react-hooks/set-state-in-effect */

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
    /* eslint-disable react-hooks/set-state-in-effect -- intentional: sync sidebar state with settings */
    useEffect(() => {
        if (mounted) {
            setSidebarOpen(settings.sidebarMode !== 'icon')
        }
    }, [settings.sidebarMode, mounted])
    /* eslint-enable react-hooks/set-state-in-effect */

    // Handle navigation from URL params
    /* eslint-disable react-hooks/set-state-in-effect -- intentional: sync state with URL params */
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
    /* eslint-enable react-hooks/set-state-in-effect */

    const handleNavigation = useCallback((item) => {
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
    }, [isCodeLocked, setIsModelsDialogOpen, setIsFeedbackOpen, setBreadcrumbs, setActiveComponent]);

    const renderComponent = () => {
        const content = (() => {
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
        })();

        return (
            <PageErrorBoundary pageName={activeComponent}>
                <PageTransition pageKey={activeComponent} variant="default">
                    {content}
                </PageTransition>
            </PageErrorBoundary>
        );
    }


    return (
        <ErrorBoundary title="Dashboard Error" description="There was a problem loading the dashboard.">
            <NotificationProvider>
                <UnsavedChangesProvider>
                    <OnboardingProvider>
                        <CommandPaletteProvider
                            onNavigate={handleNavigation}
                            isCodeLocked={isCodeLocked}
                            activeComponent={activeComponent}
                        >
                            <QuickFileSwitcherProvider
                                projectStructure={projectStructure}
                                onFileSelect={(file) => {
                                    setSelectedFile(file);
                                    if (activeComponent !== "Code input") {
                                        handleNavigation({ title: "Code input" });
                                    }
                                }}
                            >
                                <SidebarProvider
                                    className="h-screen overflow-hidden"
                                    open={sidebarOpen}
                                    onOpenChange={setSidebarOpen}
                                >
                                    <AppSidebar onNavigate={handleNavigation} isCodeLocked={isCodeLocked} activeComponent={activeComponent}/>
                                    <SidebarInset className="flex flex-col overflow-hidden">
                                        <header className="flex h-12 sm:h-14 md:h-16 shrink-0 items-center gap-1 sm:gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-border/40">
                                            <div className={`flex items-center justify-between w-full gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 ${activeComponent === "Home" ? "pr-2 sm:pr-4 md:pr-7" : ""}`}>
                                                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                                    <SidebarTrigger className="-ml-1 flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9" />
                                                    <Separator
                                                        orientation="vertical"
                                                        className="mr-1 sm:mr-2 data-[orientation=vertical]:h-4 hidden xs:block"
                                                    />
                                                    <Breadcrumb className="min-w-0 hidden xs:block">
                                                        <BreadcrumbList className="flex-nowrap">
                                                            {breadcrumbs.map((crumb, index) => (
                                                                <React.Fragment key={index}>
                                                                    <BreadcrumbItem className={index === 0 ? "hidden md:block" : "truncate"}>
                                                                        <BreadcrumbLink
                                                                            href="#"
                                                                            className="truncate max-w-[80px] sm:max-w-[100px] md:max-w-none cursor-pointer text-xs sm:text-sm"
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
                                                    {/* Mobile breadcrumb - just show current page */}
                                                    <span className="xs:hidden text-sm font-medium truncate">
                                                        {breadcrumbs[breadcrumbs.length - 1]?.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                                    <CommandPaletteTrigger />
                                                    <NotificationCenter />
                                                    <AccessibilityTrigger />
                                                    <CustomizationDialog showEditorTabs={activeComponent === "Code input"} />
                                                    <ThemeToggle />
                                                </div>
                                            </div>
                                        </header>
                                        <div id="main-content" className={`flex-1 flex flex-col overflow-hidden w-full ${
                                            settings.contentLayout === 'centered' && activeComponent !== 'Home' 
                                                ? 'mx-auto max-w-full sm:max-w-5xl px-2 sm:px-3 md:px-4' 
                                                : 'px-2 sm:px-3 md:px-4'
                                        } pb-safe`}>
                                            {renderComponent()}
                                        </div>
                                    </SidebarInset>
                                    <ModelsDialog isOpen={isModelsDialogOpen} onOpenChange={setIsModelsDialogOpen} codeType={codeType} onCodeTypeChange={setCodeType} />
                                    <FeedbackDialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
                                    <KeyboardShortcutsDialog />
                                </SidebarProvider>
                            </QuickFileSwitcherProvider>
                        </CommandPaletteProvider>
                    </OnboardingProvider>
                </UnsavedChangesProvider>
            </NotificationProvider>
        </ErrorBoundary>
    );
}

export default function Page() {
    const { settings, mounted } = useSettings();

    return (
        <SharedDndProvider>
            <ProjectProvider>
                <Suspense fallback={null}>
                    <DashboardContent settings={settings} mounted={mounted} />
                </Suspense>
            </ProjectProvider>
        </SharedDndProvider>
    );
}
