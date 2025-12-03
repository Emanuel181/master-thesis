"use client"

import React, { useState } from "react"
import Editor from "react-simple-code-editor"
import { highlight, languages } from "prismjs/components/prism-core"
import "prismjs/components/prism-clike"
import "prismjs/components/prism-javascript"
import "prismjs/themes/prism.css" //Example style, you can use another

import "prismjs/components/prism-python";
import "prismjs/components/prism-go";
import "prismjs/components/prism-java";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function CodeInput() {
    const [code, setCode] = useState(
        `// Write your code here`
    );
    const [language, setLanguage] = useState({ name: "JavaScript", prism: languages.js });

    const supportedLanguages = [
        { name: "JavaScript", prism: languages.js },
        { name: "Python", prism: languages.python },
        { name: "Go", prism: languages.go },
        { name: "Java", prism: languages.java },
    ];

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex-1 rounded-xl bg-muted/50 p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Code Editor</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Programming language:</span>
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
                    </div>
                </div>
                <div style={{
                    position: 'relative',
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                }}>
                    <Editor
                        value={code}
                        onValueChange={code => setCode(code)}
                        highlight={code => highlight(code, language.prism)}
                        padding={{ top: 10, bottom: 10, left: 40, right: 10 }}
                        style={{
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 12,
                            lineHeight: '1.5',
                            backgroundColor: '#f5f5f5',
                        }}
                        preClassName={`language-${language.name.toLowerCase()}`}
                    />
                     <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                        fontSize: 12,
                        lineHeight: '1.5',
                        color: '#999',
                        textAlign: 'right',
                        userSelect: 'none',
                    }}>
                        {code.split('\n').map((_, i) => (
                            <div key={i + 1}>{i + 1}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

