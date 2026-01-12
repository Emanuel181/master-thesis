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
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { startSecurityAnalysis, getSelectedGroups } from "@/lib/start-analysis";
import { toast } from "sonner";

import { Results } from "@/components/dashboard/results-page/results";
import { FeedbackDialog } from "@/components/dashboard/sidebar/feedback-dialog";
import { HomePage } from "@/components/home/home-page";
import { ArticleEditor } from "@/components/dashboard/article-editor/article-editor";

// New feature imports
import { CommandPaletteProvider } from "@/components/ui/command";
import { NotificationProvider, NotificationCenter } from "@/components/ui/notification-center";
import { UnsavedChangesProvider } from "@/components/ui/unsaved-changes-provider";
import { OnboardingProvider } from "@/components/ui/onboarding";
import { ErrorBoundary, PageErrorBoundary } from "@/components/ui/error-boundary";
import { PageTransition } from "@/components/ui/page-transitions";
import { QuickFileSwitcherProvider } from "@/components/ui/quick-file-switcher";
import { SharedDndProvider } from "@/components/ui/dnd-provider";
import { KeyboardShortcutsDialog } from "@/components/ui/keyboard-shortcuts-dialog";
import { DashboardLoader } from "@/components/ui/dashboard-loader";
import { Button } from "@/components/ui/button";
import { Search, PersonStanding } from "lucide-react";
import { useAccessibility } from "@/contexts/accessibilityContext";

// Quick actions trigger button component
function QuickActionsTrigger() {
    return (
        <Button
            variant="outline"
            size="icon"
            onClick={() => window.dispatchEvent(new CustomEvent("open-keyboard-shortcuts"))}
            title="Quick actions"
        >
            <Search className="h-5 w-5" />
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
            title="Accessibility options"
        >
            <PersonStanding className="h-5 w-5" />
        </Button>
    )
}

