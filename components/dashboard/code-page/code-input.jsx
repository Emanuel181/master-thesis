"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import "@/lib/monaco-config"; // Must be imported before Editor
import "prismjs/themes/prism.css";
import "@/app/github-theme.css";

// Dynamic import for Monaco Editor to avoid SSR issues
const Editor = dynamic(
    () => import("@monaco-editor/react").then(mod => mod.default),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-full w-full bg-muted/30">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">Loading editor...</span>
                </div>
            </div>
        )
    }
);
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X, FolderX } from "lucide-react";
import { toast } from "sonner";
import { formatCode } from "@/lib/code-formatter";
import { useUseCases } from "@/contexts/useCasesContext";
import { useProject } from "@/contexts/projectContext";
import ProjectTree from './project-tree';

// Import extracted modules
import {
    displayLanguages,
    supportedLanguages,
    formattableLanguages,
    reviewableLanguages,
    viewOnlyExtensions,
    BASE_PLACEHOLDER,
    commentPrefixFor,
    detectLanguageFromContent,
} from './constants';

import {
    useProviderConnection,
    useRepoImport,
    useEditorTabs,
    useEditorConfig,
} from './hooks';

import {
    ImportDialog,
    EditorTabs,
    EditorHeader,
} from './components';

const LANGUAGE_STORAGE_KEY = 'vulniq_editor_language';

// Helper to load saved language state
const loadSavedLanguage = () => {
    if (typeof window === 'undefined') return { name: "JavaScript", prism: "javascript" };
    try {
        const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.name && parsed.prism) {
                return parsed;
            }
        }
    } catch (err) {
        console.error("Error loading language from localStorage:", err);
    }
    return { name: "JavaScript", prism: "javascript" };
};

