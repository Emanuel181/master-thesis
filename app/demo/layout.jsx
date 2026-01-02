'use client'

import React, { useState, useEffect, Suspense, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
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

import { ModelsDialog } from "@/components/dashboard/workflow-configuration-page/models-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { CustomizationDialog } from "@/components/customization-dialog";
import { useSettings } from "@/contexts/settingsContext";
import { ProjectProvider, useProject } from "@/contexts/projectContext";
import { useDemo, DEMO_CODE, DEMO_PROJECT_STRUCTURE } from "@/contexts/demoContext";

import { FeedbackDialog } from "@/components/dashboard/sidebar/feedback-dialog";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// New feature imports
import { CommandPaletteProvider, useCommandPalette } from "@/components/ui/command";
import { NotificationProvider, NotificationCenter } from "@/components/ui/notification-center";
import { UnsavedChangesProvider } from "@/components/ui/unsaved-changes-provider";
import { OnboardingProvider } from "@/components/ui/onboarding";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { QuickFileSwitcherProvider } from "@/components/ui/quick-file-switcher";
import { SharedDndProvider } from "@/components/ui/dnd-provider";
import { KeyboardShortcutsDialog } from "@/components/ui/keyboard-shortcuts-dialog";
import { Keyboard, PersonStanding, Sparkles, Home } from "lucide-react";
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

// Map route segments to display names and active component names
const routeToComponent = {
    'home': 'Home',
    'code-input': 'Code input',
    'knowledge-base': 'Knowledge base',
    'results': 'Results',
    'profile': 'Profile',
};

// Inner component that can use useProject context
function DemoLayoutContent({ settings, mounted, children }) {
    const { projectStructure, setProjectStructure, setSelectedFile, projectUnloaded } = useProject();
    const { setForceHideFloating } = useAccessibility();
    const { enableDemoMode } = useDemo();
    const router = useRouter();
    const pathname = usePathname();
    
    // Determine active component from pathname
    const currentSegment = pathname.split('/').pop() || 'home';
    const activeComponent = routeToComponent[currentSegment] || 'Home';
    
    const [breadcrumbs, setBreadcrumbs] = useState([{ label: "Home", href: "/demo/home" }])
    const [isModelsDialogOpen, setIsModelsDialogOpen] = useState(false)
    const [codeType, setCodeType] = useState("JavaScript");
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    // Use shared isCodeLocked state from DemoContext
    const { isCodeLocked } = useDemo();

    // Enable demo mode and set demo project structure on mount (only if not explicitly unloaded)
    useEffect(() => {
        enableDemoMode();
        if (!projectStructure && !projectUnloaded) {
            setProjectStructure(DEMO_PROJECT_STRUCTURE);
        }
    }, [enableDemoMode, setProjectStructure, projectStructure, projectUnloaded]);

    // Update breadcrumbs when route changes
    useEffect(() => {
        if (activeComponent === "Home") {
            setBreadcrumbs([{ label: 'Home', href: '/demo/home' }])
        } else {
            setBreadcrumbs([
                { label: 'Home', href: '/demo/home' },
                { label: activeComponent, href: pathname }
            ])
        }
    }, [activeComponent, pathname]);

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

    // Sidebar state based on sidebarMode setting
    const [sidebarOpen, setSidebarOpen] = useState(settings.sidebarMode !== 'icon')

    // Update sidebar state when sidebarMode setting changes
    useEffect(() => {
        if (mounted) {
            setSidebarOpen(settings.sidebarMode !== 'icon')
        }
    }, [settings.sidebarMode, mounted])

    const handleNavigation = useCallback((item) => {
        if (item.title === "Workflow configuration") {
            if (!isCodeLocked) {
                // Don't open workflow config if code is not locked
                return;
            }
            setIsModelsDialogOpen(true)
            return
        }
        if (item.title === "Feedback") {
            setIsFeedbackOpen(true)
            return
        }

        // Map component names to routes
        const routeMap = {
            'Home': '/demo/home',
            'Code input': '/demo/code-input',
            'Knowledge base': '/demo/knowledge-base',
            'Results': '/demo/results',
            'Profile': '/demo/profile',
        };

        const route = routeMap[item.title];
        if (route) {
            router.push(route);
        }
    }, [router, setIsModelsDialogOpen, setIsFeedbackOpen, isCodeLocked]);

    const handleExitDemo = () => {
        router.push('/');
    };

    return (
        <ErrorBoundary title="Demo Dashboard Error" description="There was a problem loading the demo dashboard.">
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
                                        router.push('/demo/code-input');
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
                                                    {/* Demo Mode Badge */}
                                                    <Badge variant="secondary" className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 hidden sm:flex flex-shrink-0">
                                                        <Sparkles className="w-3 h-3" />
                                                        Demo Mode
                                                    </Badge>
                                                    <Breadcrumb className="min-w-0 hidden md:block">
                                                        <BreadcrumbList className="flex-nowrap">
                                                            {breadcrumbs.map((crumb, index) => (
                                                                <React.Fragment key={index}>
                                                                    <BreadcrumbItem className={index === 0 ? "hidden lg:block" : "truncate"}>
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
                                                                    {index < breadcrumbs.length - 1 && <BreadcrumbSeparator className="hidden lg:block" />}
                                                                </React.Fragment>
                                                            ))}
                                                        </BreadcrumbList>
                                                    </Breadcrumb>
                                                    {/* Mobile breadcrumb - just show current page */}
                                                    <span className="md:hidden text-sm font-medium truncate">
                                                        {breadcrumbs[breadcrumbs.length - 1]?.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleExitDemo}
                                                        className="gap-1.5 text-xs h-8"
                                                    >
                                                        <Home className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">Exit Demo</span>
                                                    </Button>
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
                                            {children}
                                        </div>
                                    </SidebarInset>
                                    <ModelsDialog isOpen={isModelsDialogOpen} onOpenChange={setIsModelsDialogOpen} codeType={codeType} onCodeTypeChange={setCodeType} />
                                    <FeedbackDialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} isDemo={true} />
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

export default function DemoLayout({ children }) {
    const { settings, mounted } = useSettings();

    return (
        <SharedDndProvider>
            <ProjectProvider>
                <Suspense fallback={null}>
                    <DemoLayoutContent settings={settings} mounted={mounted}>
                        {children}
                    </DemoLayoutContent>
                </Suspense>
            </ProjectProvider>
        </SharedDndProvider>
    );
}
