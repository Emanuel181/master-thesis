"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Play, Clipboard, Wand2, RefreshCw, Lock, Unlock, Check, FileCode2, FolderOpen, X } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { formatCode } from "@/lib/code-formatter";
import { useSettings, editorThemes, editorFonts, editorFontSizes, syntaxColorPresets } from "@/contexts/settingsContext";
import { useUseCases } from "@/contexts/useCasesContext";
import { useProject } from "@/contexts/projectContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSession, signIn } from 'next-auth/react';
import { fetchRepoTree as apiFetchRepoTree, fetchFileContent as apiFetchFileContent } from '../../../lib/github-api';
import ProjectTree from './project-tree';
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// ---------- CONFIG ----------
const BASE_ICON_URL = "https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons";

// "Extension" mapped to "Filename in Repo"
const EXTENSION_ALIASES = {
    js: "javascript",
    jsx: "react",
    ts: "typescript",
    tsx: "react_ts",
    mjs: "javascript",
    cjs: "javascript",
    vue: "vue",
    svelte: "svelte",
    angular: "angular",
    css: "css",
    scss: "sass",
    sass: "sass",
    less: "less",
    styl: "stylus",
    py: "python",
    rb: "ruby",
    rs: "rust",
    go: "go",
    java: "java",
    php: "php",
    cs: "csharp",
    cpp: "cpp",
    c: "c",
    h: "c",
    hpp: "cpp",
    json: "json",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    toml: "yaml",
    env: "tune",
    lock: "lock",
    md: "markdown",
    mdx: "markdown",
    txt: "document",
    pdf: "pdf",
    zip: "zip",
    rar: "zip",
    "7z": "zip",
    tar: "zip",
    gz: "zip",
    png: "image",
    jpg: "image",
    jpeg: "image",
    svg: "svg",
    ico: "image",
    sh: "console",
    bash: "console",
    zsh: "console",
    bat: "console",
    cmd: "console",
    exe: "exe",
};

const getFileUrl = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName === "package.json") return `${BASE_ICON_URL}/nodejs.svg`;
    if (lowerName === "favicon.ico") return `${BASE_ICON_URL}/favicon.svg`;
    if (lowerName === ".gitignore") return `${BASE_ICON_URL}/git.svg`;
    if (lowerName === "readme.md") return `${BASE_ICON_URL}/readme.svg`;
    if (lowerName === "dockerfile") return `${BASE_ICON_URL}/docker.svg`;
    if (lowerName === "license") return `${BASE_ICON_URL}/license.svg`;
    if (lowerName === "jenkinsfile") return `${BASE_ICON_URL}/jenkins.svg`;

    const parts = lowerName.split(".");
    const ext = parts[parts.length - 1];
    const alias = EXTENSION_ALIASES[ext];
    if (alias) {
        return `${BASE_ICON_URL}/${alias}.svg`;
    }
    return `${BASE_ICON_URL}/file.svg`;
};

