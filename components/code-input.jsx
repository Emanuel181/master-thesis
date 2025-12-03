"use client"

import React, { useState } from "react"
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
import { Play, Clipboard } from "lucide-react";

export function CodeInput({ code, setCode, codeType, setCodeType, onStart }) {
    const [language, setLanguage] = useState({ name: "JavaScript", prism: "javascript" });
    const [isCopied, setIsCopied] = useState(false);

    const supportedLanguages = [
        { name: "JavaScript", prism: "javascript" },
        { name: "Python", prism: "python" },
        { name: "Go", prism: "go" },
        { name: "Java", prism: "java" },
    ];

    const codeTypes = knowledgeBaseUseCases.map(uc => ({ value: uc.id, label: uc.name }));

    const BASE_PLACEHOLDER = "Enter your code here...";
    const commentPrefixFor = (lang) => {
        switch (lang) {
            case 'python':
                return '# ';
            case 'javascript':
            case 'java':
            case 'go':
            default:
                return '// ';
        }
    };

    const hasCode = code && code.trim().length > 0;
    const [isPlaceholder, setIsPlaceholder] = useState(!hasCode);
    const [placeholderText, setPlaceholderText] = useState(() => `${commentPrefixFor('javascript')}${BASE_PLACEHOLDER}`);

    // detect dark mode for Monaco theme
    const [isDarkMode, setIsDarkMode] = React.useState(false);
    const monacoRef = React.useRef(null);
    const editorRef = React.useRef(null);
    React.useEffect(() => {
        const checkDarkMode = () => {
            const isDark = document.documentElement.classList.contains('dark');
            setIsDarkMode(isDark);
            // apply theme if monaco is ready
            const monaco = monacoRef.current;
            if (monaco) {
                const darkTheme = {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [],
                    colors: {
                        'editor.background': '#171717',
                        'minimap.background': '#171717',
                        'editor.stickyScroll.background': '#171717',
                        'minimap.selectionHighlight': '#2563eb40',
                        'minimap.errorHighlight': '#ef444480',
                        'minimap.warningHighlight': '#f59e0b80',
                        'minimap.findMatchHighlight': '#22c55e80',
                    },
                };
                const lightTheme = {
                    base: 'vs',
                    inherit: true,
                    rules: [],
                    colors: {
                        'editor.background': '#ffffff',
                        'minimap.background': '#ffffff',
                        'editor.stickyScroll.background': '#ffffff',
                        'minimap.selectionHighlight': '#3b82f680',
                        'minimap.errorHighlight': '#dc262680',
                        'minimap.warningHighlight': '#d9770680',
                        'minimap.findMatchHighlight': '#16a34a80',
                    },
                };
                monaco.editor.defineTheme('custom-dark', darkTheme);
                monaco.editor.defineTheme('custom-light', lightTheme);
                monaco.editor.setTheme(isDark ? 'custom-dark' : 'custom-light');
            }
        };
        checkDarkMode();
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    React.useEffect(() => {
        if (monacoRef.current) {
            monacoRef.current.editor.setTheme(isDarkMode ? 'custom-dark' : 'custom-light');
        }
    }, [isDarkMode]);

    React.useEffect(() => {
        // Update placeholder to match current language
        const nextPlaceholder = `${commentPrefixFor(language.prism)}${BASE_PLACEHOLDER}`;
        setPlaceholderText(nextPlaceholder);

        if (!hasCode) {
            // If no code, show the placeholder
            setIsPlaceholder(true);
            setCode("");
        } else {
            // If code exists, keep showing code (not placeholder)
            setIsPlaceholder(false);
        }
    }, [hasCode, language.prism, setCode]);

    const handleChange = (val) => {
        const next = val ?? "";
        const currentPlaceholder = `${commentPrefixFor(language.prism)}${BASE_PLACEHOLDER}`;

        if (isPlaceholder) {
            // if user types something different than placeholder, switch off placeholder
            if (next !== currentPlaceholder) {
                setIsPlaceholder(false);
                setCode(next);
            } else {
                // keep placeholder, but don't propagate as code
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

    const editorValue = isPlaceholder ? placeholderText : code;

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
                            key={language.prism}

                            language={language.prism}
                            value={editorValue}
                            onChange={handleChange}
                            theme={isDarkMode ? "custom-dark" : "custom-light"}
                            options={{
                                fontFamily: '"Fira Code", "Fira Mono", monospace',
                                fontSize: 16,
                                lineHeight: 26,
                                wordWrap: 'on',
                                minimap: { enabled: true, renderCharacters: false, maxColumn: 120, side: 'right', scale: 2 },
                                scrollbar: { vertical: 'auto', horizontal: 'auto' },
                                smoothScrolling: true,
                                cursorBlinking: 'phase',
                                renderWhitespace: 'selection',
                                tabSize: 2,
                                insertSpaces: true,
                                automaticLayout: true,
                                suggestOnTriggerCharacters: true,
                                quickSuggestions: true,
                                parameterHints: { enabled: true },
                                formatOnPaste: true,
                                formatOnType: true,
                            }}
                            onMount={(editor, monaco) => {
                                monacoRef.current = monaco;
                                editorRef.current = editor;
                                // Define and set theme for initial render
                                const darkTheme = {
                                    base: 'vs-dark',
                                    inherit: true,
                                    rules: [],
                                    colors: {
                                        'editor.background': '#171717',
                                        'minimap.background': '#171717',
                                        'editor.stickyScroll.background': '#171717',
                                        'minimap.selectionHighlight': '#2563eb40',
                                        'minimap.errorHighlight': '#ef444480',
                                        'minimap.warningHighlight': '#f59e0b80',
                                        'minimap.findMatchHighlight': '#22c55e80',
                                    },
                                };
                                const lightTheme = {
                                    base: 'vs',
                                    inherit: true,
                                    rules: [],
                                    colors: {
                                        'editor.background': '#00000000', // transparent
                                        'editor.stickyScroll.background': '#ffffff',
                                        'minimap.background': '#00000000',
                                        'minimap.selectionHighlight': '#3b82f680',
                                        'minimap.errorHighlight': '#dc262680',
                                        'minimap.warningHighlight': '#d9770680',
                                        'minimap.findMatchHighlight': '#16a34a80',
                                    },
                                };
                                monaco.editor.defineTheme('custom-dark', darkTheme);
                                monaco.editor.defineTheme('custom-light', lightTheme);
                                monaco.editor.setTheme(isDarkMode ? 'custom-dark' : 'custom-light');

                                // Clear placeholder on initial user input
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