export function CodeInput({ code, setCode, codeType, setCodeType, onStart, isLocked, onLockChange }) {
    // --- Configuration State ---
    const [language, setLanguageState] = useState(() => loadSavedLanguage());
    const [isFormatting, setIsFormatting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Wrapper to persist language changes
    const setLanguage = useCallback((lang) => {
        setLanguageState(lang);
        try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify(lang));
        } catch (err) {
            console.error("Error saving language to localStorage:", err);
        }
    }, []);

    // --- Layout State ---
    const [treeWidth, setTreeWidth] = useState(220);
    const [treeCollapsed, setTreeCollapsed] = useState(false);
    const [isTreeResizing, setIsTreeResizing] = useState(false);

    // --- Detection State ---
    const [detectedLanguage, setDetectedLanguage] = useState("javascript");
    const [, setIsLanguageSupported] = useState(true);

    // --- Contexts ---
    const { useCases, refresh: refreshUseCases } = useUseCases();
    const { projectStructure, setProjectStructure, selectedFile, setSelectedFile, viewMode, setViewMode, currentRepo, setCurrentRepo, clearProject } = useProject();

    // --- Editor Tabs Hook (needs to be before useProviderConnection to get closeAllTabs) ---
    const {
        openTabs,
        activeTabId,
        setActiveTabId,
        activeTab,
        dragOverIndex,
        onFileClick,
        closeTab,
        closeAllTabs,
        updateTabContent,
        handleTabDragStart,
        handleTabDragOver,
        handleTabDragLeave,
        handleTabDrop,
    } = useEditorTabs({ currentRepo, setCode, setSelectedFile, setViewMode });

    // --- Provider Connection Hook ---
    const {
        session,
        isGithubConnected,
        isGitlabConnected,
        repos,
        gitlabRepos,
        isLoadingRepos,
        loadRepos,
        loadGitlabRepos,
        handleDisconnectGitHub,
        handleDisconnectGitlab,
    } = useProviderConnection({ currentRepo, clearProject, closeAllTabs, setCode });

    // --- Repo Import Hook ---
    const {
        isImportDialogOpen,
        setIsImportDialogOpen,
        searchTerm,
        setSearchTerm,
        handleSelectRepo,
        handleSelectGitlabRepo,
    } = useRepoImport({ setProjectStructure, setCurrentRepo, setViewMode });

    // --- Editor Config Hook ---
    const { editorConfig, buildMonacoTheme } = useEditorConfig();
    const { theme, font, fontSize, ligatures, minimap, themeKey } = editorConfig;

    const codeTypes = useCases.map(uc => ({ value: uc.id, label: uc.title }));

    const hasCode = code && code.trim().length > 0;
    const [isPlaceholder, setIsPlaceholder] = useState(!hasCode);
    const placeholderText = `${commentPrefixFor('javascript')}${BASE_PLACEHOLDER}`;

    const monacoRef = useRef(null);
    const editorRef = useRef(null);

    // Load repos when import dialog opens
    useEffect(() => {
        if (isImportDialogOpen && session && isGithubConnected && repos.length === 0) loadRepos();
    }, [isImportDialogOpen, session, isGithubConnected, repos.length, loadRepos]);

    useEffect(() => {
        if (isImportDialogOpen && session && isGitlabConnected && gitlabRepos.length === 0) loadGitlabRepos();
    }, [isImportDialogOpen, session, isGitlabConnected, gitlabRepos.length, loadGitlabRepos]);

    // --- Effect: Auto-Detect Language on Code Change ---
    useEffect(() => {
        if (!code || isPlaceholder) return;

        const lang = detectLanguageFromContent(selectedFile?.name, code);
        if (lang) {
            setDetectedLanguage(lang);

            // Check support
            const match = supportedLanguages.find(s => s.prism === lang);
            const isSupported = Boolean(match);
            setIsLanguageSupported(isSupported);

            // Auto-switch editor highlighter if supported
            if (isSupported && match && match.prism !== language.prism) {
                setLanguage(match);
            }
        } else {
            setDetectedLanguage(null);
            setIsLanguageSupported(false);
        }
    }, [code, isPlaceholder, selectedFile, language.prism, setLanguage]);

    // Effect for active tab language
    useEffect(() => {
        if (activeTab) {
            const tabLanguage = activeTab.language;
            setDetectedLanguage(tabLanguage);

            // Find language match in supported languages
            const match = supportedLanguages.find(s => s.prism === tabLanguage);

            // Check if file extension is view-only
            const ext = activeTab.name?.split('.').pop()?.toLowerCase() || '';
            const isViewOnlyFile = viewOnlyExtensions.includes(ext);

            // Set the language for formatting
            if (match) {
                setLanguage(match);
            } else if (isViewOnlyFile && tabLanguage) {
                setLanguage({ name: tabLanguage.charAt(0).toUpperCase() + tabLanguage.slice(1), prism: tabLanguage });
            }
        }
    }, [activeTab, setLanguage]);

    // --- Actions ---
    const handleCopy = useCallback(() => {
        const currentContent = editorRef.current?.getValue() || '';
        if (currentContent.trim()) {
            navigator.clipboard.writeText(currentContent);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    }, []);

    const handleFormat = useCallback(async () => {
        const currentCode = activeTab ? activeTab.content : code;
        if (!currentCode || currentCode.trim().length === 0) return;
        setIsFormatting(true);
        try {
            const formatLanguage = activeTab?.language || language.prism;
            const formattedCode = await formatCode(currentCode, formatLanguage);
            if (formattedCode) {
                if (activeTab) {
                    updateTabContent(activeTab.id, formattedCode);
                } else {
                    setCode(formattedCode);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsFormatting(false);
        }
    }, [activeTab, code, language.prism, setCode, updateTabContent]);

    // --- Unload Project Handler ---
    const handleUnloadProject = useCallback(() => {
        closeAllTabs();
        setCode('');
        clearProject();
        toast.success("Project unloaded successfully!");
    }, [closeAllTabs, setCode, clearProject]);

    // --- Computed Values ---
    let editorValue = activeTab ? activeTab.content : (selectedFile?.content || (isPlaceholder ? placeholderText : code));
    if (viewMode === 'project' && selectedFile?.content && !activeTab) {
        editorValue = selectedFile.content;
    }

    const currentLanguage = activeTab?.language || detectedLanguage || language.prism || null;

    const getDisplayLanguageName = () => {
        if (!currentLanguage) return "Unknown";
        const match = supportedLanguages.find(s => s.prism === currentLanguage);
        if (match) return match.name;
        return "Unsupported";
    };
    const displayLanguage = getDisplayLanguageName();

    const currentFileName = activeTab?.name || selectedFile?.name || '';
    const currentFileExtension = currentFileName.split('.').pop()?.toLowerCase() || '';
    const isViewOnly = viewOnlyExtensions.includes(currentFileExtension);
    const isReviewable = !isViewOnly && reviewableLanguages.includes(currentLanguage);
    const isFormattable = formattableLanguages.includes(currentLanguage);
    const hasContent = activeTab || (selectedFile && selectedFile.content) || hasCode;
    const hasImportedProject = Boolean(currentRepo);

    return (
        <div className="flex flex-col h-full w-full gap-1.5 sm:gap-2">
            {/* Top Toolbar - Only show when project is imported */}
            {hasImportedProject && (
                <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 w-full">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        {currentRepo && (
                            <>
                                <Label htmlFor="view-mode-switch" className="text-xs sm:text-sm whitespace-nowrap">Project</Label>
                                <Switch
                                    id="view-mode-switch"
                                    checked={viewMode === 'file'}
                                    onCheckedChange={(checked) => setViewMode(checked ? 'file' : 'project')}
                                    className="h-4 w-7 sm:h-5 sm:w-9"
                                />
                                <Label htmlFor="view-mode-switch" className="text-xs sm:text-sm whitespace-nowrap">File</Label>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        {viewMode === 'project' && (isGithubConnected || isGitlabConnected) && (
                            <ImportDialog
                                isOpen={isImportDialogOpen}
                                onOpenChange={setIsImportDialogOpen}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                repos={repos}
                                gitlabRepos={gitlabRepos}
                                isLoadingRepos={isLoadingRepos}
                                isGithubConnected={isGithubConnected}
                                isGitlabConnected={isGitlabConnected}
                                onSelectRepo={handleSelectRepo}
                                onSelectGitlabRepo={handleSelectGitlabRepo}
                                onDisconnectGitHub={handleDisconnectGitHub}
                                onDisconnectGitlab={handleDisconnectGitlab}
                            />
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleUnloadProject}
                            className="gap-1.5 sm:gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                        >
                            <FolderX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden xs:inline">Unload Project</span>
                            <span className="xs:hidden">Unload</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 min-h-0 w-full">
                <Card className="flex flex-col h-full w-full overflow-hidden shadow-sm border-border">
                    <EditorHeader
                        isPlaceholder={isPlaceholder}
                        hasContent={hasContent}
                        isLocked={isLocked}
                        onLockChange={onLockChange}
                        isViewOnly={isViewOnly}
                        displayLanguage={displayLanguage}
                        displayLanguages={displayLanguages}
                        language={language}
                        setLanguage={setLanguage}
                        setDetectedLanguage={setDetectedLanguage}
                        setIsLanguageSupported={setIsLanguageSupported}
                        codeType={codeType}
                        setCodeType={setCodeType}
                        codeTypes={codeTypes}
                        isRefreshing={isRefreshing}
                        refreshUseCases={refreshUseCases}
                        setIsRefreshing={setIsRefreshing}
                        isFormatting={isFormatting}
                        handleFormat={handleFormat}
                        isFormattable={isFormattable}
                        isCopied={isCopied}
                        handleCopy={handleCopy}
                        hasCode={hasCode}
                        isReviewable={isReviewable}
                        onStart={onStart}
                        activeTab={activeTab}
                        code={code}
                    />

                    {/* Content Body */}
                    <CardContent className="flex-1 p-0 flex flex-col overflow-hidden relative">
                        {/* Mobile Project Files Button + Editor Tabs Row */}
                        <div className="flex items-center gap-1 border-b sm:border-b-0">
                            {/* Mobile: Project Files button */}
                            <div className="sm:hidden p-1">
                                {viewMode === 'project' && projectStructure && (
                                    <ProjectTree
                                        structure={projectStructure}
                                        onFileClick={onFileClick}
                                        width={treeWidth}
                                        onWidthChange={setTreeWidth}
                                        collapsed={treeCollapsed}
                                        setCollapsed={setTreeCollapsed}
                                        onDragStateChange={setIsTreeResizing}
                                        minWidth={140}
                                        maxWidth={700}
                                        additionalButtons={openTabs.length > 0 ? (
                                            <button
                                                onClick={closeAllTabs}
                                                className="p-1 hover:bg-accent rounded-md"
                                                title="Close All Tabs"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        ) : null}
                                    />
                                )}
                            </div>

                            {/* Editor Tabs - fills remaining space */}
                            <div className="flex-1 min-w-0">
                                <EditorTabs
                                    openTabs={openTabs}
                                    activeTabId={activeTabId}
                                    setActiveTabId={setActiveTabId}
                                    closeTab={closeTab}
                                    dragOverIndex={dragOverIndex}
                                    onDragStart={handleTabDragStart}
                                    onDragOver={handleTabDragOver}
                                    onDragLeave={handleTabDragLeave}
                                    onDrop={handleTabDrop}
                                />
                            </div>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Desktop: Project Tree sidebar */}
                            <div className="hidden sm:block">
                                {viewMode === 'project' && projectStructure && (
                                    <ProjectTree
                                        structure={projectStructure}
                                        onFileClick={onFileClick}
                                        width={treeWidth}
                                        onWidthChange={setTreeWidth}
                                        collapsed={treeCollapsed}
                                        setCollapsed={setTreeCollapsed}
                                        onDragStateChange={setIsTreeResizing}
                                        minWidth={140}
                                        maxWidth={700}
                                        additionalButtons={openTabs.length > 0 ? (
                                            <button
                                                onClick={closeAllTabs}
                                                className="p-1 hover:bg-accent rounded-md"
                                                title="Close All Tabs"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        ) : null}
                                    />
                                )}
                            </div>

                            <div className={`flex-1 min-w-0 h-full relative bg-background ${isTreeResizing ? 'pointer-events-none select-none' : ''}`}>
                                <Editor
                                    key={`${language.prism}-${themeKey}`}
                                    language={language.prism}
                                    value={editorValue}
                                    onChange={(val) => {
                                        if (activeTab) {
                                            updateTabContent(activeTab.id, val);
                                        } else if (!isPlaceholder && val !== undefined) {
                                            setCode(val);
                                        }
                                    }}
                                    theme={`custom-${themeKey}`}
                                    options={{
                                        fontFamily: font.family,
                                        fontSize: fontSize,
                                        fontLigatures: ligatures && font.ligatures,
                                        lineHeight: Math.round(fontSize * 1.6),
                                        wordWrap: 'on',
                                        minimap: { enabled: minimap },
                                        scrollbar: { vertical: 'auto', horizontal: 'auto' },
                                        smoothScrolling: true,
                                        automaticLayout: true,
                                        readOnly: isLocked,
                                        padding: { top: 16, bottom: 16 },
                                        formatOnPaste: false,
                                        formatOnType: false,
                                    }}
                                    onMount={(editor, monaco) => {
                                        monacoRef.current = monaco;
                                        editorRef.current = editor;
                                        const monacoTheme = buildMonacoTheme(theme);
                                        monaco.editor.defineTheme(`custom-${themeKey}`, monacoTheme);
                                        monaco.editor.setTheme(`custom-${themeKey}`);
                                        editor.onDidChangeModelContent(() => {
                                            const current = editor.getValue();
                                            const placeholders = [
                                                `// ${BASE_PLACEHOLDER}`,
                                                `# ${BASE_PLACEHOLDER}`,
                                                BASE_PLACEHOLDER,
                                                ''
                                            ];
                                            const isCurrentPlaceholder = placeholders.includes(current.trim()) || current.trim() === '';

                                            if (isCurrentPlaceholder) {
                                                setIsPlaceholder(true);
                                            } else {
                                                setIsPlaceholder(false);
                                                setCode(current);
                                            }
                                        });
                                    }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