export function CodeInput({ code, setCode, codeType, setCodeType, onStart, isLocked, onLockChange }) {
    // --- Configuration State ---
    const [language, setLanguage] = useState({ name: "JavaScript", prism: "javascript" });
    const [isFormatting, setIsFormatting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // --- Layout State ---
    const [treeWidth, setTreeWidth] = useState(280);
    const [treeCollapsed, setTreeCollapsed] = useState(false);
    const [isTreeResizing, setIsTreeResizing] = useState(false);

    // --- Contexts ---
    const { settings } = useSettings();
    const { useCases, refresh: refreshUseCases } = useUseCases();
    const { projectStructure, setProjectStructure, selectedFile, setSelectedFile, viewMode, setViewMode, currentRepo, setCurrentRepo } = useProject();
    const { data: session, status } = useSession();

    // --- Import State ---
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [repos, setRepos] = useState([]);
    const [gitlabRepos, setGitlabRepos] = useState([]);
    const [isLoadingRepos, setIsLoadingRepos] = useState(false);
    const [loadingFilePath, setLoadingFilePath] = useState(null);

    // --- GitHub Connection State ---
    const [isGithubConnected, setIsGithubConnected] = useState(false);

    // --- GitLab Connection State ---
    const [isGitlabConnected, setIsGitlabConnected] = useState(false);

    // --- Tab State ---
    const [openTabs, setOpenTabs] = useState([]);
    const [activeTabId, setActiveTabId] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    // --- Detection State ---
    const [detectedLanguage, setDetectedLanguage] = useState("javascript");

    // Languages shown in the dropdown selector (main programming languages that are fully supported)
    const displayLanguages = [
        { name: "JavaScript", prism: "javascript" },
        { name: "Python", prism: "python" },
        { name: "Java", prism: "java" },
        { name: "C#", prism: "csharp" },
        { name: "C", prism: "c" },
        { name: "C++", prism: "cpp" },
        { name: "PHP", prism: "php" },
        { name: "Go", prism: "go" },
    ];

    // All languages that can be displayed and formatted (includes JSON, etc.)
    const supportedLanguages = [
        ...displayLanguages,
        { name: "JSON", prism: "json" },
    ];

    // Languages that can be formatted by the backend (must match format-code API)
    const formattableLanguages = [
        'javascript', 'python', 'java', 'csharp', 'c', 'cpp', 'php', 'go', 'json'
    ];

    // Languages that can be reviewed by the AI agent (excludes config files like JSON, MJS modules)
    const reviewableLanguages = [
        'javascript', 'python', 'java', 'csharp', 'c', 'cpp', 'php', 'go'
    ];

    // File extensions that are view-only (can format/copy but not review)
    const viewOnlyExtensions = ['json', 'mjs', 'cjs'];

    const codeTypes = useCases.map(uc => ({ value: uc.id, label: uc.title }));

    const BASE_PLACEHOLDER = "Enter your code here...";
    const commentPrefixFor = (lang) => {
        switch (lang) {
            case 'python': return '# ';
            case 'php': return '// ';
            default: return '// ';
        }
    };

    const hasCode = code && code.trim().length > 0;
    const [isPlaceholder, setIsPlaceholder] = useState(!hasCode);
    const [placeholderText, setPlaceholderText] = useState(() => `${commentPrefixFor('javascript')}${BASE_PLACEHOLDER}`);

    const monacoRef = useRef(null);
    const editorRef = useRef(null);

    const refreshLinkedProviders = useCallback(async () => {
        if (!session) return;
        try {
            const res = await fetch('/api/providers/linked', { cache: 'no-store' });
            const data = await res.json();
            if (!res.ok) return;
            const linked = new Set(data.providers || []);
            const githubLinked = linked.has('github');
            const gitlabLinked = linked.has('gitlab');
            setIsGithubConnected(githubLinked);
            setIsGitlabConnected(gitlabLinked);
            if (!githubLinked) setRepos([]);
            if (!gitlabLinked) setGitlabRepos([]);
        } catch (err) {
            console.error('Error refreshing linked providers:', err);
        }
    }, [session]);

    useEffect(() => {
        if (status !== 'authenticated') return;
        refreshLinkedProviders();
    }, [status, refreshLinkedProviders]);

    useEffect(() => {
        if (status !== 'authenticated') return;
        const interval = setInterval(() => {
            refreshLinkedProviders();
        }, 30000); // Reduced from 5s to 30s for better performance
        return () => clearInterval(interval);
    }, [status, refreshLinkedProviders]);

    // --- Helper: Detect Language ---
    const detectLanguageFromContent = useCallback((filename, content) => {
        if (!filename) return null;

        const ext = filename.split('.').pop()?.toLowerCase();
        if (!ext) return null;

        // Comprehensive extension to language mapping
        const extensionMap = {
            // JavaScript variants (all map to javascript)
            'js': 'javascript',
            'jsx': 'javascript',
            'mjs': 'javascript',
            'cjs': 'javascript',
            'es6': 'javascript',
            'ts': 'javascript',
            'tsx': 'javascript',
            'mts': 'javascript',
            'cts': 'javascript',

            // Python
            'py': 'python',
            'pyw': 'python',
            'pyi': 'python',

            // Java
            'java': 'java',

            // C#
            'cs': 'csharp',
            'csx': 'csharp',

            // C
            'c': 'c',
            'h': 'c',

            // C++
            'cpp': 'cpp',
            'cc': 'cpp',
            'cxx': 'cpp',
            'hpp': 'cpp',
            'hxx': 'cpp',
            'hh': 'cpp',

            // PHP
            'php': 'php',
            'phtml': 'php',
            'php3': 'php',
            'php4': 'php',
            'php5': 'php',
            'php7': 'php',
            'phps': 'php',

            // Go
            'go': 'go',

            // JSON
            'json': 'json',
            'jsonc': 'json',
            'json5': 'json',

            // Other (unsupported but detectable)
            'rs': 'rust',
            'rb': 'ruby',
            'swift': 'swift',
            'kt': 'kotlin',
            'kts': 'kotlin',
            'scala': 'scala',
            'html': 'html',
            'htm': 'html',
            'css': 'css',
            'scss': 'scss',
            'sass': 'sass',
            'less': 'less',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'md': 'markdown',
            'mdx': 'markdown',
            'sql': 'sql',
            'sh': 'shell',
            'bash': 'shell',
            'zsh': 'shell',
            'ps1': 'powershell',
        };

        if (extensionMap[ext]) {
            return extensionMap[ext];
        }

        // Fallback: Check content for language hints
        if (content) {
            if (/^#!\/.+\bpython/.test(content)) return 'python';
            if (/^#!\/.+\bnode/.test(content)) return 'javascript';
            if (content.includes('public static void main')) return 'java';
            if (content.includes('import React') || content.includes('from "react"') || content.includes("from 'react'")) return 'javascript';
            if (content.includes('def ') && content.includes(':')) return 'python';
            if (content.includes('package main') && content.includes('func ')) return 'go';
            if (content.includes('<?php')) return 'php';
            if (content.includes('using System;') || content.includes('namespace ')) return 'csharp';
        }

        return null;
    }, []);

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
    }, [code, isPlaceholder, selectedFile, detectLanguageFromContent]);


    // --- Editor Config ---
    const getEditorConfig = useCallback(() => {
        const appMode = settings?.mode || 'light';
        let themeKey = settings?.editorTheme || 'default-dark';
        let theme = editorThemes[themeKey];

        if (theme) {
            const isAppDark = appMode === 'dark';
            const isThemeDark = theme.base === 'vs-dark';
            if (isAppDark !== isThemeDark) {
                themeKey = isAppDark ? 'default-dark' : 'default-light';
                theme = editorThemes[themeKey];
            }
        } else {
            themeKey = appMode === 'dark' ? 'default-dark' : 'default-light';
            theme = editorThemes[themeKey];
        }

        const fontKey = settings?.editorFont || 'fira-code';
        const fontSizeKey = settings?.editorFontSize || 'md';
        const font = editorFonts[fontKey] || editorFonts['fira-code'];
        const fontSize = editorFontSizes[fontSizeKey]?.size || 16;

        return { theme, font, fontSize, ligatures: settings?.editorLigatures ?? true, minimap: settings?.editorMinimap ?? true, themeKey };
    }, [settings]);

    const editorConfig = useMemo(() => getEditorConfig(), [getEditorConfig]);
    const { theme, font, fontSize, ligatures, minimap, themeKey } = editorConfig;

    const buildMonacoTheme = useCallback((editorTheme) => {
        const appMode = settings?.mode || 'light';
        const syntaxColors = settings?.customSyntaxColors?.[appMode] || syntaxColorPresets.default[appMode];
        return {
            base: editorTheme.base,
            inherit: true,
            rules: [
                { token: 'comment', foreground: syntaxColors.comment, fontStyle: 'italic' },
                { token: 'keyword', foreground: syntaxColors.keyword, fontStyle: 'bold' },
                { token: 'string', foreground: syntaxColors.string },
                { token: 'number', foreground: syntaxColors.number },
                { token: 'type', foreground: syntaxColors.type },
                { token: 'function', foreground: syntaxColors.function },
                { token: 'variable', foreground: syntaxColors.variable },
                { token: 'operator', foreground: syntaxColors.operator },
            ],
            colors: {
                'editor.background': editorTheme.colors.background,
                'editor.foreground': editorTheme.colors.foreground,
                'editor.lineHighlightBackground': editorTheme.colors.lineHighlight,
                'editorLineNumber.foreground': editorTheme.colors.lineNumber,
                'minimap.background': editorTheme.colors.background,
            },
        };
    }, [settings?.mode, settings?.customSyntaxColors]);

    // --- Actions ---

    const handleCopy = () => {
        const currentContent = editorRef.current?.getValue() || '';
        if (currentContent.trim()) {
            navigator.clipboard.writeText(currentContent);
            setIsCopied(true);

            // Revert back to copy state after 2 seconds
            setTimeout(() => {
                setIsCopied(false);
            }, 2000);
        }
    };

    const handleFormat = async () => {
        const currentCode = activeTab ? activeTab.content : code;
        if (!currentCode || currentCode.trim().length === 0) return;
        setIsFormatting(true);
        try {
            // Use the detected language from the active tab if available, otherwise use the language state
            const formatLanguage = activeTab?.language || language.prism;
            const formattedCode = await formatCode(currentCode, formatLanguage);
            if (formattedCode) {
                if (activeTab) {
                    setOpenTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, content: formattedCode } : t));
                } else {
                    setCode(formattedCode);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsFormatting(false);
        }
    };

    const loadRepos = async () => {
        setIsLoadingRepos(true);
        try {
            const response = await fetch('/api/github/repos');
            if (response.ok) setRepos(await response.json());
        } catch (error) { console.error(error); }
        finally { setIsLoadingRepos(false); }
    };

    const loadGitlabRepos = async () => {
        setIsLoadingRepos(true);
        try {
            const response = await fetch('/api/gitlab/repos');
            if (response.ok) setGitlabRepos(await response.json());
        } catch (error) { console.error(error); }
        finally { setIsLoadingRepos(false); }
    };

    useEffect(() => {
        if (isImportDialogOpen && session && isGithubConnected && repos.length === 0) loadRepos();
    }, [isImportDialogOpen, session, isGithubConnected, repos.length]);

    useEffect(() => {
        if (isImportDialogOpen && session && isGitlabConnected && gitlabRepos.length === 0) loadGitlabRepos();
    }, [isImportDialogOpen, session, isGitlabConnected, gitlabRepos.length]);

    const handleImport = async () => {
        if (!searchTerm.trim() || !session) return;
        try {
            const [owner, repo] = searchTerm.split('/');
            if (!owner || !repo) throw new Error("Invalid format");
            const structure = await apiFetchRepoTree(owner, repo);
            setProjectStructure(structure);
            setCurrentRepo({ owner, repo });
            setViewMode('project');
            setIsImportDialogOpen(false);
            setSearchTerm("");
            toast.success("Project switched successfully!");
        } catch (error) {
            toast.error("Failed to switch project: " + error.message);
        }
    };

    const handleSelectRepo = async (repo) => {
        try {
            const structure = await apiFetchRepoTree(repo.owner.login, repo.name);
            setProjectStructure(structure);
            setCurrentRepo({ owner: repo.owner.login, repo: repo.name });
            setViewMode('project');
            setIsImportDialogOpen(false);
            toast.success("Project switched successfully!");
        } catch (error) {
            toast.error("Failed to switch project: " + error.message);
        }
    };

    const handleSelectGitlabRepo = async (repo) => {
        try {
            const structure = await apiFetchRepoTree(repo.full_name.split('/')[0], repo.name, 'gitlab');
            setProjectStructure(structure);
            setCurrentRepo({ owner: repo.full_name.split('/')[0], repo: repo.name, provider: 'gitlab' });
            setViewMode('project');
            setIsImportDialogOpen(false);
            toast.success("Project switched successfully!");
        } catch (error) {
            toast.error("Failed to switch project: " + error.message);
        }
    };

    const handleDisconnectGitHub = async () => {
        try {
            await fetch('/api/auth/disconnect?provider=github', { method: 'POST' });
        } catch (err) {
            console.error('Error disconnecting GitHub:', err);
        }
        setIsGithubConnected(false);
        toast.success("Disconnected from GitHub!");
        await refreshLinkedProviders();
    };

    const handleDisconnectGitlab = async () => {
        try {
            await fetch('/api/auth/disconnect?provider=gitlab', { method: 'POST' });
        } catch (err) {
            console.error('Error disconnecting GitLab:', err);
        }
        setIsGitlabConnected(false);
        toast.success("Disconnected from GitLab!");
        await refreshLinkedProviders();
    };

    const onFileClick = async (node) => {
        const tabId = node.path;
        const existingTab = openTabs.find(tab => tab.id === tabId);
        if (existingTab) {
            setActiveTabId(existingTab.id);
            return;
        }
        if (loadingFilePath === node.path) return;
        setLoadingFilePath(node.path);
        try {
            const fileWithContent = await apiFetchFileContent(currentRepo.owner, currentRepo.repo, node.path, currentRepo.provider);
            // Use node.name for detection to ensure we have the full filename with extension
            const lang = detectLanguageFromContent(node.name, fileWithContent.content) || 'javascript';
            const newTab = {
                id: tabId,
                name: node.name,
                path: node.path,
                content: fileWithContent.content,
                language: lang
            };
            setOpenTabs(prev => {
                const newTabs = [...prev, newTab];
                const unique = newTabs.filter((tab, index, self) => self.findIndex(t => t.id === tab.id) === index);
                return unique;
            });
            setActiveTabId(newTab.id);
            setViewMode('project');
        } catch (err) { console.error(err); }
        finally { setLoadingFilePath(null); }
    };

    const activeTab = openTabs.find(t => t.id === activeTabId);

    const closeTab = (tabId) => {
        const remaining = openTabs.filter(t => t.id !== tabId);
        setOpenTabs(remaining);
        if (activeTabId === tabId) {
            if (remaining.length > 0) {
                setActiveTabId(remaining[remaining.length - 1].id);
            } else {
                setActiveTabId(null);
                setCode(''); // Clear the code when closing the last tab
                setSelectedFile(null); // Clear the selected file
            }
        }
    };

    // Effect for active tab language
    useEffect(() => {
        if (activeTab) {
            const tabLanguage = activeTab.language;
            setDetectedLanguage(tabLanguage);

            // Find language match in supported languages
            const match = supportedLanguages.find(s => s.prism === tabLanguage);

            // Check if file extension is view-only (these are always formattable)
            const ext = activeTab.name?.split('.').pop()?.toLowerCase() || '';
            const isViewOnlyFile = viewOnlyExtensions.includes(ext);


            // Set the language for formatting - for view-only files, create a language object if no match
            if (match) {
                setLanguage(match);
            } else if (isViewOnlyFile && tabLanguage) {
                // For view-only files without a match in displayLanguages, still set a language for formatting
                setLanguage({ name: tabLanguage.charAt(0).toUpperCase() + tabLanguage.slice(1), prism: tabLanguage });
            }
        }
    }, [activeTab]);

    let editorValue = activeTab ? activeTab.content : (selectedFile?.content || (isPlaceholder ? placeholderText : code));
    if (viewMode === 'project' && selectedFile?.content && !activeTab) {
        editorValue = selectedFile.content;
    }

    // Get the current language - prioritize activeTab.language for immediate updates
    const currentLanguage = activeTab?.language || detectedLanguage || language.prism || null;

    // Determine current display language name
    const getDisplayLanguageName = () => {
        if (!currentLanguage) return "Unknown";

        // Check if it's in the supported languages list
        const match = supportedLanguages.find(s => s.prism === currentLanguage);
        if (match) {
            return match.name; // e.g., "JavaScript", "Python", "JSON"
        }

        // Language detected but not in supported list - show as Unsupported
        return "Unsupported";
    };
    const displayLanguage = getDisplayLanguageName();

    // Check if current file is view-only (can format/copy but not review)
    const currentFileName = activeTab?.name || selectedFile?.name || '';
    const currentFileExtension = currentFileName.split('.').pop()?.toLowerCase() || '';
    const isViewOnly = viewOnlyExtensions.includes(currentFileExtension);
    const isReviewable = !isViewOnly && reviewableLanguages.includes(currentLanguage);

    // Check if current language can be formatted
    const isFormattable = formattableLanguages.includes(currentLanguage);

    const hasContent = activeTab || (selectedFile && selectedFile.content) || hasCode;

    // Check if a project has been imported
    const hasImportedProject = Boolean(currentRepo);

    return (
        <div className="flex flex-col h-full w-full gap-2">

            {/* Top Toolbar - Only show when project is imported */}
            {hasImportedProject && (
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                        {currentRepo && (
                            <>
                                <Label htmlFor="view-mode-switch">Project View</Label>
                                <Switch
                                    id="view-mode-switch"
                                    checked={viewMode === 'file'}
                                    onCheckedChange={(checked) => setViewMode(checked ? 'file' : 'project')}
                                />
                                <Label htmlFor="view-mode-switch">One File View</Label>
                            </>
                        )}
                    </div>

                    {viewMode === 'project' && (isGithubConnected || isGitlabConnected) && (
                        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <FolderOpen className="mr-2 h-4 w-4" /> Switch project
                                </Button>
                            </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>Switch Project</DialogTitle></DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Search Projects</Label>
                                    <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search projects..." />
                                </div>
                                {isGithubConnected && (
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                                            GitHub Projects
                                        </Label>
                                        <ScrollArea className="h-40 border rounded-md">
                                            <div className="p-2">
                                                {isLoadingRepos ? (
                                                    <div className="flex items-center justify-center py-4">
                                                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                                        <span className="text-sm text-muted-foreground">Loading...</span>
                                                    </div>
                                                ) : repos.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                                    <p className="text-sm text-muted-foreground text-center py-4">No projects found</p>
                                                ) : (
                                                    repos.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map(r => (
                                                        <div
                                                            key={r.id}
                                                            onClick={() => handleSelectRepo(r)}
                                                            className="p-2 hover:bg-accent rounded-md cursor-pointer flex justify-between text-sm transition-colors"
                                                        >
                                                            <span className="font-medium">{r.name}</span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${r.private ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                                {r.private ? 'Private' : 'Public'}
                                                            </span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                )}
                                {isGitlabConnected && (
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <svg className="h-4 w-4" viewBox="0 0 380 380" fill="currentColor"><path d="M282.83,170.73l-.27-.69-26.14-68.22a6.81,6.81,0,0,0-2.69-3.24,7,7,0,0,0-8,.43,7,7,0,0,0-2.32,3.52l-17.65,54H154.29l-17.65-54A6.86,6.86,0,0,0,134.32,99a7,7,0,0,0-8-.43,6.87,6.87,0,0,0-2.69,3.24L97.44,170l-.26.69a48.54,48.54,0,0,0,16.1,56.1l.09.07.24.17,39.82,29.82,19.7,14.91,12,9.06a8.07,8.07,0,0,0,9.76,0l12-9.06,19.7-14.91,40.06-30,.1-.08A48.56,48.56,0,0,0,282.83,170.73Z" fill="#E24329"/><path d="M282.83,170.73l-.27-.69a88.3,88.3,0,0,0-35.15,15.8L190,229.25c19.55,14.79,36.57,27.64,36.57,27.64l40.06-30,.1-.08A48.56,48.56,0,0,0,282.83,170.73Z" fill="#FC6D26"/><path d="M153.43,256.89l19.7,14.91,12,9.06a8.07,8.07,0,0,0,9.76,0l12-9.06,19.7-14.91S209.55,244,190,229.25C170.45,244,153.43,256.89,153.43,256.89Z" fill="#FCA326"/><path d="M132.58,185.84A88.19,88.19,0,0,0,97.44,170l-.26.69a48.54,48.54,0,0,0,16.1,56.1l.09.07.24.17,39.82,29.82s17-12.85,36.57-27.64Z" fill="#FC6D26"/></svg>
                                            GitLab Projects
                                        </Label>
                                        <ScrollArea className="h-40 border rounded-md">
                                            <div className="p-2">
                                                {isLoadingRepos ? (
                                                    <div className="flex items-center justify-center py-4">
                                                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                                        <span className="text-sm text-muted-foreground">Loading...</span>
                                                    </div>
                                                ) : gitlabRepos.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                                    <p className="text-sm text-muted-foreground text-center py-4">No projects found</p>
                                                ) : (
                                                    gitlabRepos.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map(r => (
                                                        <div
                                                            key={r.id}
                                                            onClick={() => handleSelectGitlabRepo(r)}
                                                            className="p-2 hover:bg-accent rounded-md cursor-pointer flex justify-between text-sm transition-colors"
                                                        >
                                                            <span className="font-medium">{r.name}</span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${r.visibility === 'private' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                                {r.visibility === 'private' ? 'Private' : 'Public'}
                                                            </span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                )}
                                {!isGithubConnected && !isGitlabConnected && (
                                    <div className="flex flex-col gap-2 p-4 border rounded-md bg-muted/20">
                                        <p className="text-sm text-muted-foreground text-center mb-2">Connect a provider to access your projects</p>
                                        <Button onClick={() => signIn('github')} variant="outline" className="w-full">
                                            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                                            Connect GitHub
                                        </Button>
                                        <Button onClick={() => signIn('gitlab')} variant="outline" className="w-full">
                                            <svg className="h-4 w-4 mr-2" viewBox="0 0 380 380" fill="currentColor"><path d="M282.83,170.73l-.27-.69-26.14-68.22a6.81,6.81,0,0,0-2.69-3.24,7,7,0,0,0-8,.43,7,7,0,0,0-2.32,3.52l-17.65,54H154.29l-17.65-54A6.86,6.86,0,0,0,134.32,99a7,7,0,0,0-8-.43,6.87,6.87,0,0,0-2.69,3.24L97.44,170l-.26.69a48.54,48.54,0,0,0,16.1,56.1l.09.07.24.17,39.82,29.82,19.7,14.91,12,9.06a8.07,8.07,0,0,0,9.76,0l12-9.06,19.7-14.91,40.06-30,.1-.08A48.56,48.56,0,0,0,282.83,170.73Z" fill="#E24329"/></svg>
                                            Connect GitLab
                                        </Button>
                                    </div>
                                )}
                                <div className="flex gap-2 pt-2 border-t">
                                    {isGithubConnected && (
                                        <Button variant="ghost" size="sm" onClick={handleDisconnectGitHub} className="text-muted-foreground hover:text-destructive">
                                            Disconnect GitHub
                                        </Button>
                                    )}
                                    {isGitlabConnected && (
                                        <Button variant="ghost" size="sm" onClick={handleDisconnectGitlab} className="text-muted-foreground hover:text-destructive">
                                            Disconnect GitLab
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 min-h-0 w-full">
                <Card className="flex flex-col h-full w-full overflow-hidden shadow-sm border-border">
                    <CardHeader className="pt-4 pb-4 px-6 shrink-0 border-b bg-card">
                        <div className="flex items-center justify-between gap-4">

                            {/* Left: Title and Lock Control (only show lock when not placeholder and reviewable) */}
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-lg">Code Editor</CardTitle>
                                {!isPlaceholder && hasContent && !isViewOnly && (
                                    <Button
                                        variant={isLocked ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => onLockChange(!isLocked)}
                                        className={isLocked ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                                    >
                                        {isLocked ? <Lock className="h-3.5 w-3.5 mr-2" /> : <Unlock className="h-3.5 w-3.5 mr-2" />}
                                        {isLocked ? "Locked" : "Lock Code"}
                                    </Button>
                                )}
                                {!isPlaceholder && hasContent && isViewOnly && (
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                        View Only
                                    </span>
                                )}
                            </div>

                            {/* Middle: Language & Config (only show when not placeholder) */}
                            {!isPlaceholder && hasContent && (
                                <div className="flex items-center gap-6">
                                    {/* Language Selector with Status Indicator */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-muted-foreground">Language</span>
                                        <div className="flex flex-col">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="sm" disabled={isLocked} className="flex gap-2 min-w-[140px] justify-between relative">
                                                        <div className="flex flex-col items-start">
                                                            <div className="flex items-center gap-2">
                                                                <FileCode2 className="h-3.5 w-3.5 opacity-70" />
                                                                <span className="truncate max-w-[80px]">{displayLanguage}</span>
                                                            </div>
                                                        </div>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    {displayLanguages.map((lang) => (
                                                        <DropdownMenuItem key={lang.name} onClick={() => {
                                                            setLanguage(lang);
                                                            setDetectedLanguage(lang.prism);
                                                            setIsLanguageSupported(true);
                                                        }}>
                                                            {lang.name}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    <div className="h-6 w-px bg-border"></div>

                                    {/* Use Case - only show for reviewable files */}
                                    {!isViewOnly && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-muted-foreground">Use Case</span>
                                        <div className="flex items-center gap-2">
                                            <Select value={codeType} onValueChange={setCodeType} disabled={isLocked}>
                                                <SelectTrigger className="w-[180px] h-9">
                                                    <SelectValue placeholder="Select type..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {codeTypes.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button variant="ghost" size="icon" onClick={async () => { setIsRefreshing(true); try { await refreshUseCases(); } finally { setIsRefreshing(false); } }} disabled={isRefreshing}>
                                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                            </Button>
                                        </div>
                                    </div>
                                    )}
                                </div>
                            )}

                            {/* Right: Actions (only show when not placeholder) */}
                            {!isPlaceholder && hasContent && (
                                <div className="flex items-center gap-2">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleFormat}
                                                        disabled={isFormatting || (!isViewOnly && isLocked) || !isFormattable}
                                                    >
                                                        <Wand2 className="mr-2 h-4 w-4" /> Format
                                                    </Button>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {!isFormattable ? "Formatting is not supported for this programming language" : "Format Code"}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopy}
                                        disabled={isCopied}
                                        className="transition-all duration-200"
                                    >
                                        {isCopied ? (
                                            <Check className="mr-2 h-4 w-4 text-green-500 animate-in zoom-in duration-300" />
                                        ) : (
                                            <Clipboard className="mr-2 h-4 w-4" />
                                        )}
                                        {isCopied ? "Copied" : "Copy"}
                                    </Button>
                                    {/* Start Review - only show for reviewable files */}
                                    {!isViewOnly && (
                                    <Button
                                        size="sm"
                                        onClick={() => onStart(activeTab ? activeTab.content : code, language, codeType)}
                                        disabled={!hasCode || !isLocked || !isReviewable}
                                        className={(!isLocked || !isReviewable) ? "opacity-70" : ""}
                                        title={!isLocked ? "Lock code to start review" : (!isReviewable ? "Language not supported for review" : "Start Review")}
                                    >
                                        <Play className="mr-2 h-4 w-4" /> Start Review
                                    </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    {/* Content Body: Flexbox Layout for Smooth Dragging */}
                    <CardContent className="flex-1 p-0 flex flex-col overflow-hidden relative">
                        {openTabs.length > 0 && (
                            <ScrollArea orientation="horizontal" className="w-full border-b">
                                <div className="w-max">
                                    <Tabs value={activeTabId} onValueChange={setActiveTabId}>
                                        <TabsList className="h-9 p-1 bg-transparent flex">
                                            {openTabs.map((tab, index) => (
                                                <TabsTrigger
                                                    key={`tab-${tab.id}-${index}`}
                                                    value={tab.id}
                                                    className={`relative px-3 py-1 text-sm flex items-center gap-1 cursor-move ${dragOverIndex === index ? 'ring-2 ring-blue-500 bg-muted' : ''}`}
                                                    draggable="true"
                                                    onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                                                    onDragOver={(e) => {
                                                        e.preventDefault();
                                                        setDragOverIndex(index);
                                                    }}
                                                    onDragLeave={() => setDragOverIndex(null)}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                                        if (draggedIndex === index) return;
                                                        const newTabs = [...openTabs];
                                                        const [dragged] = newTabs.splice(draggedIndex, 1);
                                                        newTabs.splice(index, 0, dragged);
                                                        setOpenTabs(newTabs);
                                                        setDragOverIndex(null);
                                                    }}
                                                >
                                                    <img src={getFileUrl(tab.name)} alt="" className="w-4 h-4 flex-shrink-0" />
                                                    <span className="truncate max-w-[100px]">{tab.name}</span>
                                                    <span onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} className="cursor-pointer hover:bg-muted rounded p-0.5 ml-1 flex-shrink-0">
                                                        <X className="h-3 w-3" />
                                                    </span>
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                    </Tabs>
                                </div>
                            </ScrollArea>
                        )}
                        <div className="flex flex-1 overflow-hidden">
                            {viewMode === 'project' && projectStructure && (
                                <ProjectTree
                                    structure={projectStructure}
                                    onFileClick={onFileClick}
                                    width={treeWidth}
                                    onWidthChange={setTreeWidth}
                                    collapsed={treeCollapsed}
                                    setCollapsed={setTreeCollapsed}
                                    onDragStateChange={setIsTreeResizing}
                                    minWidth={180}
                                    maxWidth={700}
                                    additionalButtons={openTabs.length > 0 ? (
                                        <button
                                            onClick={() => {
                                                setOpenTabs([]);
                                                setActiveTabId(null);
                                                setCode(''); // Clear code area
                                                setSelectedFile(null); // Clear selected file
                                            }}
                                            className="p-1 hover:bg-accent rounded-md"
                                            title="Close All Tabs"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    ) : null}
                                />
                            )}

                            <div className={`flex-1 min-w-0 h-full relative bg-background ${isTreeResizing ? 'pointer-events-none select-none' : ''}`}>
                                <Editor
                                    key={`${language.prism}-${themeKey}`}
                                    language={language.prism}
                                    value={editorValue}
                                    onChange={(val) => {
                                        if (activeTab) {
                                            setOpenTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, content: val } : t));
                                        } else if (!isPlaceholder && val !== undefined) setCode(val);
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
                                            // Check all possible placeholder formats
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
