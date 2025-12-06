"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import Editor from "@monaco-editor/react";
import "prismjs/themes/prism.css";
import "@/app/github-theme.css";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Play, Clipboard, Wand2, RefreshCw, Lock, Unlock, Download } from "lucide-react";
import { formatCode } from "@/lib/code-formatter";
import { useSettings, editorThemes, editorFonts, editorFontSizes, syntaxColorPresets } from "@/contexts/settingsContext";
import { useUseCases } from "@/contexts/useCasesContext";
import { useProject } from "@/contexts/projectContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, ChevronDown, File, Folder } from "lucide-react";

export function CodeInput({ code, setCode, codeType, setCodeType, onStart, isLocked, onLockChange }) {
    const [language, setLanguage] = useState({ name: "JavaScript", prism: "javascript" });
    const [isFormatting, setIsFormatting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { settings, mounted: settingsMounted } = useSettings();
    const { useCases, refresh: refreshUseCases } = useUseCases();
    const { projectStructure, setProjectStructure, selectedFile, setSelectedFile, viewMode, setViewMode } = useProject();
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [repoUrl, setRepoUrl] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [currentRepo, setCurrentRepo] = useState(null); // { owner, repo }

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
    ];

    const codeTypes = useCases.map(uc => ({ value: uc.id, label: uc.title }));

    const BASE_PLACEHOLDER = "Enter your code here...";
    const commentPrefixFor = (lang) => {
        switch (lang) {
            case 'python':
                return '# ';
            case 'php':
                return '// ';
            case 'javascript':
            case 'typescript':
            case 'java':
            case 'go':
            case 'c':
            case 'csharp':
            case 'rust':
            default:
                return '// ';
        }
    };

    const hasCode = code && code.trim().length > 0;
    const [isPlaceholder, setIsPlaceholder] = useState(!hasCode);
    const [placeholderText, setPlaceholderText] = useState(() => `${commentPrefixFor('javascript')}${BASE_PLACEHOLDER}`);

    const monacoRef = useRef(null);
    const editorRef = useRef(null);

    // Get current editor configuration from settings
    // Automatically select appropriate theme based on app mode if needed
    const getEditorConfig = useCallback(() => {
        const appMode = settings?.mode || 'light';
        let themeKey = settings?.editorTheme || 'default-dark';

        // Get the selected theme
        let theme = editorThemes[themeKey];

        // If the selected theme doesn't match the app mode, find an appropriate one
        if (theme) {
            const isAppDark = appMode === 'dark';
            const isThemeDark = theme.base === 'vs-dark';

            // If app mode and editor theme mode don't match, switch to a matching theme
            if (isAppDark !== isThemeDark) {
                // Switch to default theme for the current mode
                if (isAppDark) {
                    themeKey = 'default-dark';
                    theme = editorThemes['default-dark'];
                } else {
                    themeKey = 'default-light';
                    theme = editorThemes['default-light'];
                }
            }
        } else {
            // Fallback to default based on app mode
            themeKey = appMode === 'dark' ? 'default-dark' : 'default-light';
            theme = editorThemes[themeKey];
        }

        const fontKey = settings?.editorFont || 'fira-code';
        const fontSizeKey = settings?.editorFontSize || 'md';

        const font = editorFonts[fontKey] || editorFonts['fira-code'];
        const fontSize = editorFontSizes[fontSizeKey]?.size || 16;
        const ligatures = settings?.editorLigatures ?? true;
        const minimap = settings?.editorMinimap ?? true;

        return { theme, font, fontSize, ligatures, minimap, themeKey };
    }, [settings?.editorTheme, settings?.mode, settings?.editorFont, settings?.editorFontSize, settings?.editorLigatures, settings?.editorMinimap]);

    // Get current editor config for rendering
    const editorConfig = useMemo(() => getEditorConfig(), [getEditorConfig]);
    const { theme, font, fontSize, ligatures, minimap, themeKey } = editorConfig;

    // Build Monaco theme from editor config with custom syntax colors
    const buildMonacoTheme = useCallback((editorTheme) => {
        const appMode = settings?.mode || 'light';
        // Get custom syntax colors or fallback to default preset
        const syntaxColors = settings?.customSyntaxColors?.[appMode] || syntaxColorPresets.default[appMode];

        return {
            base: editorTheme.base,
            inherit: true,
            rules: [
                { token: 'comment', foreground: syntaxColors.comment, fontStyle: 'italic' },
                { token: 'keyword', foreground: syntaxColors.keyword, fontStyle: 'bold' },
                { token: 'keyword.control', foreground: syntaxColors.keyword, fontStyle: 'bold' },
                { token: 'string', foreground: syntaxColors.string },
                { token: 'number', foreground: syntaxColors.number },
                { token: 'type', foreground: syntaxColors.type },
                { token: 'function', foreground: syntaxColors.function },
                { token: 'variable', foreground: syntaxColors.variable },
                { token: 'variable.parameter', foreground: syntaxColors.variable },
                { token: 'operator', foreground: syntaxColors.operator },
                { token: 'delimiter', foreground: editorTheme.colors.foreground.replace('#', '') },
                { token: 'identifier', foreground: syntaxColors.variable },
                { token: 'namespace', foreground: syntaxColors.type },
                { token: 'class', foreground: syntaxColors.type, fontStyle: 'bold' },
                { token: 'regexp', foreground: syntaxColors.string },
                { token: 'tag', foreground: syntaxColors.keyword },
                { token: 'attribute.name', foreground: syntaxColors.variable },
                { token: 'attribute.value', foreground: syntaxColors.string },
                { token: 'constant', foreground: syntaxColors.number },
            ],
            colors: {
                'editor.background': editorTheme.colors.background,
                'editor.foreground': editorTheme.colors.foreground,
                'editor.lineHighlightBackground': editorTheme.colors.lineHighlight,
                'editorLineNumber.foreground': editorTheme.colors.lineNumber,
                'editorLineNumber.activeForeground': editorTheme.colors.lineNumberActive,
                'minimap.background': editorTheme.colors.background,
                'editor.stickyScroll.background': editorTheme.colors.background,
                'minimap.selectionHighlight': '#2563eb40',
                'minimap.errorHighlight': '#ef444480',
                'minimap.warningHighlight': '#f59e0b80',
                'minimap.findMatchHighlight': '#22c55e80',
            },
        };
    }, [settings?.mode, settings?.customSyntaxColors]);

    // Apply editor theme when settings change (including app mode and syntax colors)
    useEffect(() => {
        const monaco = monacoRef.current;
        if (monaco && settingsMounted) {
            const monacoTheme = buildMonacoTheme(theme);
            monaco.editor.defineTheme(`custom-${themeKey}`, monacoTheme);
            monaco.editor.setTheme(`custom-${themeKey}`);
        }
    }, [theme, themeKey, settingsMounted, buildMonacoTheme]);

    // Update editor options when font settings change
    useEffect(() => {
        const editor = editorRef.current;
        if (editor && settingsMounted) {
            editor.updateOptions({
                fontFamily: font.family,
                fontSize: fontSize,
                fontLigatures: ligatures && font.ligatures,
                minimap: { enabled: minimap, renderCharacters: false, maxColumn: 120, side: 'right', scale: 2 },
            });
        }
    }, [font, fontSize, ligatures, minimap, settingsMounted]);

    useEffect(() => {
        const nextPlaceholder = `${commentPrefixFor(language.prism)}${BASE_PLACEHOLDER}`;
        setPlaceholderText(nextPlaceholder);

        if (!hasCode) {
            setIsPlaceholder(true);
            setCode("");
        } else {
            setIsPlaceholder(false);
        }
    }, [hasCode, language.prism, setCode]);

    const handleChange = (val) => {
        const next = val ?? "";
        const currentPlaceholder = `${commentPrefixFor(language.prism)}${BASE_PLACEHOLDER}`;

        if (isPlaceholder) {
            if (next !== currentPlaceholder) {
                setIsPlaceholder(false);
                setCode(next);
            } else {
                setCode("");
            }
        } else {
            setCode(next);
        }
    };

    const handleCopy = () => {
        if (hasCode && !isPlaceholder) {
            navigator.clipboard.writeText(code);
        }
    };

    const handleStart = () => {
        if (onStart && hasCode && !isPlaceholder) {
            onStart(code, language, codeType);
        }
    };

    const handleFormat = async () => {
        if (!hasCode || isPlaceholder) {
            return;
        }

        setIsFormatting(true);

        try {
            // Strictly use the backend formatter; no local Monaco fallback or config
            const formattedCode = await formatCode(code, language.prism);
            if (formattedCode) {
                setCode(formattedCode);
            }
        } catch (error) {
            console.error('Error formatting code:', error.message);
            // The error is already logged in formatCode, we just catch it here
        } finally {
            setIsFormatting(false);
        }
    };

    const handleImport = async () => {
        if (!repoUrl.trim()) return;
        setIsImporting(true);
        try {
            const [owner, repo] = repoUrl.split('/');
            if (!owner || !repo) throw new Error('Invalid repo URL format. Use owner/repo');

            const structure = await fetchRepoContents(owner, repo);
            setProjectStructure(structure);
            setCurrentRepo({ owner, repo });
            setViewMode('project');
            setIsImportDialogOpen(false);
            setRepoUrl("");
        } catch (error) {
            console.error('Error importing repo:', error);
            alert('Failed to import repo: ' + error.message);
        } finally {
            setIsImporting(false);
        }
    };

    const fetchRepoContents = async (owner, repo, path = '') => {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
        if (!response.ok) throw new Error('Failed to fetch repo contents');
        const items = await response.json();

        const node = {
            name: path.split('/').pop() || repo,
            path,
            type: 'folder',
            children: []
        };

        for (const item of items) {
            if (item.type === 'file') {
                node.children.push({
                    name: item.name,
                    path: item.path,
                    type: 'file',
                    content: null // Will load on demand
                });
            } else if (item.type === 'dir') {
                const child = await fetchRepoContents(owner, repo, item.path);
                node.children.push(child);
            }
        }

        return node;
    };

    const loadFileContent = async (file) => {
        if (!currentRepo) throw new Error('No repo selected');
        const { owner, repo } = currentRepo;
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`);
        if (!response.ok) throw new Error('Failed to fetch file content');
        const data = await response.json();
        const content = atob(data.content); // Decode base64
        return { ...file, content };
    };

    // Switch button UI
    const SwitchButton = () => (
        <div className="flex gap-2 mb-2">
            <button
                className={`px-3 py-1 rounded ${viewMode === 'project' ? 'bg-primary text-white' : 'bg-muted'}`}
                onClick={() => setViewMode('project')}
            >
                Project View
            </button>
            <button
                className={`px-3 py-1 rounded ${viewMode === 'file' ? 'bg-primary text-white' : 'bg-muted'}`}
                onClick={() => setViewMode('file')}
            >
                One File View
            </button>
        </div>
    );

    // Improved renderTree with shadcn Collapsible
    const renderTree = (node) => {
        if (!node) return null;
        if (node.type === 'file') {
            return (
                <div
                    key={node.path}
                    className={`flex items-center gap-2 pl-4 py-1 cursor-pointer hover:bg-muted rounded ${selectedFile?.path === node.path ? 'bg-accent' : ''}`}
                    onClick={async () => {
                        try {
                            const fileWithContent = await loadFileContent(node);
                            setSelectedFile(fileWithContent);
                        } catch (error) {
                            console.error('Error loading file:', error);
                            alert('Failed to load file content');
                        }
                    }}
                >
                    <File className="h-4 w-4" />
                    <span className="text-sm">{node.name}</span>
                </div>
            );
        }
        return (
            <Collapsible key={node.path} className="pl-2">
                <CollapsibleTrigger className="flex items-center gap-2 py-1 hover:bg-muted rounded w-full text-left data-[state=open]:rotate-90">
                    <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                    <Folder className="h-4 w-4" />
                    <span className="text-sm font-medium">{node.name}</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-4">
                    {node.children?.map(renderTree)}
                </CollapsibleContent>
            </Collapsible>
        );
    };

    // Editor value logic
    let editorValue = code;
    if (viewMode === 'project' && selectedFile?.content) {
        editorValue = selectedFile.content;
    }
    if (isPlaceholder) {
        editorValue = placeholderText;
    }

    return (
        <div className="flex flex-col h-full w-full p-4">
            <div className="flex gap-2 mb-2">
                <SwitchButton />
                <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Import Repo
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Import GitHub Repository</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="repo-url">Repository URL (owner/repo)</Label>
                                <Input
                                    id="repo-url"
                                    placeholder="e.g., facebook/react"
                                    value={repoUrl}
                                    onChange={(e) => setRepoUrl(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleImport} disabled={isImporting} className="w-full">
                                {isImporting ? 'Importing...' : 'Import'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="flex flex-row h-full w-full">
                {viewMode === 'project' && projectStructure && (
                    <div className="w-64 border-r bg-muted overflow-y-auto p-2">
                        {renderTree(projectStructure)}
                    </div>
                )}
                <div className="flex-1 flex flex-col">
                    <Card className="flex-1 flex flex-col overflow-hidden min-h-0 w-full gap-0 py-0">
                        <CardHeader className="pt-6">
                            <div className="flex items-center justify-between gap-4">
                                {/* Left side - Title and Lock */}
                                <div className="flex items-center gap-3">
                                    <CardTitle>Code Editor</CardTitle>
                                    <Button
                                        variant={isLocked ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => onLockChange(!isLocked)}
                                        className={isLocked ? "bg-red-500 hover:bg-red-600" : ""}
                                        disabled={!hasCode}
                                    >
                                        {isLocked ? <Lock className="h-4 w-4 mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
                                        {isLocked ? "Locked" : "Lock Code"}
                                    </Button>
                                </div>

                                {/* Center - Language and Code Type controls */}
                                <div className="flex items-center gap-6">
                                    {/* Language Group */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col">
                                            <span className="text-xxl font-medium text-muted-foreground">Language</span>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" disabled={isLocked}>
                                                    {language.name}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                {supportedLanguages.map((lang) => (
                                                    <DropdownMenuItem
                                                        key={lang.name}
                                                        onClick={() => setLanguage(lang)}
                                                        disabled={isLocked}
                                                    >
                                                        {lang.name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Separator */}
                                    <div className="h-8 w-px bg-border"></div>

                                    {/* Code Type Group */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col">
                                            <span className="text-xxl font-medium text-muted-foreground">Code use case</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Select value={codeType} onValueChange={setCodeType} disabled={!hasCode || isPlaceholder}>
                                                <SelectTrigger className="w-[160px] h-8">
                                                    <SelectValue placeholder="Select type..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {codeTypes.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => {
                                                    setIsRefreshing(true);
                                                    refreshUseCases();
                                                    setTimeout(() => setIsRefreshing(false), 1500);
                                                }}
                                                title="Refresh use cases"
                                                disabled={isRefreshing || !hasCode}
                                            >
                                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right side - Action buttons */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleFormat}
                                        disabled={!hasCode || isPlaceholder || isFormatting || isLocked}
                                    >
                                        <Wand2 className="mr-2 h-4 w-4" />
                                        Format
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleCopy} disabled={!hasCode || isPlaceholder}>
                                        <Clipboard className="mr-2 h-4 w-4" />
                                        Copy
                                    </Button>
                                    <Button onClick={handleStart} disabled={!hasCode || isPlaceholder || !isLocked} size="sm">
                                        <Play className="mr-2 h-4 w-4" />
                                        Start Review
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden min-h-0 p-6">
                            <div className="relative h-full w-full">
                                <Editor
                                    key={`${language.prism}-${themeKey}`}
                                    language={language.prism}
                                    value={editorValue}
                                    onChange={handleChange}
                                    theme={`custom-${themeKey}`}
                                    options={{
                                        fontFamily: font.family,
                                        fontSize: fontSize,
                                        fontLigatures: ligatures && font.ligatures,
                                        lineHeight: Math.round(fontSize * 1.6),
                                        wordWrap: 'on',
                                        minimap: { enabled: minimap, renderCharacters: false, maxColumn: 120, side: 'right', scale: 2 },
                                        scrollbar: { vertical: 'auto', horizontal: 'auto' },
                                        smoothScrolling: true,
                                        cursorBlinking: 'phase',
                                        renderWhitespace: 'selection',
                                        automaticLayout: true,
                                        suggestOnTriggerCharacters: true,
                                        quickSuggestions: true,
                                        parameterHints: { enabled: true },
                                        readOnly: isLocked,
                                        // Explicitly disabling Monaco's default formatting behaviors
                                        formatOnPaste: false,
                                        formatOnType: false,
                                    }}
                                    beforeMount={(monaco) => {
                                        // Define theme BEFORE the editor mounts to avoid race condition
                                        const monacoTheme = buildMonacoTheme(theme);
                                        monaco.editor.defineTheme(`custom-${themeKey}`, monacoTheme);
                                    }}
                                    onMount={(editor, monaco) => {
                                        monacoRef.current = monaco;
                                        editorRef.current = editor;

                                        // Set the correct theme
                                        monaco.editor.setTheme(`custom-${themeKey}`);

                                        // Keep keyboard shortcut but point it to our API handler
                                        editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
                                            if (hasCode && !isPlaceholder) {
                                                handleFormat();
                                            }
                                        });

                                        editor.onDidFocusEditorText(() => {
                                            if (isPlaceholder) {
                                                setIsPlaceholder(false);
                                                setCode("");
                                                editor.setValue("");
                                            }
                                        });

                                        editor.onDidChangeModelContent(() => {
                                            const current = editor.getValue();
                                            const currentPlaceholder = `${commentPrefixFor(language.prism)}${BASE_PLACEHOLDER}`;
                                            if (isPlaceholder && current !== currentPlaceholder) {
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
        </div>
    );
}
