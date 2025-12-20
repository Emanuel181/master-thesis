"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import Editor from "@monaco-editor/react";
import "prismjs/themes/prism.css";
import "@/app/github-theme.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Play, Clipboard, Wand2, RefreshCw, Lock, Unlock, Download, Check, AlertTriangle, FileCode2, FolderOpen, X } from "lucide-react";
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
    const { data: session } = useSession();

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
    const [isLanguageSupported, setIsLanguageSupported] = useState(true);

    const supportedLanguages = [
        { name: "JavaScript", prism: "javascript" },
        { name: "TypeScript", prism: "typescript" },
        { name: "Python", prism: "python" },
        { name: "Java", prism: "java" },
        { name: "C#", prism: "csharp" },
        { name: "C", prism: "c" },
        { name: "C++", prism: "cpp" },
        { name: "PHP", prism: "php" },
        { name: "Go", prism: "go" },
        { name: "Rust", prism: "rust" },
    ];

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

    // --- Load GitHub state from localStorage ---
    useEffect(() => {
        if (typeof window === "undefined") return;
        const savedConnected = localStorage.getItem("isGithubConnected");
        if (savedConnected === "true") setIsGithubConnected(true);
    }, []);

    // --- Load GitLab state from localStorage ---
    useEffect(() => {
        if (typeof window === "undefined") return;
        const savedConnected = localStorage.getItem("isGitlabConnected");
        if (savedConnected === "true") setIsGitlabConnected(true);
    }, []);

    // --- Helper: Detect Language ---
    const detectLanguageFromContent = useCallback((filename, content) => {
        const ext = filename ? filename.split('.').pop()?.toLowerCase() : null;

        // 1. Check Extension
        const mapping = {
            js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
            py: 'python', java: 'java', php: 'php', go: 'go', c: 'c', cpp: 'cpp',
            cs: 'csharp', rs: 'rust', html: 'html', css: 'css', json: 'json'
        };
        if (ext && mapping[ext]) return mapping[ext];

        // 2. Check Content (Shebangs or keywords)
        if (content) {
            if (/^#!\/.+\bpython/.test(content)) return 'python';
            if (/^#!\/.+\bnode/.test(content)) return 'javascript';
            if (content.includes('public static void main')) return 'java';
            if (content.includes('import React')) return 'javascript';
            if (content.includes('def ') && content.includes(':')) return 'python';
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
            const formattedCode = await formatCode(currentCode, language.prism);
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
        if (isImportDialogOpen && session && repos.length === 0) loadRepos();
    }, [isImportDialogOpen, session, repos.length]);

    useEffect(() => {
        if (isImportDialogOpen && session && gitlabRepos.length === 0) loadGitlabRepos();
    }, [isImportDialogOpen, session, gitlabRepos.length]);

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
        localStorage.setItem("isGithubConnected", "false");
        toast.success("Disconnected from GitHub!");
    };

    const handleDisconnectGitlab = async () => {
        try {
            await fetch('/api/auth/disconnect?provider=gitlab', { method: 'POST' });
        } catch (err) {
            console.error('Error disconnecting GitLab:', err);
        }
        setIsGitlabConnected(false);
        localStorage.setItem("isGitlabConnected", "false");
        toast.success("Disconnected from GitLab!");
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
            const lang = detectLanguageFromContent(fileWithContent.name, fileWithContent.content) || 'javascript';
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
            }
        }
    };

    // Effect for active tab language
    useEffect(() => {
        if (activeTab) {
            setDetectedLanguage(activeTab.language);
            const match = supportedLanguages.find(s => s.prism === activeTab.language);
            setIsLanguageSupported(Boolean(match));
            if (match) setLanguage(match);
        }
    }, [activeTab]);

    let editorValue = activeTab ? activeTab.content : (selectedFile?.content || (isPlaceholder ? placeholderText : code));
    if (viewMode === 'project' && selectedFile?.content && !activeTab) {
        editorValue = selectedFile.content;
    }

    // Determine current display language name
    const isSupported = supportedLanguages.some(s => s.prism === detectedLanguage);
    const displayLanguage = detectedLanguage
        ? (isSupported ? (supportedLanguages.find(s => s.prism === detectedLanguage)?.name || detectedLanguage) : "Not supported")
        : "Unallowed";

    const hasContent = activeTab || (selectedFile && selectedFile.content) || hasCode;

    return (
        <div className="flex flex-col h-full w-full gap-2">

            {/* Top Toolbar */}
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
                        <DialogContent>
                            <DialogHeader><DialogTitle>Switch Project</DialogTitle></DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Search Projects</Label>
                                    <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search projects..." />
                                </div>
                                {isGithubConnected && (
                                    <div className="space-y-2">
                                        <Label>GitHub Projects</Label>
                                        <div className="max-h-32 overflow-y-auto border rounded p-2">
                                            {isLoadingRepos ? <p className="text-sm p-2">Loading...</p> : repos.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map(r => (
                                                <div key={r.id} onClick={() => handleSelectRepo(r)} className="p-2 hover:bg-muted cursor-pointer flex justify-between text-sm">
                                                    <span>{r.name}</span>
                                                    <span className="text-muted-foreground">{r.private ? 'Private' : 'Public'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {isGitlabConnected && (
                                    <div className="space-y-2">
                                        <Label>GitLab Projects</Label>
                                        <div className="max-h-32 overflow-y-auto border rounded p-2">
                                            {isLoadingRepos ? <p className="text-sm p-2">Loading...</p> : gitlabRepos.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map(r => (
                                                <div key={r.id} onClick={() => handleSelectGitlabRepo(r)} className="p-2 hover:bg-muted cursor-pointer flex justify-between text-sm">
                                                    <span>{r.name}</span>
                                                    <span className="text-muted-foreground">{r.visibility === 'private' ? 'Private' : 'Public'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {!isGithubConnected && !isGitlabConnected && (
                                    <div className="space-y-2">
                                        <Button onClick={() => signIn('github')}>Connect GitHub</Button>
                                        <Button onClick={() => signIn('gitlab')}>Connect GitLab</Button>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    {isGithubConnected && (
                                        <Button variant="outline" onClick={handleDisconnectGitHub}>Disconnect GitHub</Button>
                                    )}
                                    {isGitlabConnected && (
                                        <Button variant="outline" onClick={handleDisconnectGitlab}>Disconnect GitLab</Button>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 w-full">
                <Card className="flex flex-col h-full w-full overflow-hidden shadow-sm border-border">
                    <CardHeader className="pt-4 pb-4 px-6 shrink-0 border-b bg-card">
                        <div className="flex items-center justify-between gap-4">

                            {/* Left: Lock Control */}
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-lg">Code Editor</CardTitle>
                                <Button
                                    variant={isLocked ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => onLockChange(!isLocked)}
                                    className={isLocked ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                                    disabled={!hasContent}
                                >
                                    {isLocked ? <Lock className="h-3.5 w-3.5 mr-2" /> : <Unlock className="h-3.5 w-3.5 mr-2" />}
                                    {isLocked ? "Locked" : "Lock Code"}
                                </Button>
                            </div>

                            {/* Middle: Language & Config */}
                            <div className="flex items-center gap-6">
                                {/* Language Selector with Status Indicator */}
                                {hasContent && (
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
                                                    {supportedLanguages.map((lang) => (
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
                                )}

                                <div className="h-6 w-px bg-border"></div>

                                {/* Use Case */}
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-muted-foreground">Use Case</span>
                                    <div className="flex items-center gap-2">
                                        <Select value={codeType} onValueChange={setCodeType} disabled={isPlaceholder || isLocked || !hasContent}>
                                            <SelectTrigger className="w-[180px] h-9">
                                                <SelectValue placeholder="Select type..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {codeTypes.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button variant="ghost" size="icon" onClick={async () => { setIsRefreshing(true); try { await refreshUseCases(); } finally { setIsRefreshing(false); } }} disabled={isRefreshing || !hasContent}>
                                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleFormat}
                                                    disabled={isPlaceholder || isFormatting || isLocked || !isLanguageSupported || !hasContent}
                                                >
                                                    <Wand2 className="mr-2 h-4 w-4" /> Format
                                                </Button>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {!isLanguageSupported ? "Formatting is not supported for this programming language" : "Format Code"}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopy}
                                    disabled={isPlaceholder || isCopied || !hasContent}
                                    className="transition-all duration-200"
                                >
                                    {isCopied ? (
                                        <Check className="mr-2 h-4 w-4 text-green-500 animate-in zoom-in duration-300" />
                                    ) : (
                                        <Clipboard className="mr-2 h-4 w-4" />
                                    )}
                                    {isCopied ? "Copied" : "Copy"}
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => onStart(activeTab ? activeTab.content : code, language, codeType)}
                                    // Gating Logic: Must have code, must be locked, must be supported
                                    disabled={!hasCode || isPlaceholder || !isLocked || !isLanguageSupported}
                                    className={(!isLocked || !isLanguageSupported) ? "opacity-70" : ""}
                                    title={!isLocked ? "Lock code to start review" : (!isLanguageSupported ? "Language not supported" : "Start Review")}
                                >
                                    <Play className="mr-2 h-4 w-4" /> Start Review
                                </Button>
                            </div>
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
                                        <button onClick={() => { setOpenTabs([]); setActiveTabId(null); }} className="p-1 hover:bg-accent rounded-md" title="Close All Tabs">
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
                                            const placeholder = `${commentPrefixFor(language.prism)}${BASE_PLACEHOLDER}`;
                                            if (isPlaceholder && current !== placeholder) {
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
