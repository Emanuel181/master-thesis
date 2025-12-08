"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import Editor from "@monaco-editor/react";
import "prismjs/themes/prism.css";
import "@/app/github-theme.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Play, Clipboard, Wand2, RefreshCw, Lock, Unlock, Download, Check, AlertTriangle, FileCode2, FolderOpen } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { formatCode } from "@/lib/code-formatter";
import { useSettings, editorThemes, editorFonts, editorFontSizes, syntaxColorPresets } from "@/contexts/settingsContext";
import { useUseCases } from "@/contexts/useCasesContext";
import { useProject } from "@/contexts/projectContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession, signIn } from 'next-auth/react';
import { fetchRepoTree as apiFetchRepoTree, fetchFileContent as apiFetchFileContent } from '../../../lib/github-api';
import ProjectTree from './project-tree';
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner"

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
    const { settings, mounted: settingsMounted } = useSettings();
    const { useCases, refresh: refreshUseCases } = useUseCases();
    const { projectStructure, setProjectStructure, selectedFile, setSelectedFile, viewMode, setViewMode, currentRepo, setCurrentRepo } = useProject();
    const { data: session } = useSession();

    // --- Import State ---
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [repos, setRepos] = useState([]);
    const [isLoadingRepos, setIsLoadingRepos] = useState(false);
    const [loadingFilePath, setLoadingFilePath] = useState(null);

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

    useEffect(() => {
        const monaco = monacoRef.current;
        if (monaco && settingsMounted) {
            const monacoTheme = buildMonacoTheme(theme);
            monaco.editor.defineTheme(`custom-${themeKey}`, monacoTheme);
            monaco.editor.setTheme(`custom-${themeKey}`);
        }
    }, [theme, themeKey, settingsMounted, buildMonacoTheme]);

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
        if (!hasCode || isPlaceholder) return;
        setIsFormatting(true);
        try {
            const formattedCode = await formatCode(code, language.prism);
            if (formattedCode) setCode(formattedCode);
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

    useEffect(() => {
        if (isImportDialogOpen && session && repos.length === 0) loadRepos();
    }, [isImportDialogOpen, session, repos.length]);

    const handleImport = async () => {
        if (!searchTerm.trim() || !session) return;
        setIsImporting(true);
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
        } finally {
            setIsImporting(false);
        }
    };

    const handleSelectRepo = async (repo) => {
        setIsImporting(true);
        try {
            const structure = await apiFetchRepoTree(repo.owner.login, repo.name);
            setProjectStructure(structure);
            setCurrentRepo({ owner: repo.owner.login, repo: repo.name });
            setViewMode('project');
            setIsImportDialogOpen(false);
            toast.success("Project switched successfully!");
        } catch (error) {
            toast.error("Failed to switch project: " + error.message);
        } finally {
            setIsImporting(false);
        }
    };

    const onFileClick = async (node) => {
        if (loadingFilePath === node.path) return;
        setLoadingFilePath(node.path);
        try {
            const fileWithContent = await apiFetchFileContent(currentRepo.owner, currentRepo.repo, node.path);
            setSelectedFile(fileWithContent);

            // Trigger detection immediately
            const lang = detectLanguageFromContent(fileWithContent.name, fileWithContent.content);
            if (lang) {
                setDetectedLanguage(lang);
                const match = supportedLanguages.find(s => s.prism === lang);
                const isSupported = Boolean(match);
                setIsLanguageSupported(isSupported);
                if (isSupported && match) setLanguage(match);
            }
            setViewMode('project');
        } catch (err) { console.error(err); }
        finally { setLoadingFilePath(null); }
    };

    let editorValue = selectedFile?.content || (isPlaceholder ? placeholderText : code);
    if (viewMode === 'project' && selectedFile?.content) {
        editorValue = selectedFile.content;
    }

    // Determine current display language name
    const isSupported = supportedLanguages.some(s => s.prism === detectedLanguage);
    const displayLanguage = detectedLanguage
        ? (isSupported ? (supportedLanguages.find(s => s.prism === detectedLanguage)?.name || detectedLanguage) : "Not supported")
        : "Unallowed";

    return (
        <div className="flex flex-col h-full w-full gap-2">

            {/* Top Toolbar */}
            <div className="flex justify-between items-center w-full">
                <div className="flex gap-2">
                    <Button
                        variant={viewMode === 'project' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode('project')}
                    >
                        Project View
                    </Button>
                    <Button
                        variant={viewMode === 'file' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode('file')}
                    >
                        One File View
                    </Button>
                </div>

                {viewMode === 'project' && (
                    <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <FolderOpen className="mr-2 h-4 w-4" /> Switch project
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Switch Project</DialogTitle></DialogHeader>
                            {!session ? (
                                <Button onClick={() => signIn('github')}>Connect GitHub</Button>
                            ) : (
                                <div className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label>Search Projects</Label>
                                        <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search projects..." />
                                        <div className="max-h-48 overflow-y-auto border rounded p-2">
                                            {isLoadingRepos ? <p className="text-sm p-2">Loading...</p> : repos.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map(r => (
                                                <div key={r.id} onClick={() => handleSelectRepo(r)} className="p-2 hover:bg-muted cursor-pointer flex justify-between text-sm">
                                                    <span>{r.name}</span>
                                                    <span className="text-muted-foreground">{r.private ? 'Private' : 'Public'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                    disabled={!hasCode}
                                >
                                    {isLocked ? <Lock className="h-3.5 w-3.5 mr-2" /> : <Unlock className="h-3.5 w-3.5 mr-2" />}
                                    {isLocked ? "Locked" : "Lock Code"}
                                </Button>
                            </div>

                            {/* Middle: Language & Config */}
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

                                <div className="h-6 w-px bg-border"></div>

                                {/* Use Case */}
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-muted-foreground">Use Case</span>
                                    <div className="flex items-center gap-2">
                                        <Select value={codeType} onValueChange={setCodeType} disabled={!hasCode || isPlaceholder}>
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
                                                    disabled={!hasCode || isPlaceholder || isFormatting || isLocked || !isLanguageSupported}
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
                                    disabled={!hasCode || isPlaceholder || isCopied}
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
                                    onClick={() => onStart(code, language, codeType)}
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
                    <CardContent className="flex-1 p-0 flex flex-row overflow-hidden relative">
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
                            />
                        )}

                        <div className={`flex-1 min-w-0 h-full relative bg-background ${isTreeResizing ? 'pointer-events-none select-none' : ''}`}>
                            <Editor
                                key={`${language.prism}-${themeKey}`}
                                language={language.prism}
                                value={editorValue}
                                onChange={(val) => {
                                    if (!isPlaceholder && val !== undefined) setCode(val);
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
                                    const monacoTheme = buildMonacoTheme(editorThemes[settings.editorTheme]);
                                    monaco.editor.defineTheme(`custom-${settings.editorTheme}`, monacoTheme);
                                    monaco.editor.setTheme(`custom-${settings.editorTheme}`);
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
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