// Helper to load saved code state - only call on client
const loadSavedCodeState = () => {
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

// Helper to load saved active page from localStorage - only call on client
const loadSavedActivePage = () => {
    try {
        const saved = localStorage.getItem('vulniq_active_page');
        if (saved) {
            return saved;
        }
    } catch (err) {
        console.error("Error loading active page:", err);
    }
    return 'Home';
};

// Inner component that can use useProject context
function DashboardContent({ settings, mounted }) {
    const { projectClearCounter, projectStructure, setSelectedFile, currentRepo } = useProject();
    const { setForceHideFloating } = useAccessibility();
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams()
    const [breadcrumbs, setBreadcrumbs] = useState([{ label: "Home", href: "/" }])
    // Initialize with defaults to avoid hydration mismatch, load from localStorage after mount
    const [activeComponent, setActiveComponent] = useState('Home')
    const [isModelsDialogOpen, setIsModelsDialogOpen] = useState(false)
    const [initialCode, setInitialCode] = useState('');
    const [codeType, setCodeType] = useState('');
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isCodeLocked, setIsCodeLocked] = useState(false);
    const [isStartingReview, setIsStartingReview] = useState(false);

    // Load saved state from localStorage after mount to avoid hydration mismatch
    useEffect(() => {
        const savedPage = loadSavedActivePage();
        const savedCodeState = loadSavedCodeState();
        setActiveComponent(savedPage);
        setInitialCode(savedCodeState.code);
        setCodeType(savedCodeState.codeType);
        setIsCodeLocked(savedCodeState.isLocked);
    }, []);

    // Auto-save selected group to localStorage when codeType changes
    useEffect(() => {
        if (codeType) {
            try {
                // Save the selected group as an array (the system expects an array of group IDs)
                localStorage.setItem('vulniq_selected_groups', JSON.stringify([codeType]));
                console.log('[Dashboard] Auto-saved selected group:', codeType);
            } catch (err) {
                console.error('[Dashboard] Error auto-saving selected group:', err);
            }
        }
    }, [codeType]);

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

    // Save active page to localStorage whenever it changes
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem('vulniq_active_page', activeComponent);
        } catch (err) {
            console.error("Error saving active page:", err);
        }
    }, [activeComponent]);

    // Initialize breadcrumbs based on active component on mount
    /* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect -- intentional: only run on mount to restore state */
    useEffect(() => {
        if (activeComponent && activeComponent !== "Home") {
            setBreadcrumbs([
                { label: 'Home', href: '#' },
                { label: activeComponent, href: '#' }
            ]);
        }
    }, []);
    /* eslint-enable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */

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

    // Handler for starting security review with orchestrator
    const handleStartReview = useCallback(async (code, codeType) => {
        if (!session?.user?.id) {
            toast.error('Please sign in to start a review');
            return;
        }

        // Check if we have either single file code or a project (from context)
        const hasSingleFile = code && code.trim().length > 0;
        const hasProject = projectStructure && Object.keys(projectStructure).length > 0;
        
        if (!hasSingleFile && !hasProject) {
            toast.error('Please enter code or import a project to review');
            return;
        }

        // For single file mode, require lock
        if (hasSingleFile && !hasProject && !isCodeLocked) {
            toast.error('Please lock your code first');
            return;
        }

        setIsStartingReview(true);

        try {
            // Get selected groups from workflow configuration or use the codeType
            let groupIds = getSelectedGroups();
            
            // If no groups selected in workflow config, but codeType is provided, use it
            if (groupIds.length === 0 && codeType) {
                groupIds = [codeType];
                // Save it to localStorage for consistency
                localStorage.setItem('vulniq_selected_groups', JSON.stringify(groupIds));
            }
            
            if (groupIds.length === 0) {
                toast.error('Please select a group in Code Input first');
                setIsStartingReview(false);
                return;
            }

            toast.loading('Starting security analysis...');

            // Prepare code payload
            let codePayload;
            if (hasProject) {
                try {
                    // Load all file contents from the project
                    const loadingToast = toast.loading('Loading project files...');
                    const filesWithContent = await loadAllProjectFiles(projectStructure, currentRepo);
                    
                    console.log('[handleStartReview] Loaded files:', filesWithContent.length);
                    
                    toast.dismiss(loadingToast);
                    
                    if (filesWithContent.length === 0) {
                        toast.error('No files found in project or failed to load files');
                        setIsStartingReview(false);
                        return;
                    }
                    
                    // Extract all files from project structure (from context)
                    codePayload = {
                        type: 'project',
                        files: filesWithContent,
                        projectName: currentRepo?.repo || 'Imported Project'
                    };
                    toast.loading(`Starting analysis of ${codePayload.files.length} files...`);
                } catch (loadError) {
                    console.error('[handleStartReview] Error loading files:', loadError);
                    toast.dismiss();
                    toast.error(`Failed to load project files: ${loadError.message}`);
                    setIsStartingReview(false);
                    return;
                }
            } else {
                // Single file
                codePayload = {
                    type: 'single',
                    content: code,
                    fileName: 'main'
                };
            }

            // Start the analysis
            const result = await startSecurityAnalysis({
                userId: session.user.id,
                groupIds,
                code: codePayload,
                codeType: codeType || 'Unknown',
            });

            toast.dismiss();
            toast.success('Analysis started!');
            
            // Store runId in localStorage for results page
            localStorage.setItem('vulniq_current_run_id', result.runId);
            
            // Switch to Results component (no route change)
            setActiveComponent('Results');
        } catch (error) {
            toast.dismiss();
            toast.error(error.message || 'Failed to start analysis');
            console.error('Start analysis error:', error);
        } finally {
            setIsStartingReview(false);
        }
    }, [session, isCodeLocked, currentRepo, projectStructure]);

    // Helper function to load all files from project with their content
    const loadAllProjectFiles = async (structure, repo) => {
        console.log('[loadAllProjectFiles] Starting, repo:', repo);
        console.log('[loadAllProjectFiles] Structure:', structure);
        
        const files = [];
        const { fetchFileContent } = await import('@/lib/github-api');
        
        // File extensions to analyze (code files only)
        const analyzableExtensions = new Set([
            'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rs', 
            'php', 'rb', 'swift', 'kt', 'scala', 'sql', 'sh', 'bash', 'html', 'css',
            'vue', 'svelte', 'json', 'yaml', 'yml', 'xml', 'md', 'txt'
        ]);
        
        const isAnalyzableFile = (fileName) => {
            const ext = fileName.split('.').pop()?.toLowerCase();
            return ext && analyzableExtensions.has(ext);
        };
        
        // Collect all file nodes first
        const fileNodes = [];
        const collectFiles = (node) => {
            if (!node) return;
            
            if (node.type === 'file' && isAnalyzableFile(node.name)) {
                fileNodes.push(node);
            } else if (node.type === 'folder' && node.children) {
                node.children.forEach(child => collectFiles(child));
            }
        };
        
        collectFiles(structure);
        console.log('[loadAllProjectFiles] Found', fileNodes.length, 'analyzable files');
        
        // Load files in batches with delay to avoid rate limiting
        const BATCH_SIZE = 5;
        const DELAY_MS = 1000; // 1 second between batches
        
        for (let i = 0; i < fileNodes.length; i += BATCH_SIZE) {
            const batch = fileNodes.slice(i, i + BATCH_SIZE);
            console.log(`[loadAllProjectFiles] Loading batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(fileNodes.length / BATCH_SIZE)}`);
            
            const batchPromises = batch.map(async (node) => {
                try {
                    console.log('[loadAllProjectFiles] Loading file:', node.path);
                    const fileWithContent = await fetchFileContent(
                        repo.owner, 
                        repo.repo, 
                        node.path, 
                        repo.provider || 'github'
                    );
                    
                    // Only include if content is not too large (max 1MB per file)
                    if (fileWithContent.content && fileWithContent.content.length < 1024 * 1024) {
                        console.log('[loadAllProjectFiles] Loaded file:', node.path, 'size:', fileWithContent.content.length);
                        return {
                            path: node.path,
                            content: fileWithContent.content,
                            language: detectLanguage(node.name)
                        };
                    } else {
                        console.log('[loadAllProjectFiles] Skipped large file:', node.path);
                        return null;
                    }
                } catch (error) {
                    console.error(`[loadAllProjectFiles] Failed to load file ${node.path}:`, error.message);
                    return null;
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            files.push(...batchResults.filter(f => f !== null));
            
            // Add delay between batches (except for the last batch)
            if (i + BATCH_SIZE < fileNodes.length) {
                console.log(`[loadAllProjectFiles] Waiting ${DELAY_MS}ms before next batch...`);
                await new Promise(resolve => setTimeout(resolve, DELAY_MS));
            }
        }
        
        console.log('[loadAllProjectFiles] Total files loaded:', files.length);
        return files;
    };

    // Helper function to extract all files from project structure (for already loaded content)
    const extractFilesFromProject = (structure) => {
        const files = [];
        
        const traverse = (node, path = '') => {
            if (!node) return;
            
            if (node.type === 'file' && node.content) {
                files.push({
                    path: path + node.name,
                    content: node.content,
                    language: node.language || detectLanguage(node.name)
                });
            } else if (node.type === 'folder' && node.children) {
                const folderPath = path + node.name + '/';
                node.children.forEach(child => traverse(child, folderPath));
            } else if (Array.isArray(node)) {
                node.forEach(item => traverse(item, path));
            } else if (typeof node === 'object') {
                Object.values(node).forEach(item => traverse(item, path));
            }
        };
        
        traverse(structure);
        return files;
    };
    
    // Helper to detect language from file extension
    const detectLanguage = (fileName) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const langMap = {
            'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
            'py': 'python', 'java': 'java', 'cpp': 'cpp', 'c': 'c', 'cs': 'csharp',
            'go': 'go', 'rs': 'rust', 'php': 'php', 'rb': 'ruby', 'swift': 'swift',
            'kt': 'kotlin', 'scala': 'scala', 'sql': 'sql', 'sh': 'shell', 'bash': 'shell'
        };
        return langMap[ext] || 'plaintext';
    };

    const renderComponent = () => {
        const content = (() => {
            switch (activeComponent) {
                case "Code input":
                    return <CodeInput 
                        code={initialCode} 
                        setCode={setInitialCode} 
                        codeType={codeType} 
                        setCodeType={setCodeType} 
                        isLocked={isCodeLocked} 
                        onLockChange={setIsCodeLocked}
                        onStart={handleStartReview}
                    />
                case "Knowledge base":
                    return <KnowledgeBaseVisualization />
                case "Results":
                    return <Results runId={localStorage.getItem('vulniq_current_run_id')} />
                case "Write article":
                    return <ArticleEditor />
                case "Home":
                    return <HomePage />
                default:
                    return <CodeInput 
                        code={initialCode} 
                        setCode={setInitialCode} 
                        codeType={codeType} 
                        setCodeType={setCodeType} 
                        isLocked={isCodeLocked} 
                        onLockChange={setIsCodeLocked}
                        onStart={handleStartReview}
                    />
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
                                                    <QuickActionsTrigger />
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
        <DashboardLoader minLoadTime={2000}>
            <SharedDndProvider>
                <ProjectProvider>
                    <Suspense fallback={null}>
                        <DashboardContent settings={settings} mounted={mounted} />
                    </Suspense>
                </ProjectProvider>
            </SharedDndProvider>
        </DashboardLoader>
    );
}
