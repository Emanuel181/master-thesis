"use client"

import React, { useState, useEffect, useRef } from "react"
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
import { knowledgeBaseUseCases } from "@/lib/knowledge-base-cases";
import { Play, Clipboard, Wand2 } from "lucide-react";
import { formatCode } from "@/lib/code-formatter";
import { useSettings, editorThemes, editorFonts, editorFontSizes, syntaxColorPresets } from "@/contexts/settingsContext";

export function CodeInput({ code, setCode, codeType, setCodeType, onStart }) {
    const [language, setLanguage] = useState({ name: "JavaScript", prism: "javascript" });
    const [isCopied, setIsCopied] = useState(false);
    const [isFormatting, setIsFormatting] = useState(false);

    // Get editor settings from context
    const { settings, mounted: settingsMounted } = useSettings();

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

    const codeTypes = knowledgeBaseUseCases.map(uc => ({ value: uc.id, label: uc.name }));

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
    const getEditorConfig = () => {
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
    };

    // Build Monaco theme from editor config with custom syntax colors
    const buildMonacoTheme = (editorTheme) => {
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
    };


    // Apply editor theme when settings change (including app mode and syntax colors)
    useEffect(() => {
        const monaco = monacoRef.current;
        if (monaco && settingsMounted) {
            const { theme, themeKey } = getEditorConfig();
            const monacoTheme = buildMonacoTheme(theme);
            monaco.editor.defineTheme(`custom-${themeKey}`, monacoTheme);
            monaco.editor.setTheme(`custom-${themeKey}`);
        }
    }, [settings?.editorTheme, settings?.mode, settings?.customSyntaxColors, settings?.syntaxColorPreset, settingsMounted]);

    // Update editor options when font settings change
    useEffect(() => {
        const editor = editorRef.current;
        if (editor && settingsMounted) {
            const { font, fontSize, ligatures, minimap } = getEditorConfig();
            editor.updateOptions({
                fontFamily: font.family,
                fontSize: fontSize,
                fontLigatures: ligatures && font.ligatures,
                minimap: { enabled: minimap, renderCharacters: false, maxColumn: 120, side: 'right', scale: 2 },
            });
        }
    }, [settings?.editorFont, settings?.editorFontSize, settings?.editorLigatures, settings?.editorMinimap, settingsMounted]);

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
            navigator.clipboard.writeText(code).then(() => {
                setIsCopied(true);
                setTimeout(() => {
                    setIsCopied(false);
                }, 2000);
            });
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

    const editorValue = isPlaceholder ? placeholderText : code;

    // Get current editor config for rendering
    const { theme, font, fontSize, ligatures, minimap, themeKey } = getEditorConfig();

    return (
        <div className="flex flex-col h-full w-full p-4">
            <Card className="flex-1 flex flex-col overflow-hidden min-h-0 w-full gap-0 py-0">
                <CardHeader className="pt-6">
                    <div className="flex justify-between items-center">
                        <CardTitle>Code Editor</CardTitle>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Language:</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">{language.name}</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {supportedLanguages.map((lang) => (
                                        <DropdownMenuItem
                                            key={lang.name}
                                            onClick={() => setLanguage(lang)}
                                        >
                                            {lang.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <span className="text-sm font-medium text-muted-foreground">Code Type:</span>
                            <Select value={codeType} onValueChange={setCodeType} disabled={!hasCode || isPlaceholder}>
                                <SelectTrigger className="w-[180px]">
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
                                onClick={handleFormat}
                                disabled={!hasCode || isPlaceholder || isFormatting}
                            >
                                <Wand2 className="mr-2 h-4 w-4" />
                                {isFormatting ? 'Formatting...' : 'Format'}
                            </Button>
                            <Button variant="outline" onClick={handleCopy} disabled={!hasCode || isPlaceholder}>
                                <Clipboard className="mr-2 h-4 w-4" />
                                {isCopied ? "Copied!" : "Copy"}
                            </Button>
                            <Button onClick={handleStart} disabled={!hasCode || isPlaceholder}>
                                <Play className="mr-2 h-4 w-4" />
                                Start agentic review
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
    )
}